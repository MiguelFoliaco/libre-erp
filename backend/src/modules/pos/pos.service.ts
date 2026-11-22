import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { PG_POOL } from '@/database/database.module';
import { Pool, PoolClient } from "pg";
import { AuthorizationService } from '@/common/authorization/authorization.service';
import { cashRegisters } from '@/database/migrations/schema';
import { randomUUID } from 'node:crypto';

type CashRegistersWithWarehouse = typeof cashRegisters.$inferSelect & {
    warehouse_name: string;
    branch_name: string;
    branch_address: Record<string, string>
}

type JsonRecord = Record<string, unknown>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asRecord(value: unknown): JsonRecord {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new BadRequestException('El cuerpo debe ser un objeto JSON');
    }
    return value as JsonRecord;
}

function readField(body: JsonRecord, camel: string, snake: string): unknown {
    return body[camel] ?? body[snake];
}

function readUuid(value: unknown, field: string): string {
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
        throw new BadRequestException(`${field} debe ser un UUID valido`);
    }
    return value;
}

function readAmount(value: unknown, field: string, allowZero = true): number {
    if (typeof value !== 'string' && typeof value !== 'number') {
        throw new BadRequestException(`${field} debe ser un numero`);
    }
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0 || (!allowZero && amount <= 0)) {
        throw new BadRequestException(`${field} no es valido`);
    }
    return Math.round(amount * 1_000_000) / 1_000_000;
}

function readQuantity(value: unknown): number {
    const quantity = readAmount(value, 'La cantidad', false);
    if (quantity > 100000) throw new BadRequestException('La cantidad no es valida');
    return quantity;
}

function decimal(value: number): string {
    return value.toFixed(6);
}

@Injectable()
export class PosServices {

    constructor(
        @Inject(PG_POOL) private readonly pool: Pool,
        private readonly authorizationService: AuthorizationService,
    ) { }


    async list(
        userId: string,
        query: string = '',
        limitValue?: string | number,
        offsetValue?: string | number,
    ) {
        const { context } = await this.authorizationService.authorize(
            userId,
            'cash-registers',
            "READ"
        );

        const limit = limitValue !== undefined && limitValue !== '' ? Number(limitValue) : 50;
        const offset = offsetValue !== undefined && offsetValue !== '' ? Number(offsetValue) : 0;
        const searchPattern = `%${query.trim()}%`;

        const values = [context.companyId, context.environmentId, limit, offset, searchPattern];

        const { rows } = await this.pool.query<CashRegistersWithWarehouse>(
            `SELECT 
                cr.id,
                cr.company_id,
                cr.environment_id,
                cr.warehouse_id,
                cr."name",
                cr.code,
                cr.is_active,
                cr.metadata,
                cr.created_at,
                cr.updated_at,
                w."name" AS warehouse_name,
                b."name" AS branch_name,
                b.address as branch_address,
                b."id" AS branch_id
            FROM cash_registers cr
            INNER JOIN warehouses w
                ON w.id = cr.warehouse_id
            INNER JOIN branches b
                ON b.id = cr.branch_id
            WHERE cr.company_id = $1
              AND cr.environment_id = $2
              AND (cr."name" ILIKE $5 OR cr.code ILIKE $5)
            ORDER BY cr.created_at DESC, cr.id ASC
            LIMIT $3
            OFFSET $4;`,
            values,
        );

        return { items: rows, limit, offset };
    }

    async listRegisters(userId: string) {
        const { context } = await this.authorizationService.authorize(
            userId,
            'cash-registers',
            'READ',
        );
        const result = await this.pool.query(
            `SELECT cr.id, cr.company_id, cr.environment_id, cr.branch_id,
                    cr.warehouse_id, cr.name, cr.code, cr.is_active, cr.metadata,
                    cr.created_at, cr.updated_at,
                    w.name AS warehouse_name, b.name AS branch_name,
                    cs.id AS active_session_id, cs.opened_by AS active_opened_by,
                    cs.opened_at AS active_opened_at
             FROM cash_registers cr
             INNER JOIN warehouses w ON w.id = cr.warehouse_id
               AND w.company_id = cr.company_id AND w.environment_id = cr.environment_id
             LEFT JOIN branches b ON b.id = cr.branch_id
               AND b.company_id = cr.company_id AND b.environment_id = cr.environment_id
             LEFT JOIN cash_sessions cs ON cs.cash_register_id = cr.id
               AND cs.company_id = cr.company_id AND cs.environment_id = cr.environment_id
               AND cs.status = 'open'
             WHERE cr.company_id = $1 AND cr.environment_id = $2
             ORDER BY cr.name`,
            [context.companyId, context.environmentId],
        );
        return { items: result.rows, limit: result.rows.length, offset: 0 };
    }

