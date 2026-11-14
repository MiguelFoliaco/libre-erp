import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { hashPassword, verifyPassword } from './password';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

interface LoginInput {
  identifier: string;
  password: string;
  companyId?: string;
  environmentId?: string;
}

interface UserRow {
  id: string;
  company_id: string;
  environment_id: string;
  username: string;
  email: string;
  password_hash?: string | null;
  is_active: boolean;
  first_name: string | null;
  last_name: string | null;
  second_last_name: string | null;
}

export interface AuthenticatedUser {
  id: string;
  companyId: string;
  environmentId: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  secondLastName: string | null;
}

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

function tokenDigest(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function toAuthenticatedUser(row: UserRow): AuthenticatedUser {
  return {
    id: row.id,
    companyId: row.company_id,
    environmentId: row.environment_id,
    username: row.username,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    secondLastName: row.second_last_name,
  };
}

@Injectable()
export class AuthService {
  private readonly signingKey: Uint8Array;
  private readonly dummyPasswordHash = hashPassword(
    randomBytes(32).toString('hex'),
  );

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    
    if (!secret || Buffer.byteLength(secret) < 32) {
      throw new Error('ACCESS_TOKEN_SECRET must be at least 32 bytes long');
    }
    this.signingKey = new TextEncoder().encode(secret);
  }

  async login(input: LoginInput): Promise<{
    result: AuthResult;
    refreshToken: string;
  }> {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException('Invalid login details');
    }
    const { identifier, password, companyId, environmentId } = input;
    if (
      typeof identifier !== 'string' ||
      typeof password !== 'string' ||
      identifier.trim().length === 0 ||
      password.length === 0 ||
      identifier.length > 255 ||
      password.length > 1024 ||
      ((companyId === undefined) !== (environmentId === undefined)) ||
      (companyId !== undefined &&
        (!this.isUuid(companyId) || !this.isUuid(environmentId)))
    ) {
      throw new BadRequestException('Invalid login details');
    }

    const users = await this.pool.query<UserRow>(
      `SELECT
         u.id,
         u.company_id,
         u.environment_id,
         u.username,
         u.email,
         u.password_hash,
         u.is_active,
         p.first_name,
         p.last_name,
         p.second_last_name
       FROM users u
       JOIN companies c ON c.id = u.company_id AND c.is_active = TRUE
       JOIN environments e
         ON e.id = u.environment_id
        AND e.company_id = u.company_id
        AND e.is_active = TRUE
       LEFT JOIN people p
         ON p.id = u.person_id
        AND p.company_id = u.company_id
        AND p.environment_id = u.environment_id
       WHERE (LOWER(u.email) = LOWER($1) OR LOWER(u.username) = LOWER($1))
         AND ($2::uuid IS NULL OR u.company_id = $2::uuid)
         AND ($3::uuid IS NULL OR u.environment_id = $3::uuid)
       LIMIT 2`,
      [identifier.trim(), companyId ?? null, environmentId ?? null],
    );

    const user = users.rows.length === 1 ? users.rows[0] : undefined;
    const passwordMatches = user?.password_hash
      ? await verifyPassword(password, user.password_hash)
      : await verifyPassword(password, await this.dummyPasswordHash);
    if (!user || !user.is_active || !passwordMatches) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const sessionId = randomUUID();
    const refreshToken = randomBytes(48).toString('base64url');
    const accessToken = await this.createAccessToken(sessionId, user.id);
    await this.pool.query(
      `INSERT INTO session
         (id, user_id, token, refresh_token, expires_at, active, is_refresh)
       VALUES ($1, $2, $3, $4, NOW() + ($5 * INTERVAL '1 second'), TRUE, FALSE)`,
      [
        sessionId,
        user.id,
        tokenDigest(accessToken),
        tokenDigest(refreshToken),
        REFRESH_TOKEN_TTL_SECONDS,
      ],
    );

    await this.pool.query(
      'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
      [user.id],
    );

    return {
      result: {
        accessToken,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        user: toAuthenticatedUser(user),
      },
      refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<{
    result: AuthResult;
    refreshToken: string;
  }> {
    if (!refreshToken || refreshToken.length > 256) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const session = await client.query<UserRow & { session_id: string }>(
        `SELECT
           s.id AS session_id,
           u.id,
           u.company_id,
           u.environment_id,
           u.username,
           u.email,
           u.is_active,
           p.first_name,
           p.last_name,
           p.second_last_name
         FROM session s
         JOIN users u ON u.id = s.user_id
         JOIN companies c ON c.id = u.company_id AND c.is_active = TRUE
         JOIN environments e
           ON e.id = u.environment_id
          AND e.company_id = u.company_id
          AND e.is_active = TRUE
         LEFT JOIN people p
           ON p.id = u.person_id
          AND p.company_id = u.company_id
          AND p.environment_id = u.environment_id
         WHERE s.refresh_token = $1
           AND s.active = TRUE
           AND s.expires_at > NOW()
         FOR UPDATE OF s`,
        [tokenDigest(refreshToken)],
      );
      const user = session.rows[0];
      if (!user || !user.is_active) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const nextRefreshToken = randomBytes(48).toString('base64url');
      const accessToken = await this.createAccessToken(user.session_id, user.id);
      await client.query(
        `UPDATE session
         SET token = $1,
             refresh_token = $2,
             expires_at = NOW() + ($3 * INTERVAL '1 second'),
             updated_at = NOW()
         WHERE id = $4`,
        [
          tokenDigest(accessToken),
          tokenDigest(nextRefreshToken),
          REFRESH_TOKEN_TTL_SECONDS,
          user.session_id,
        ],
      );
      await client.query('COMMIT');

      return {
        result: {
          accessToken,
          expiresIn: ACCESS_TOKEN_TTL_SECONDS,
          user: toAuthenticatedUser(user),
        },
        refreshToken: nextRefreshToken,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      await this.pool.query(
        'UPDATE session SET active = FALSE, updated_at = NOW() WHERE refresh_token = $1',
        [tokenDigest(refreshToken)],
      );
    }
  }

  async authenticateAccessToken(accessToken: string): Promise<string> {
    let subject: string;
    let sessionId: string;
    try {
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(accessToken, this.signingKey, {
        algorithms: ['HS256'],
      });
      if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
        throw new UnauthorizedException('Invalid access token');
      }
      subject = payload.sub;
      sessionId = payload.sid;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }

    const session = await this.pool.query(
      `SELECT 1
       FROM session s
       JOIN users u ON u.id = s.user_id
       JOIN companies c ON c.id = u.company_id AND c.is_active = TRUE
       JOIN environments e
         ON e.id = u.environment_id
        AND e.company_id = u.company_id
        AND e.is_active = TRUE
       WHERE s.id = $1
         AND s.user_id = $2
         AND s.token = $3
         AND s.active = TRUE
         AND s.expires_at > NOW()
         AND u.is_active = TRUE`,
      [sessionId, subject, tokenDigest(accessToken)],
    );
    if (session.rowCount !== 1) {
      throw new UnauthorizedException('Invalid access token');
    }

    return subject;
  }

  async getUser(userId: string): Promise<AuthenticatedUser> {
    const result = await this.pool.query<UserRow>(
      `SELECT
         u.id,
         u.company_id,
         u.environment_id,
         u.username,
         u.email,
         u.is_active,
         p.first_name,
         p.last_name,
         p.second_last_name
       FROM users u
       JOIN companies c ON c.id = u.company_id AND c.is_active = TRUE
       JOIN environments e
         ON e.id = u.environment_id
        AND e.company_id = u.company_id
        AND e.is_active = TRUE
       LEFT JOIN people p
         ON p.id = u.person_id
        AND p.company_id = u.company_id
        AND p.environment_id = u.environment_id
       WHERE u.id = $1
         AND u.is_active = TRUE`,
      [userId],
    );
    if (result.rowCount !== 1) {
      throw new UnauthorizedException();
    }
    return toAuthenticatedUser(result.rows[0]);
  }

  private async createAccessToken(
    sessionId: string,
    userId: string,
  ): Promise<string> {
    const { SignJWT } = await import('jose');
    return new SignJWT({ sid: sessionId })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(this.signingKey);
  }

  private isUuid(value: string | undefined): value is string {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      )
    );
  }
}
