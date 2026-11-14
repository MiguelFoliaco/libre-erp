import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { hashPassword } from '../../auth/password';
import { PG_POOL } from '../../database/database.module';
import {
  AuthorizationContext,
  AuthorizationService,
} from '../authorization/authorization.service';
import {
  assertAssignableActions,
  CrudAction,
} from '../authorization/permissions';

interface ColumnInfo {
  column_name: string;
  is_generated: string;
  is_identity: string;
}

type JsonRecord = Record<string, unknown>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SERVER_MANAGED_FIELDS = new Set([
  'id',
  'created_at',
  'updated_at',
  'last_login_at',
  'password_hash',
]);

const GLOBAL_TABLES = new Set(['document_types_people', 'customer_types']);

function quoteIdentifier(identifier: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
    throw new Error('Invalid database identifier');
  }
  return `"${identifier}"`;
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Request body must be a JSON object');
  }
  return value as JsonRecord;
}

function normalizeDatabaseError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (code === '23505') {
      throw new ConflictException('A record with the same unique value exists');
    }
    if (
      code === '23503' ||
      code === '23514' ||
      code === '23502' ||
      code === '22P02'
    ) {
      throw new BadRequestException(
        'The record violates a database constraint',
      );
    }
  }
  throw error;
}

@Injectable()
export class CrudService {
  private readonly columnsCache = new Map<string, Promise<ColumnInfo[]>>();

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async list(
    userId: string,
    resourceName: string,
    limitValue?: string,
    offsetValue?: string,
  ) {
    const { resource, context } = await this.authorize(
      userId,
      resourceName,
      'READ',
    );
    const limit = this.parsePaginationValue(limitValue, 50, 200);
    const offset = this.parsePaginationValue(offsetValue, 0, 1_000_000);
    const columns = await this.columns(resource.table);
    const scope = this.scopeWhere(columns, context, 1, resource.table);
    const values: unknown[] = [...scope.values, limit, offset];
    const result = await this.pool.query(
      `SELECT * FROM ${quoteIdentifier(resource.table)}
       ${scope.sql ? `WHERE ${scope.sql}` : ''}
       ORDER BY "id"
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    return {
      items: result.rows.map((row) => this.publicRow(resource.table, row)),
      limit,
      offset,
    };
  }

  async get(userId: string, resourceName: string, id: string) {
    const { resource, context } = await this.authorize(
      userId,
      resourceName,
      'READ',
    );
    this.validateId(id);
    const columns = await this.columns(resource.table);
    const scope = this.scopeWhere(columns, context, 2, resource.table);
    const result = await this.pool.query(
      `SELECT * FROM ${quoteIdentifier(resource.table)}
       WHERE "id" = $1${scope.sql ? ` AND ${scope.sql}` : ''}
       LIMIT 1`,
      [id, ...scope.values],
    );
    if (result.rowCount !== 1) {
      throw new NotFoundException('Record not found');
    }
    return this.publicRow(resource.table, result.rows[0]);
  }

  async create(userId: string, resourceName: string, input: unknown) {
    const { resource, context } = await this.authorize(
      userId,
      resourceName,
      'INSERT',
    );
    const body = asRecord(input);
    const columns = await this.columns(resource.table);
    this.assertScopedWrite(resource.table, columns, context);
    await this.assertRoleAssignment(context, resource.table, body);

    if (resource.table === 'customers' && body.person) {
      return this.createCustomer(context, body, columns);
    }
    if (resource.table === 'users' && body.person) {
      return this.createUserWithPerson(context, body, columns);
    }

    return this.insertRecord(context, resource.table, body, columns);
  }

  async update(
    userId: string,
    resourceName: string,
    id: string,
    input: unknown,
  ) {
    const { resource, context } = await this.authorize(
      userId,
      resourceName,
      'UPDATE',
    );
    this.validateId(id);
    const body = asRecord(input);
    const columns = await this.columns(resource.table);
    this.assertScopedWrite(resource.table, columns, context);
    await this.assertRoleAssignment(context, resource.table, body, id);
    const values = await this.prepareWriteValues(
      context,
      resource.table,
      body,
      columns,
      true,
    );
    if (values.length === 0) {
      throw new BadRequestException('No updateable fields were provided');
    }

    const parameters = values.map((entry) => entry.value);
    const setClauses = values.map(
      (entry, index) => `${quoteIdentifier(entry.column)} = $${index + 1}`,
    );
    if (columns.some(({ column_name }) => column_name === 'updated_at')) {
      setClauses.push('"updated_at" = NOW()');
    }
    const scope = this.scopeWhere(
      columns,
      context,
      parameters.length + 2,
      resource.table,
    );
    let result;
    try {
      result = await this.pool.query(
        `UPDATE ${quoteIdentifier(resource.table)}
         SET ${setClauses.join(', ')}
         WHERE "id" = $${parameters.length + 1}${scope.sql ? ` AND ${scope.sql}` : ''}
         RETURNING *`,
        [...parameters, id, ...scope.values],
      );
    } catch (error) {
      normalizeDatabaseError(error);
    }
    if (result.rowCount !== 1) {
      throw new NotFoundException('Record not found');
    }
    return this.publicRow(resource.table, result.rows[0]);
  }

  async remove(userId: string, resourceName: string, id: string) {
    const { resource, context } = await this.authorize(
      userId,
      resourceName,
      'DELETE',
    );
    this.validateId(id);
    const columns = await this.columns(resource.table);
    this.assertScopedWrite(resource.table, columns, context);
    const scope = this.scopeWhere(columns, context, 2, resource.table);
    let result;
    try {
      result = await this.pool.query(
        `DELETE FROM ${quoteIdentifier(resource.table)}
         WHERE "id" = $1${scope.sql ? ` AND ${scope.sql}` : ''}
         RETURNING "id"`,
        [id, ...scope.values],
      );
    } catch (error) {
      normalizeDatabaseError(error);
    }
    if (result.rowCount !== 1) {
      throw new NotFoundException('Record not found');
    }
    return { deleted: true };
  }

  private async createCustomer(
    context: AuthorizationContext,
    body: JsonRecord,
    customerColumns: ColumnInfo[],
  ) {
    const person = asRecord(body.person);
    const customer = { ...body };
    delete customer.person;
    const columns = await this.columns('people');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const personValues = await this.prepareWriteValues(
        context,
        'people',
        person,
        columns,
        false,
      );
      const insertedPerson = await this.insertWithClient(
        client,
        context,
        'people',
        personValues,
        columns,
      );
      customer.personId = insertedPerson.id;
      const customerValues = await this.prepareWriteValues(
        context,
        'customers',
        customer,
        customerColumns,
        false,
      );
      const insertedCustomer = await this.insertWithClient(
        client,
        context,
        'customers',
        customerValues,
        customerColumns,
      );
      await client.query('COMMIT');
      return insertedCustomer;
    } catch (error) {
      await client.query('ROLLBACK');
      normalizeDatabaseError(error);
    } finally {
      client.release();
    }
  }

  private async createUserWithPerson(
    context: AuthorizationContext,
    body: JsonRecord,
    userColumns: ColumnInfo[],
  ) {
    const person = asRecord(body.person);
    const user = { ...body };
    delete user.person;
    const personColumns = await this.columns('people');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const personValues = await this.prepareWriteValues(
        context,
        'people',
        person,
        personColumns,
        false,
      );
      const insertedPerson = await this.insertWithClient(
        client,
        context,
        'people',
        personValues,
        personColumns,
      );
      user.personId = insertedPerson.id;
      const userValues = await this.prepareWriteValues(
        context,
        'users',
        user,
        userColumns,
        false,
      );
      const insertedUser = await this.insertWithClient(
        client,
        context,
        'users',
        userValues,
        userColumns,
      );
      await client.query('COMMIT');
      return insertedUser;
    } catch (error) {
      await client.query('ROLLBACK');
      normalizeDatabaseError(error);
    } finally {
      client.release();
    }
  }

  private async insertRecord(
    context: AuthorizationContext,
    table: string,
    body: JsonRecord,
    columns: ColumnInfo[],
  ) {
    try {
      const values = await this.prepareWriteValues(
        context,
        table,
        body,
        columns,
        false,
      );
      return await this.insertWithClient(null, context, table, values, columns);
    } catch (error) {
      normalizeDatabaseError(error);
    }
  }

  private async insertWithClient(
    client: PoolClient | null,
    context: AuthorizationContext,
    table: string,
    values: { column: string; value: unknown }[],
    columns: ColumnInfo[],
  ): Promise<JsonRecord> {
    if (values.length === 0) {
      throw new BadRequestException('No values were provided');
    }
    const queryable = client ?? this.pool;
    const updatedValues = [...values];
    const availableColumns = new Set(
      columns.map(({ column_name }) => column_name),
    );
    if (availableColumns.has('company_id')) {
      updatedValues.push({ column: 'company_id', value: context.companyId });
    }
    if (availableColumns.has('environment_id')) {
      updatedValues.push({
        column: 'environment_id',
        value: context.environmentId,
      });
    }
    if (availableColumns.has('created_by')) {
      updatedValues.push({ column: 'created_by', value: context.userId });
    }
    if (availableColumns.has('actor_user_id')) {
      updatedValues.push({ column: 'actor_user_id', value: context.userId });
    }

    const columnSql = updatedValues
      .map(({ column }) => quoteIdentifier(column))
      .join(', ');
    const placeholders = updatedValues
      .map((_, index) => `$${index + 1}`)
      .join(', ');
    const result = await queryable.query(
      `INSERT INTO ${quoteIdentifier(table)} (${columnSql})
       VALUES (${placeholders}) RETURNING *`,
      updatedValues.map(({ value }) => value),
    );
    return this.publicRow(table, result.rows[0]);
  }

  private async prepareWriteValues(
    context: AuthorizationContext,
    table: string,
    body: JsonRecord,
    columns: ColumnInfo[],
    updating: boolean,
  ) {
    const availableColumns = new Set(
      columns.map(({ column_name }) => column_name),
    );
    const values: { column: string; value: unknown }[] = [];
    const seenColumns = new Set<string>();

    for (const [inputKey, value] of Object.entries(body)) {
      const key = inputKey.includes('_')
        ? inputKey
        : inputKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      if (key === 'password' && table === 'users' && !updating) {
        if (
          typeof value !== 'string' ||
          value.length < 12 ||
          value.length > 1024
        ) {
          throw new BadRequestException(
            'New user password must contain at least 12 characters',
          );
        }
        values.push({
          column: 'password_hash',
          value: await hashPassword(value),
        });
        continue;
      }
      if (key === 'password') {
        throw new BadRequestException(
          updating
            ? 'Use PATCH /api/users/:id/password to change a password'
            : 'Passwords are only accepted when creating a user',
        );
      }
      if (SERVER_MANAGED_FIELDS.has(key)) {
        throw new BadRequestException(`${inputKey} is managed by the server`);
      }
      if (key === 'company_id' || key === 'environment_id') {
        continue;
      }
      if (seenColumns.has(key)) {
        throw new BadRequestException(`Field provided more than once: ${key}`);
      }
      seenColumns.add(key);
      if (!availableColumns.has(key)) {
        throw new BadRequestException(`Unknown field: ${key}`);
      }
      if (key === 'actions' && table === 'roles') {
        assertAssignableActions(context.grants, value, context.isRoot);
      }
      values.push({ column: key, value });
    }

    if (
      table === 'users' &&
      !updating &&
      !values.some(({ column }) => column === 'password_hash')
    ) {
      throw new BadRequestException(
        'A password is required when creating a user',
      );
    }
    return values;
  }

  private async authorize(
    userId: string,
    resourceName: string,
    action: CrudAction,
  ) {
    return this.authorizationService.authorize(userId, resourceName, action);
  }

  private assertScopedWrite(
    table: string,
    columns: ColumnInfo[],
    context: AuthorizationContext,
  ): void {
    const names = new Set(columns.map(({ column_name }) => column_name));
    const isScoped =
      names.has('company_id') || (table === 'companies' && names.has('id'));
    if ((!isScoped || GLOBAL_TABLES.has(table)) && !context.isRoot) {
      throw new ForbiddenException(
        'Only a super administrator can modify global resources',
      );
    }
  }

  private async assertRoleAssignment(
    context: AuthorizationContext,
    table: string,
    body: JsonRecord,
    assignmentId?: string,
  ): Promise<void> {
    if (table !== 'user_roles') return;

    const requestedRoleId = body.roleId ?? body.role_id;
    let roleId: unknown = requestedRoleId;
    if (roleId === undefined && assignmentId) {
      const current = await this.pool.query<{ role_id: string }>(
        `SELECT role_id FROM user_roles
         WHERE id = $1 AND company_id = $2 AND environment_id = $3`,
        [assignmentId, context.companyId, context.environmentId],
      );
      if (current.rowCount !== 1) {
        throw new NotFoundException('Role assignment not found');
      }
      roleId = current.rows[0].role_id;
    }
    if (typeof roleId !== 'string' || !UUID_PATTERN.test(roleId)) {
      throw new BadRequestException('A valid roleId is required');
    }

    const role = await this.pool.query<{ actions: string[] }>(
      `SELECT actions FROM roles
       WHERE id = $1
         AND company_id = $2
         AND environment_id = $3
         AND is_active = TRUE`,
      [roleId, context.companyId, context.environmentId],
    );
    if (role.rowCount !== 1) {
      throw new BadRequestException('Role is not available in this workspace');
    }
    assertAssignableActions(
      context.grants,
      role.rows[0].actions,
      context.isRoot,
    );
  }

  private async columns(table: string): Promise<ColumnInfo[]> {
    let columns = this.columnsCache.get(table);
    if (!columns) {
      columns = this.pool
        .query<ColumnInfo>(
          `SELECT column_name, is_generated, is_identity
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1
           ORDER BY ordinal_position`,
          [table],
        )
        .then((result) => {
          if (result.rowCount === 0) {
            throw new NotFoundException(`Database table not found: ${table}`);
          }
          return result.rows;
        });
      this.columnsCache.set(table, columns);
    }
    return columns;
  }

  private scopeWhere(
    columns: ColumnInfo[],
    context: AuthorizationContext,
    startIndex: number,
    table: string,
  ): { sql: string; values: unknown[] } {
    const names = new Set(columns.map(({ column_name }) => column_name));
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (names.has('company_id')) {
      values.push(context.companyId);
      conditions.push(
        `${quoteIdentifier('company_id')} = $${startIndex + values.length - 1}`,
      );
    } else if (table === 'companies') {
      values.push(context.companyId);
      conditions.push(`"id" = $${startIndex + values.length - 1}`);
    }
    if (names.has('environment_id')) {
      values.push(context.environmentId);
      conditions.push(
        `${quoteIdentifier('environment_id')} = $${startIndex + values.length - 1}`,
      );
    }
    if (conditions.length === 0) {
      return { sql: '', values };
    }
    return { sql: conditions.join(' AND '), values };
  }

  private publicRow(table: string, row: JsonRecord): JsonRecord {
    if (table !== 'users') return row;
    const { password_hash: _passwordHash, ...publicUser } = row;
    return publicUser;
  }

  private parsePaginationValue(
    value: string | undefined,
    fallback: number,
    maximum: number,
  ): number {
    if (value === undefined) return fallback;
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(
        'Pagination values must be non-negative integers',
      );
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed > maximum) {
      throw new BadRequestException(
        `Pagination value cannot exceed ${maximum}`,
      );
    }
    return parsed;
  }

  private validateId(id: string): void {
    if (!UUID_PATTERN.test(id)) {
      throw new BadRequestException('Record id must be a UUID');
    }
  }
}