    async status(userId: string) {
        const registers = await this.listRegisters(userId);
        const active = await this.activeSession(userId);
        return {
            hasActiveSession: active !== null,
            activeSession: active,
            registers: registers.items,
        };
    }

    async activeSession(userId: string) {
        const { context } = await this.authorizationService.authorize(
            userId,
            'cash-sessions',
            'READ',
        );
        const result = await this.pool.query(
            `SELECT cs.*, cr.name AS cash_register_name, cr.warehouse_id,
                    w.name AS warehouse_name
             FROM cash_sessions cs
             INNER JOIN cash_registers cr ON cr.id = cs.cash_register_id
               AND cr.company_id = cs.company_id AND cr.environment_id = cs.environment_id
             INNER JOIN warehouses w ON w.id = cr.warehouse_id
               AND w.company_id = cr.company_id AND w.environment_id = cr.environment_id
             WHERE cs.company_id = $1 AND cs.environment_id = $2
               AND cs.status = 'open'
               AND cs.opened_by = $3
             ORDER BY cs.opened_at DESC
             LIMIT 1`,
            [context.companyId, context.environmentId, context.userId],
        );
        return result.rows[0] ?? null;
    }

    async openSession(userId: string, input: unknown) {
        const { context } = await this.authorizationService.authorize(
            userId,
            'cash-sessions',
            'INSERT',
        );
        const body = asRecord(input);
        const cashRegisterId = readUuid(
            readField(body, 'cashRegisterId', 'cash_register_id'),
            'cashRegisterId',
        );
        const openingAmount = readAmount(
            readField(body, 'openingAmount', 'opening_amount') ?? 0,
            'openingAmount',
        );
        const currencyCodeValue = readField(body, 'currencyCode', 'currency_code');
        const currencyCode =
            typeof currencyCodeValue === 'string' && /^[A-Z]{3}$/.test(currencyCodeValue)
                ? currencyCodeValue
                : 'USD';
        const notesValue = readField(body, 'openingNotes', 'opening_notes');
        const openingNotes =
            notesValue === undefined || notesValue === null
                ? null
                : typeof notesValue === 'string'
                    ? notesValue.slice(0, 2000)
                    : null;

        return this.transaction(async (client) => {
            const register = await client.query(
                `SELECT id, warehouse_id, is_active
                 FROM cash_registers
                 WHERE id = $1 AND company_id = $2 AND environment_id = $3
                 FOR UPDATE`,
                [cashRegisterId, context.companyId, context.environmentId],
            );
            if (register.rowCount !== 1 || !register.rows[0].is_active) {
                throw new BadRequestException('La caja no existe o no esta activa');
            }
            const existing = await client.query(
                `SELECT *
                 FROM cash_sessions
                 WHERE company_id = $1 AND environment_id = $2
                   AND cash_register_id = $3 AND status = 'open'
                 LIMIT 1
                 FOR UPDATE`,
                [context.companyId, context.environmentId, cashRegisterId],
            );
            if (existing.rowCount === 1) {
                if (existing.rows[0].opened_by !== context.userId) {
                    throw new ForbiddenException('Esta caja fue abierta por otro usuario');
                }
                return existing.rows[0];
            }
            const result = await client.query(
                `INSERT INTO cash_sessions (
                   company_id, environment_id, cash_register_id, opened_by,
                   status, currency_code, opening_amount, opening_notes
                 )
                 VALUES ($1, $2, $3, $4, 'open', $5, $6, $7)
                 RETURNING *`,
                [
                    context.companyId,
                    context.environmentId,
                    cashRegisterId,
                    context.userId,
                    currencyCode,
                    decimal(openingAmount),
                    openingNotes,
                ],
            );
            const session = result.rows[0];
            if (openingAmount > 0) {
                await client.query(
                    `INSERT INTO cash_movements (
                       company_id, environment_id, cash_session_id, movement_type,
                       amount, description, reference_type, created_by
                     )
                     VALUES ($1, $2, $3, 'opening', $4, 'Apertura de caja', 'cash_session', $5)`,
                    [
                        context.companyId,
                        context.environmentId,
                        session.id,
                        decimal(openingAmount),
                        context.userId,
                    ],
                );
            }
            return session;
        });
    }

    async closeSession(userId: string, sessionId: string, input: unknown) {
        const { context } = await this.authorizationService.authorize(
            userId,
            'cash-sessions',
            'UPDATE',
        );
        const body = asRecord(input);
        const closingAmount = readAmount(
            readField(body, 'closingAmount', 'closing_amount') ?? 0,
            'closingAmount',
        );
        const closingNotesValue = readField(body, 'closingNotes', 'closing_notes');
        const closingNotes =
            closingNotesValue === undefined || closingNotesValue === null
                ? null
                : typeof closingNotesValue === 'string'
                    ? closingNotesValue.slice(0, 2000)
                    : null;

        return this.transaction(async (client) => {
            const result = await client.query(
                `SELECT *
                 FROM cash_sessions
                 WHERE id = $1 AND company_id = $2 AND environment_id = $3
                 FOR UPDATE`,
                [sessionId, context.companyId, context.environmentId],
            );
            if (result.rowCount !== 1) throw new BadRequestException('La sesion no existe');
            const session = result.rows[0] as {
                id: string;
                opened_by: string;
                status: string;
                opening_amount: string;
            };
            if (session.status !== 'open') throw new ConflictException('La sesion ya esta cerrada');
            if (session.opened_by !== context.userId) {
                throw new ForbiddenException('Solo el usuario que abrio la caja puede cerrarla');
            }
            const totals = await client.query(
                `SELECT COALESCE(SUM(cm.amount) FILTER (
                   WHERE cm.movement_type = 'sale'
                 ), 0) AS sales_total
                 FROM cash_movements cm
                 WHERE cm.cash_session_id = $1
                   AND cm.company_id = $2 AND cm.environment_id = $3`,
                [sessionId, context.companyId, context.environmentId],
            );
            const opening = Number(session.opening_amount);
            const sales = Number(totals.rows[0].sales_total);
            const expected = opening + sales;
            const difference = closingAmount - expected;
            const updated = await client.query(
                `UPDATE cash_sessions
                 SET status = 'closed', closed_by = $4, closing_amount = $5,
                     expected_amount = $6, difference_amount = $7,
                     closing_notes = $8, closed_at = NOW()
                 WHERE id = $1 AND company_id = $2 AND environment_id = $3
                 RETURNING *`,
                [
                    sessionId,
                    context.companyId,
                    context.environmentId,
                    context.userId,
                    decimal(closingAmount),
                    decimal(expected),
                    decimal(difference),
                    closingNotes,
                ],
            );
            return updated.rows[0];
        });
    }

    async searchProducts(userId: string, cashRegisterIdValue: unknown, queryValue: unknown) {
        const { context } = await this.authorizationService.authorize(
            userId,
            'products',
            'READ',
        );
        const cashRegisterId = readUuid(cashRegisterIdValue, 'cashRegisterId');
        if (typeof queryValue !== 'string' || queryValue.trim().length > 100) {
            throw new BadRequestException('La busqueda no es valida');
        }
        const search = `%${queryValue.trim().replace(/\s+/g, '%')}%`;
        const result = await this.pool.query(
            `SELECT p.id, p.name, p.description, p.sku, p.barcode,
                    p.sale_price, p.currency_code, p.unit, p.product_type,
                    i.quantity, i.reserved_quantity,
                    GREATEST(i.quantity - i.reserved_quantity, 0) AS available_quantity,
                    COALESCE(tx.estimated_tax_rate, 0) AS estimated_tax_rate,
                    cr.id AS cash_register_id, cr.warehouse_id,
                    w.name AS warehouse_name
             FROM cash_registers cr
             INNER JOIN warehouses w ON w.id = cr.warehouse_id
               AND w.company_id = cr.company_id AND w.environment_id = cr.environment_id
             INNER JOIN inventory i ON i.warehouse_id = cr.warehouse_id
               AND i.company_id = cr.company_id AND i.environment_id = cr.environment_id
             INNER JOIN products p ON p.id = i.product_id
               AND p.company_id = i.company_id AND p.environment_id = i.environment_id
             LEFT JOIN LATERAL (
                 SELECT COALESCE(SUM(t.rate) FILTER (
                            WHERE t.tax_type = 'percentage'
                              AND t.is_active = TRUE
                              AND (t.valid_from IS NULL OR t.valid_from <= CURRENT_DATE)
                              AND (t.valid_until IS NULL OR t.valid_until >= CURRENT_DATE)
                        ), 0) AS estimated_tax_rate
                 FROM product_taxes pt
                 INNER JOIN taxes t ON t.id = pt.tax_id
                   AND t.company_id = pt.company_id
                   AND t.environment_id = pt.environment_id
                 WHERE pt.product_id = p.id
                   AND pt.company_id = p.company_id
                   AND pt.environment_id = p.environment_id
             ) tx ON TRUE
             WHERE cr.id = $1
               AND cr.company_id = $2 AND cr.environment_id = $3
               AND cr.is_active = TRUE
               AND p.is_active = TRUE
               AND (i.quantity - i.reserved_quantity) > 0
               AND (
                 p.name ILIKE $4
                 OR COALESCE(p.description, '') ILIKE $4
                 OR COALESCE(p.sku, '') ILIKE $4
                 OR COALESCE(p.barcode, '') ILIKE $4
               )
             ORDER BY
               CASE
                 WHEN p.barcode = $5 THEN 0
                 WHEN p.sku = $5 THEN 1
                 ELSE 2
               END,
               p.name
             LIMIT 50`,
            [cashRegisterId, context.companyId, context.environmentId, search, queryValue.trim()],
        );
        return { items: result.rows, limit: result.rows.length, offset: 0 };
    }

    async paymentMethods(userId: string) {
        const { context } = await this.authorizationService.authorize(
            userId,
            'payment-methods',
            'READ',
        );
        const result = await this.pool.query(
            `SELECT id, name, code, payment_type, requires_reference
             FROM payment_methods
             WHERE company_id = $1 AND environment_id = $2 AND is_active = TRUE
             ORDER BY name`,
            [context.companyId, context.environmentId],
        );
        return { items: result.rows, limit: result.rows.length, offset: 0 };
    }

    async checkout(userId: string, input: unknown) {
        const { context } = await this.authorizationService.authorize(
            userId,
            'sales',
            'INSERT',
        );
        await this.authorizationService.authorize(userId, 'sale-items', 'INSERT');
        await this.authorizationService.authorize(userId, 'sale-payments', 'INSERT');
        await this.authorizationService.authorize(userId, 'inventory-movements', 'INSERT');

        const body = asRecord(input);
        const sessionId = readUuid(
            readField(body, 'cashSessionId', 'cash_session_id'),
            'cashSessionId',
        );
        if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 100) {
            throw new BadRequestException('La venta debe incluir entre 1 y 100 productos');
        }
        if (!Array.isArray(body.payments) || body.payments.length === 0 || body.payments.length > 20) {
            throw new BadRequestException('La venta debe incluir al menos un pago');
        }
        const notesValue = readField(body, 'notes', 'notes');
        const notes =
            typeof notesValue === 'string' && notesValue.length <= 2000
                ? notesValue.trim() || null
                : null;

        const items = body.items.map((value) => {
            const item = asRecord(value);
            return {
                productId: readUuid(readField(item, 'productId', 'product_id'), 'productId'),
                quantity: readQuantity(readField(item, 'quantity', 'quantity')),
                discountAmount: readAmount(
                    readField(item, 'discountAmount', 'discount_amount') ?? 0,
                    'discountAmount',
                ),
            };
        });
        const payments = body.payments.map((value) => {
            const payment = asRecord(value);
            const referenceValue = readField(payment, 'reference', 'reference');
            return {
                paymentMethodId: readUuid(
                    readField(payment, 'paymentMethodId', 'payment_method_id'),
                    'paymentMethodId',
                ),
                amount: readAmount(readField(payment, 'amount', 'amount'), 'amount', false),
                reference:
                    typeof referenceValue === 'string' && referenceValue.trim()
                        ? referenceValue.trim().slice(0, 255)
                        : null,
            };
        });

        return this.transaction(async (client) => {
            const sessionResult = await client.query(
                `SELECT cs.*, cr.warehouse_id
                 FROM cash_sessions cs
                 INNER JOIN cash_registers cr ON cr.id = cs.cash_register_id
                   AND cr.company_id = cs.company_id AND cr.environment_id = cs.environment_id
                 WHERE cs.id = $1 AND cs.company_id = $2
                   AND cs.environment_id = $3 AND cs.status = 'open'
                 FOR UPDATE`,
                [sessionId, context.companyId, context.environmentId],
            );
            if (sessionResult.rowCount !== 1) {
                throw new ConflictException('No existe una sesion de caja activa');
            }
            const session = sessionResult.rows[0] as {
                id: string;
                opened_by: string;
                cash_register_id: string;
                warehouse_id: string;
                currency_code: string;
            };
            if (session.opened_by !== context.userId) {
                throw new ForbiddenException('Solo el usuario que abrio la caja puede cobrar');
            }

            let subtotal = 0;
            let discountTotal = 0;
            let taxTotal = 0;
            const preparedItems: {
                productId: string;
                productName: string;
                sku: string | null;
                barcode: string | null;
                quantity: number;
                unit: string;
                unitPrice: number;
                discountAmount: number;
                taxAmount: number;
                itemSubtotal: number;
                itemTotal: number;
                taxes: { id: string | null; name: string; code: string | null; rate: number; taxableBase: number; amount: number; isInclusive: boolean }[];
            }[] = [];

            for (const item of items) {
                const productResult = await client.query(
                    `SELECT p.id, p.name, p.sku, p.barcode, p.sale_price, p.unit,
                            p.currency_code
                     FROM products p
                     WHERE p.id = $1 AND p.company_id = $2
                       AND p.environment_id = $3 AND p.is_active = TRUE`,
                    [item.productId, context.companyId, context.environmentId],
                );
                if (productResult.rowCount !== 1) {
                    throw new BadRequestException('Uno de los productos no existe o no esta activo');
                }
                const inventoryResult = await client.query(
                    `SELECT quantity, reserved_quantity
                     FROM inventory
                     WHERE company_id = $1 AND environment_id = $2
                       AND product_id = $3 AND warehouse_id = $4
                     FOR UPDATE`,
                    [
                        context.companyId,
                        context.environmentId,
                        item.productId,
                        session.warehouse_id,
                    ],
                );
                if (inventoryResult.rowCount !== 1) {
                    throw new BadRequestException('El producto no tiene stock en la bodega de la caja');
                }
                const available =
                    Number(inventoryResult.rows[0].quantity) -
                    Number(inventoryResult.rows[0].reserved_quantity);
                if (available + 0.0000001 < item.quantity) {
                    throw new ConflictException('No hay stock suficiente para uno de los productos');
                }

                const product = productResult.rows[0] as {
                    id: string;
                    name: string;
                    sku: string | null;
                    barcode: string | null;
                    sale_price: string;
                    unit: string;
                    currency_code: string;
                };
                const unitPrice = Number(product.sale_price);
                const itemSubtotal = unitPrice * item.quantity;
                if (item.discountAmount > itemSubtotal) {
                    throw new BadRequestException('El descuento no puede superar el subtotal del producto');
                }
                const taxableBase = itemSubtotal - item.discountAmount;
                const taxesResult = await client.query(
                    `SELECT t.id, t.name, t.code, t.rate, t.is_inclusive
                     FROM product_taxes pt
                     INNER JOIN taxes t ON t.id = pt.tax_id
                       AND t.company_id = pt.company_id
                       AND t.environment_id = pt.environment_id
                     WHERE pt.company_id = $1 AND pt.environment_id = $2
                       AND pt.product_id = $3 AND t.is_active = TRUE
                       AND (t.valid_from IS NULL OR t.valid_from <= CURRENT_DATE)
                       AND (t.valid_until IS NULL OR t.valid_until >= CURRENT_DATE)
                     ORDER BY t.is_compound DESC, t.name`,
                    [context.companyId, context.environmentId, item.productId],
                );
                let itemTaxAmount = 0;
                const preparedTaxes = taxesResult.rows.map((tax) => {
                    const rate = Number(tax.rate);
                    const isInclusive = Boolean(tax.is_inclusive);
                    let taxAmount: number;
                    let taxTaxableBase = taxableBase;
                    if (isInclusive) {
                        taxTaxableBase = taxableBase / (1 + rate / 100);
                        taxAmount = taxableBase - taxTaxableBase;
                    } else {
                        taxAmount = taxableBase * rate / 100;
                    }
                    taxAmount = Math.round(taxAmount * 1_000_000) / 1_000_000;
                    itemTaxAmount += taxAmount;
                    return {
                        id: tax.id as string,
                        name: tax.name as string,
                        code: tax.code as string | null,
                        rate,
                        taxableBase: Math.round(taxTaxableBase * 1_000_000) / 1_000_000,
                        amount: taxAmount,
                        isInclusive,
                    };
                });
                const itemTotal =
                    preparedTaxes.some((tax) => tax.isInclusive)
                        ? taxableBase
                        : taxableBase + itemTaxAmount;

                subtotal += itemSubtotal;
                discountTotal += item.discountAmount;
                taxTotal += itemTaxAmount;
                preparedItems.push({
                    productId: product.id,
                    productName: product.name,
                    sku: product.sku,
                    barcode: product.barcode,
                    quantity: item.quantity,
                    unit: product.unit,
                    unitPrice,
                    discountAmount: item.discountAmount,
                    taxAmount: itemTaxAmount,
                    itemSubtotal,
                    itemTotal,
                    taxes: preparedTaxes,
                });
            }

            const total = subtotal - discountTotal + taxTotal;
            const paidTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
            if (paidTotal + 0.0000001 < total) {
                throw new BadRequestException('El monto pagado no cubre el total');
            }
            const changeTotal = Math.max(0, paidTotal - total);

            for (const payment of payments) {
                const methodResult = await client.query(
                    `SELECT id, requires_reference
                     FROM payment_methods
                     WHERE id = $1 AND company_id = $2 AND environment_id = $3
                       AND is_active = TRUE`,
                    [payment.paymentMethodId, context.companyId, context.environmentId],
                );
                if (methodResult.rowCount !== 1) {
                    throw new BadRequestException('Uno de los metodos de pago no existe o no esta activo');
                }
                if (methodResult.rows[0].requires_reference && !payment.reference) {
                    throw new BadRequestException('Uno de los metodos de pago requiere referencia');
                }
            }

            const saleNumber = `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
            const saleResult = await client.query(
                `INSERT INTO sales (
                   company_id, environment_id, cash_register_id, cash_session_id,
                   warehouse_id, seller_id, sale_number, status, currency_code,
                   subtotal, discount_total, tax_total, total, paid_total, change_total, notes
                 )
                 VALUES ($1,$2,$3,$4,$5,$6,$7,'completed',$8,$9,$10,$11,$12,$13,$14,$15)
                 RETURNING *`,
                [
                    context.companyId,
                    context.environmentId,
                    session.cash_register_id,
                    sessionId,
                    session.warehouse_id,
                    context.userId,
                    saleNumber,
                    session.currency_code,
                    decimal(subtotal),
                    decimal(discountTotal),
                    decimal(taxTotal),
                    decimal(total),
                    decimal(paidTotal),
                    decimal(changeTotal),
                    notes,
                ],
            );
            const sale = saleResult.rows[0];

            for (let index = 0; index < preparedItems.length; index += 1) {
                const item = preparedItems[index];
                const itemResult = await client.query(
                    `INSERT INTO sale_items (
                       company_id, environment_id, sale_id, product_id,
                       product_name, sku, barcode, quantity, unit, unit_price,
                       discount_amount, tax_amount, subtotal, total, position
                     )
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                     RETURNING id`,
                    [
                        context.companyId,
                        context.environmentId,
                        sale.id,
                        item.productId,
                        item.productName,
                        item.sku,
                        item.barcode,
                        decimal(item.quantity),
                        item.unit,
                        decimal(item.unitPrice),
                        decimal(item.discountAmount),
                        decimal(item.taxAmount),
                        decimal(item.itemSubtotal),
                        decimal(item.itemTotal),
                        index,
                    ],
                );
                const saleItemId = itemResult.rows[0].id as string;
                for (const tax of item.taxes) {
                    await client.query(
                        `INSERT INTO sale_item_taxes (
                           company_id, environment_id, sale_item_id, tax_id,
                           tax_name, tax_code, tax_rate, taxable_base, tax_amount, is_inclusive
                         )
                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                        [
                            context.companyId,
                            context.environmentId,
                            saleItemId,
                            tax.id,
                            tax.name,
                            tax.code,
                            decimal(tax.rate),
                            decimal(tax.taxableBase),
                            decimal(tax.amount),
                            tax.isInclusive,
                        ],
                    );
                }
                await client.query(
                    `UPDATE inventory
                     SET quantity = quantity - $5, updated_at = NOW()
                     WHERE company_id = $1 AND environment_id = $2
                       AND product_id = $3 AND warehouse_id = $4`,
                    [
                        context.companyId,
                        context.environmentId,
                        item.productId,
                        session.warehouse_id,
                        decimal(item.quantity),
                    ],
                );
                await client.query(
                    `INSERT INTO inventory_movements (
                       company_id, environment_id, product_id, warehouse_id,
                       movement_type, quantity, reference_type, reference_id,
                       notes, created_by
                     )
                     VALUES ($1,$2,$3,$4,'exit',$5,'sale',$6,$7,$8)`,
                    [
                        context.companyId,
                        context.environmentId,
                        item.productId,
                        session.warehouse_id,
                        decimal(item.quantity),
                        sale.id,
                        `Venta ${saleNumber}`,
                        context.userId,
                    ],
                );
            }

            let cashPaid = 0;
            for (const payment of payments) {
                const method = await client.query(
                    `SELECT payment_type FROM payment_methods
                     WHERE id = $1 AND company_id = $2 AND environment_id = $3`,
                    [payment.paymentMethodId, context.companyId, context.environmentId],
                );
                await client.query(
                    `INSERT INTO sale_payments (
                       company_id, environment_id, sale_id, payment_method_id,
                       amount, reference, status, received_by
                     )
                     VALUES ($1,$2,$3,$4,$5,$6,'confirmed',$7)`,
                    [
                        context.companyId,
                        context.environmentId,
                        sale.id,
                        payment.paymentMethodId,
                        decimal(payment.amount),
                        payment.reference,
                        context.userId,
                    ],
                );
                if (method.rows[0].payment_type === 'cash') {
                    cashPaid += payment.amount;
                }
            }
            if (cashPaid > 0) {
                await client.query(
                    `INSERT INTO cash_movements (
                       company_id, environment_id, cash_session_id, movement_type,
                       amount, description, reference_type, reference_id, created_by
                     )
                     VALUES ($1,$2,$3,'sale',$4,$5,'sale',$6,$7)`,
                    [
                        context.companyId,
                        context.environmentId,
                        sessionId,
                        decimal(cashPaid),
                        `Cobro de venta ${saleNumber}`,
                        sale.id,
                        context.userId,
                    ],
                );
            }
            return {
                sale,
                items: preparedItems,
                subtotal,
                discountTotal,
                taxTotal,
                total,
                paidTotal,
                changeTotal,
                saleNumber,
            };
        });
    }

    private async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await work(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

}