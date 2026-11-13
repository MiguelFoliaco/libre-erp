import { pgTable, unique, bigint, varchar, timestamp, index, check, uuid, char, text, jsonb, boolean, foreignKey, uniqueIndex, numeric, date, integer, inet, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const environmentType = pgEnum("environment_type", ['development', 'production', 'test'])
export const movementType = pgEnum("movement_type", ['entry', 'exit', 'adjustment_in', 'adjustment_out', 'transfer_in', 'transfer_out', 'reversal'])
export const productType = pgEnum("product_type", ['physical', 'virtual', 'service'])


export const schemaMigrations = pgTable("schema_migrations", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "schema_migrations_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	filename: varchar({ length: 255 }).notNull(),
	executedAt: timestamp("executed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("schema_migrations_filename_key").on(table.filename),
]);

export const companies = pgTable("companies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	legalName: varchar("legal_name", { length: 255 }).notNull(),
	tradeName: varchar("trade_name", { length: 255 }),
	registrationNumber: varchar("registration_number", { length: 100 }),
	registrationType: varchar("registration_type", { length: 100 }),
	countryCode: char("country_code", { length: 2 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	website: varchar({ length: 500 }),
	addressStr: varchar("address_str", { length: 255 }),
	addressFields: text("address_fields").array().default([""]).notNull(),
	address: jsonb().default({}).notNull(),
	metadata: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_companies_country_code").using("btree", table.countryCode.asc().nullsLast().op("bpchar_ops")),
	index("idx_companies_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_companies_legal_name").using("btree", table.legalName.asc().nullsLast().op("text_ops")),
	check("companies_address_object_check", sql`jsonb_typeof(address) = 'object'::text`),
	check("companies_country_code_check", sql`(country_code IS NULL) OR (country_code ~ '^[A-Z]{2}$'::text)`),
	check("companies_metadata_object_check", sql`jsonb_typeof(metadata) = 'object'::text`),
]);

export const environments = pgTable("environments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	name: varchar({ length: 150 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	type: environmentType().default('production').notNull(),
	description: text(),
	metadata: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_environments_company_id").using("btree", table.companyId.asc().nullsLast().op("uuid_ops")),
	index("idx_environments_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_environments_type").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "environments_company_fk"
		}).onDelete("cascade"),
	unique("environments_company_slug_unique").on(table.companyId, table.slug),
	unique("environments_company_id_unique").on(table.companyId, table.id),
	check("environments_metadata_object_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("environments_slug_check", sql`(slug)::text ~ '^[a-z0-9][a-z0-9_-]*$'::text`),
	check("environments_type_check", sql`type = ANY (ARRAY['development'::environment_type, 'production'::environment_type, 'test'::environment_type])`),
]);

export const brands = pgTable("brands", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	logoUrl: text("logo_url"),
	name: varchar({ length: 150 }).notNull(),
	description: text(),
	metadata: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "brands_company_id_environment_id_fkey"
		}),
	unique("brands_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("brands_company_id_environment_id_name_key").on(table.companyId, table.environmentId, table.name),
	check("brands_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	logoUrl: text("logo_url"),
	parentId: uuid("parent_id"),
	name: varchar({ length: 150 }).notNull(),
	description: text(),
	metadata: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "categories_company_id_environment_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.parentId],
			foreignColumns: [table.id, table.companyId, table.environmentId],
			name: "categories_company_id_environment_id_parent_id_fkey"
		}),
	unique("categories_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("categories_company_id_environment_id_name_key").on(table.companyId, table.environmentId, table.name),
	check("categories_check", sql`(parent_id IS NULL) OR (parent_id <> id)`),
	check("categories_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
]);

export const departments = pgTable("departments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	name: varchar({ length: 150 }).notNull(),
	description: text(),
	metadata: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "departments_company_id_environment_id_fkey"
		}),
	unique("departments_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("departments_company_id_environment_id_name_key").on(table.companyId, table.environmentId, table.name),
	check("departments_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	brandId: uuid("brand_id"),
	categoryId: uuid("category_id"),
	departmentId: uuid("department_id"),
	sku: varchar({ length: 100 }),
	barcode: varchar({ length: 100 }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	productType: productType("product_type").default('physical').notNull(),
	costPrice: numeric("cost_price", { precision: 20, scale:  6 }).default('0').notNull(),
	salePrice: numeric("sale_price", { precision: 20, scale:  6 }).default('0').notNull(),
	currencyCode: char("currency_code", { length: 3 }).notNull(),
	unit: varchar({ length: 30 }).default('unit').notNull(),
	metadata: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("idx_products_barcode").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.barcode.asc().nullsLast().op("uuid_ops")).where(sql`(barcode IS NOT NULL)`),
	index("idx_products_brand").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.brandId.asc().nullsLast().op("uuid_ops")),
	index("idx_products_category").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.categoryId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("idx_products_sku").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("text_ops"), table.sku.asc().nullsLast().op("uuid_ops")).where(sql`(sku IS NOT NULL)`),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.brandId],
			foreignColumns: [brands.id, brands.companyId, brands.environmentId],
			name: "products_company_id_environment_id_brand_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.categoryId],
			foreignColumns: [categories.id, categories.companyId, categories.environmentId],
			name: "products_company_id_environment_id_category_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.departmentId],
			foreignColumns: [departments.id, departments.companyId, departments.environmentId],
			name: "products_company_id_environment_id_department_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "products_company_id_environment_id_fkey"
		}),
	unique("products_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	check("products_cost_price_check", sql`cost_price >= (0)::numeric`),
	check("products_currency_code_check", sql`currency_code ~ '^[A-Z]{3}$'::text`),
	check("products_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("products_product_type_check", sql`product_type = ANY (ARRAY['physical'::product_type, 'virtual'::product_type, 'service'::product_type])`),
	check("products_sale_price_check", sql`sale_price >= (0)::numeric`),
]);

export const branches = pgTable("branches", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	name: varchar({ length: 150 }).notNull(),
	code: varchar({ length: 50 }),
	address: jsonb().default({}).notNull(),
	metadata: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "branches_company_id_environment_id_fkey"
		}),
	unique("branches_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("branches_company_id_environment_id_name_key").on(table.companyId, table.environmentId, table.name),
	check("branches_address_check", sql`jsonb_typeof(address) = 'object'::text`),
	check("branches_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
]);

export const warehouses = pgTable("warehouses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	branchId: uuid("branch_id"),
	name: varchar({ length: 150 }).notNull(),
	code: varchar({ length: 50 }),
	warehouseType: varchar("warehouse_type", { length: 30 }).default('standard').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId, table.branchId],
			foreignColumns: [branches.id, branches.companyId, branches.environmentId],
			name: "warehouses_company_id_environment_id_branch_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "warehouses_company_id_environment_id_fkey"
		}),
	unique("warehouses_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("warehouses_company_id_environment_id_code_key").on(table.code, table.companyId, table.environmentId),
	check("warehouses_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("warehouses_warehouse_type_check", sql`(warehouse_type)::text = ANY ((ARRAY['standard'::character varying, 'returns'::character varying, 'damaged'::character varying, 'transit'::character varying])::text[])`),
]);

export const inventory = pgTable("inventory", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	productId: uuid("product_id").notNull(),
	warehouseId: uuid("warehouse_id").notNull(),
	quantity: numeric({ precision: 20, scale:  6 }).default('0').notNull(),
	reservedQuantity: numeric("reserved_quantity", { precision: 20, scale:  6 }).default('0').notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "inventory_company_id_environment_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.productId],
			foreignColumns: [products.id, products.companyId, products.environmentId],
			name: "inventory_company_id_environment_id_product_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.warehouseId],
			foreignColumns: [warehouses.id, warehouses.companyId, warehouses.environmentId],
			name: "inventory_company_id_environment_id_warehouse_id_fkey"
		}),
	unique("inventory_company_id_environment_id_product_id_warehouse_id_key").on(table.companyId, table.environmentId, table.productId, table.warehouseId),
	check("inventory_check", sql`reserved_quantity <= quantity`),
	check("inventory_quantity_check", sql`quantity >= (0)::numeric`),
	check("inventory_reserved_quantity_check", sql`reserved_quantity >= (0)::numeric`),
]);

export const inventoryMovements = pgTable("inventory_movements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	productId: uuid("product_id").notNull(),
	warehouseId: uuid("warehouse_id").notNull(),
	movementType: movementType("movement_type").notNull(),
	quantity: numeric({ precision: 20, scale:  6 }).notNull(),
	referenceType: varchar("reference_type", { length: 50 }),
	referenceId: uuid("reference_id"),
	transferId: uuid("transfer_id"),
	notes: text(),
	metadata: jsonb().default({}).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_inventory_movements_created_at").using("btree", table.companyId.asc().nullsLast().op("timestamptz_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_inventory_movements_product").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_inventory_movements_warehouse").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.warehouseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "inventory_movements_company_id_environment_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.productId],
			foreignColumns: [products.id, products.companyId, products.environmentId],
			name: "inventory_movements_company_id_environment_id_product_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.warehouseId],
			foreignColumns: [warehouses.id, warehouses.companyId, warehouses.environmentId],
			name: "inventory_movements_company_id_environment_id_warehouse_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.transferId],
			foreignColumns: [transfers.id, transfers.companyId, transfers.environmentId],
			name: "inventory_movements_transfer_fk"
		}),
	check("inventory_movements_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("inventory_movements_movement_type_check", sql`movement_type = ANY (ARRAY['entry'::movement_type, 'exit'::movement_type, 'adjustment_in'::movement_type, 'adjustment_out'::movement_type, 'transfer_in'::movement_type, 'transfer_out'::movement_type, 'reversal'::movement_type])`),
	check("inventory_movements_quantity_check", sql`quantity > (0)::numeric`),
]);

export const transfers = pgTable("transfers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	transferNumber: varchar("transfer_number", { length: 100 }).notNull(),
	sourceWarehouseId: uuid("source_warehouse_id").notNull(),
	destinationWarehouseId: uuid("destination_warehouse_id").notNull(),
	status: varchar({ length: 30 }).default('draft').notNull(),
	notes: text(),
	metadata: jsonb().default({}).notNull(),
	createdBy: uuid("created_by"),
	approvedBy: uuid("approved_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	shippedAt: timestamp("shipped_at", { withTimezone: true, mode: 'string' }),
	receivedAt: timestamp("received_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId, table.destinationWarehouseId],
			foreignColumns: [warehouses.id, warehouses.companyId, warehouses.environmentId],
			name: "transfers_company_id_environment_id_destination_warehouse__fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "transfers_company_id_environment_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.sourceWarehouseId],
			foreignColumns: [warehouses.id, warehouses.companyId, warehouses.environmentId],
			name: "transfers_company_id_environment_id_source_warehouse_id_fkey"
		}),
	unique("transfers_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("transfers_company_id_environment_id_transfer_number_key").on(table.companyId, table.environmentId, table.transferNumber),
	check("transfers_check", sql`source_warehouse_id <> destination_warehouse_id`),
	check("transfers_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("transfers_status_check", sql`(status)::text = ANY ((ARRAY['draft'::character varying, 'approved'::character varying, 'in_transit'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])`),
]);

export const transferItems = pgTable("transfer_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	transferId: uuid("transfer_id").notNull(),
	productId: uuid("product_id").notNull(),
	quantity: numeric({ precision: 20, scale:  6 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId, table.productId],
			foreignColumns: [products.id, products.companyId, products.environmentId],
			name: "transfer_items_company_id_environment_id_product_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.transferId],
			foreignColumns: [transfers.id, transfers.companyId, transfers.environmentId],
			name: "transfer_items_company_id_environment_id_transfer_id_fkey"
		}),
	unique("transfer_items_company_id_environment_id_transfer_id_produc_key").on(table.companyId, table.environmentId, table.productId, table.transferId),
	check("transfer_items_quantity_check", sql`quantity > (0)::numeric`),
]);

export const documentTypesPeople = pgTable("document_types_people", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: varchar({ length: 150 }),
}, (table) => [
	uniqueIndex("document_types_people_name_unique").using("btree", sql`lower((name)::text)`),
	unique("document_types_people_name_key").on(table.name),
]);

export const people = pgTable("people", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	firstName: varchar("first_name", { length: 150 }).notNull(),
	middleName: varchar("middle_name", { length: 150 }),
	lastName: varchar("last_name", { length: 150 }),
	secondLastName: varchar("second_last_name", { length: 150 }),
	documentTypesPeopleId: uuid("document_types_people_id").notNull(),
	documentNumber: varchar("document_number", { length: 100 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	birthDate: date("birth_date"),
	addressStr: varchar("address_str", { length: 255 }),
	addressFields: text("address_fields").array().default([""]).notNull(),
	address: jsonb().default({}).notNull(),
	metadata: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("idx_people_document").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.documentTypesPeopleId.asc().nullsLast().op("text_ops"), table.documentNumber.asc().nullsLast().op("text_ops")).where(sql`(document_number IS NOT NULL)`),
	index("idx_people_name").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("text_ops"), table.lastName.asc().nullsLast().op("text_ops"), table.firstName.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "people_company_id_environment_id_fkey"
		}),
	foreignKey({
			columns: [table.documentTypesPeopleId],
			foreignColumns: [documentTypesPeople.id],
			name: "people_document_types_people_id_fkey"
		}),
	unique("people_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	check("people_address_check", sql`jsonb_typeof(address) = 'object'::text`),
	check("people_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
]);

export const customerTypes = pgTable("customer_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: varchar({ length: 150 }),
}, (table) => [
	uniqueIndex("customer_types_name_unique").using("btree", sql`lower((name)::text)`),
	unique("customer_types_name_key").on(table.name),
]);

export const customers = pgTable("customers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	personId: uuid("person_id").notNull(),
	customerCode: varchar("customer_code", { length: 100 }),
	customerTypeId: uuid("customer_type_id").notNull(),
	creditLimit: numeric("credit_limit", { precision: 20, scale:  6 }).default('0').notNull(),
	paymentTermsDays: integer("payment_terms_days").default(0).notNull(),
	metadata: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId, table.personId],
			foreignColumns: [people.id, people.companyId, people.environmentId],
			name: "customers_company_id_environment_id_person_id_fkey"
		}),
	foreignKey({
			columns: [table.customerTypeId],
			foreignColumns: [customerTypes.id],
			name: "customers_customer_type_id_fkey"
		}),
	unique("customers_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("customers_company_id_environment_id_person_id_key").on(table.companyId, table.environmentId, table.personId),
	unique("customers_company_id_environment_id_customer_code_key").on(table.companyId, table.customerCode, table.environmentId),
	check("customers_credit_limit_check", sql`credit_limit >= (0)::numeric`),
	check("customers_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("customers_payment_terms_days_check", sql`payment_terms_days >= 0`),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	personId: uuid("person_id").notNull(),
	username: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash"),
	authProvider: varchar("auth_provider", { length: 50 }).default('local').notNull(),
	externalAuthId: varchar("external_auth_id", { length: 255 }),
	isActive: boolean("is_active").default(true).notNull(),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId, table.personId],
			foreignColumns: [people.id, people.companyId, people.environmentId],
			name: "users_company_id_environment_id_person_id_fkey"
		}),
	unique("users_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("users_company_id_environment_id_username_key").on(table.companyId, table.environmentId, table.username),
	unique("users_company_id_environment_id_email_key").on(table.companyId, table.email, table.environmentId),
	check("users_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
]);

export const roles = pgTable("roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	actions: text().array().default([""]).notNull(),
	description: text(),
	isSystem: boolean("is_system").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "roles_company_id_environment_id_fkey"
		}),
	unique("roles_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("roles_company_id_environment_id_name_key").on(table.companyId, table.environmentId, table.name),
]);

export const userRoles = pgTable("user_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	userId: uuid("user_id").notNull(),
	roleId: uuid("role_id").notNull(),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_user_roles_role").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.roleId.asc().nullsLast().op("uuid_ops")),
	index("idx_user_roles_user").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.roleId],
			foreignColumns: [roles.id, roles.companyId, roles.environmentId],
			name: "user_roles_company_id_environment_id_role_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.userId],
			foreignColumns: [users.id, users.companyId, users.environmentId],
			name: "user_roles_company_id_environment_id_user_id_fkey"
		}),
	unique("user_roles_company_id_environment_id_user_id_role_id_key").on(table.companyId, table.environmentId, table.roleId, table.userId),
]);

export const documentTypes = pgTable("document_types", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	name: varchar({ length: 150 }).notNull(),
	code: varchar({ length: 100 }).notNull(),
	description: text(),
	category: varchar({ length: 50 }),
	numberingPrefix: varchar("numbering_prefix", { length: 30 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	nextNumber: bigint("next_number", { mode: "number" }).default(1).notNull(),
	metadata: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "document_types_company_id_environment_id_fkey"
		}),
	unique("document_types_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("document_types_company_id_environment_id_code_key").on(table.code, table.companyId, table.environmentId),
	check("document_types_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("document_types_next_number_check", sql`next_number > 0`),
]);

export const documentTypeFields = pgTable("document_type_fields", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	documentTypeId: uuid("document_type_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	label: varchar({ length: 150 }).notNull(),
	dataType: varchar("data_type", { length: 30 }).notNull(),
	isRequired: boolean("is_required").default(false).notNull(),
	isCurrency: boolean("is_currency").default(false).notNull(),
	position: integer().default(0).notNull(),
	options: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId, table.documentTypeId],
			foreignColumns: [documentTypes.id, documentTypes.companyId, documentTypes.environmentId],
			name: "document_type_fields_company_id_environment_id_document_ty_fkey"
		}),
	unique("document_type_fields_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("document_type_fields_company_id_environment_id_document_typ_key").on(table.companyId, table.documentTypeId, table.environmentId, table.name),
	check("document_type_fields_check", sql`(NOT is_currency) OR ((data_type)::text = ANY ((ARRAY['number'::character varying, 'decimal'::character varying, 'currency'::character varying])::text[]))`),
	check("document_type_fields_data_type_check", sql`(data_type)::text = ANY ((ARRAY['text'::character varying, 'number'::character varying, 'decimal'::character varying, 'date'::character varying, 'datetime'::character varying, 'boolean'::character varying, 'currency'::character varying, 'select'::character varying, 'textarea'::character varying, 'json'::character varying])::text[])`),
	check("document_type_fields_options_check", sql`jsonb_typeof(options) = 'object'::text`),
	check("document_type_fields_position_check", sql`"position" >= 0`),
]);

export const documentTypeHeaders = pgTable("document_type_headers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	documentTypeId: uuid("document_type_id").notNull(),
	title: varchar({ length: 150 }).notNull(),
	fieldName: varchar("field_name", { length: 100 }),
	position: integer().default(0).notNull(),
	metadata: jsonb().default({}).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId, table.documentTypeId],
			foreignColumns: [documentTypes.id, documentTypes.companyId, documentTypes.environmentId],
			name: "document_type_headers_company_id_environment_id_document_t_fkey"
		}),
	check("document_type_headers_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("document_type_headers_position_check", sql`"position" >= 0`),
]);

export const documentTypeFooters = pgTable("document_type_footers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	documentTypeId: uuid("document_type_id").notNull(),
	title: varchar({ length: 150 }).notNull(),
	fieldName: varchar("field_name", { length: 100 }),
	position: integer().default(0).notNull(),
	metadata: jsonb().default({}).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId, table.documentTypeId],
			foreignColumns: [documentTypes.id, documentTypes.companyId, documentTypes.environmentId],
			name: "document_type_footers_company_id_environment_id_document_t_fkey"
		}),
	check("document_type_footers_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("document_type_footers_position_check", sql`"position" >= 0`),
]);

export const documents = pgTable("documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	documentTypeId: uuid("document_type_id").notNull(),
	documentNumber: varchar("document_number", { length: 100 }).notNull(),
	personId: uuid("person_id"),
	customerId: uuid("customer_id"),
	status: varchar({ length: 30 }).default('draft').notNull(),
	issueDate: date("issue_date").default(sql`CURRENT_DATE`).notNull(),
	dueDate: date("due_date"),
	currencyCode: char("currency_code", { length: 3 }).notNull(),
	subtotal: numeric({ precision: 20, scale:  6 }).default('0').notNull(),
	taxTotal: numeric("tax_total", { precision: 20, scale:  6 }).default('0').notNull(),
	discountTotal: numeric("discount_total", { precision: 20, scale:  6 }).default('0').notNull(),
	total: numeric({ precision: 20, scale:  6 }).default('0').notNull(),
	data: jsonb().default({}).notNull(),
	notes: text(),
	metadata: jsonb().default({}).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_documents_customer").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_documents_issue_date").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("date_ops"), table.issueDate.asc().nullsLast().op("uuid_ops")),
	index("idx_documents_status").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	index("idx_documents_type").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.documentTypeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.customerId],
			foreignColumns: [customers.id, customers.companyId, customers.environmentId],
			name: "documents_company_id_environment_id_customer_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.documentTypeId],
			foreignColumns: [documentTypes.id, documentTypes.companyId, documentTypes.environmentId],
			name: "documents_company_id_environment_id_document_type_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.personId],
			foreignColumns: [people.id, people.companyId, people.environmentId],
			name: "documents_company_id_environment_id_person_id_fkey"
		}),
	unique("documents_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("documents_company_id_environment_id_document_type_id_docume_key").on(table.companyId, table.documentNumber, table.documentTypeId, table.environmentId),
	check("documents_currency_code_check", sql`currency_code ~ '^[A-Z]{3}$'::text`),
	check("documents_data_check", sql`jsonb_typeof(data) = 'object'::text`),
	check("documents_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("documents_status_check", sql`(status)::text = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'approved'::character varying, 'issued'::character varying, 'paid'::character varying, 'cancelled'::character varying, 'rejected'::character varying])::text[])`),
]);

export const documentItems = pgTable("document_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	documentId: uuid("document_id").notNull(),
	productId: uuid("product_id"),
	description: text().notNull(),
	quantity: numeric({ precision: 20, scale:  6 }).notNull(),
	unitPrice: numeric("unit_price", { precision: 20, scale:  6 }).notNull(),
	discountAmount: numeric("discount_amount", { precision: 20, scale:  6 }).default('0').notNull(),
	taxAmount: numeric("tax_amount", { precision: 20, scale:  6 }).default('0').notNull(),
	total: numeric({ precision: 20, scale:  6 }).notNull(),
	position: integer().default(0).notNull(),
	metadata: jsonb().default({}).notNull(),
}, (table) => [
	index("idx_document_items_document").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.documentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.documentId],
			foreignColumns: [documents.id, documents.companyId, documents.environmentId],
			name: "document_items_company_id_environment_id_document_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.productId],
			foreignColumns: [products.id, products.companyId, products.environmentId],
			name: "document_items_company_id_environment_id_product_id_fkey"
		}),
	unique("document_items_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	check("document_items_discount_amount_check", sql`discount_amount >= (0)::numeric`),
	check("document_items_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("document_items_position_check", sql`"position" >= 0`),
	check("document_items_quantity_check", sql`quantity > (0)::numeric`),
	check("document_items_tax_amount_check", sql`tax_amount >= (0)::numeric`),
	check("document_items_unit_price_check", sql`unit_price >= (0)::numeric`),
]);

export const taxes = pgTable("taxes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	name: varchar({ length: 150 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	description: text(),
	taxType: varchar("tax_type", { length: 30 }).default('percentage').notNull(),
	rate: numeric({ precision: 12, scale:  6 }).notNull(),
	countryCode: char("country_code", { length: 2 }),
	regionCode: varchar("region_code", { length: 100 }),
	isInclusive: boolean("is_inclusive").default(false).notNull(),
	isCompound: boolean("is_compound").default(false).notNull(),
	validFrom: date("valid_from"),
	validUntil: date("valid_until"),
	metadata: jsonb().default({}).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "taxes_company_id_environment_id_fkey"
		}),
	unique("taxes_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("taxes_company_id_environment_id_code_key").on(table.code, table.companyId, table.environmentId),
	check("taxes_check", sql`(valid_until IS NULL) OR (valid_from IS NULL) OR (valid_until >= valid_from)`),
	check("taxes_country_code_check", sql`(country_code IS NULL) OR (country_code ~ '^[A-Z]{2}$'::text)`),
	check("taxes_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("taxes_rate_check", sql`rate >= (0)::numeric`),
	check("taxes_tax_type_check", sql`(tax_type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying])::text[])`),
]);

export const productTaxes = pgTable("product_taxes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	productId: uuid("product_id").notNull(),
	taxId: uuid("tax_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId, table.productId],
			foreignColumns: [products.id, products.companyId, products.environmentId],
			name: "product_taxes_company_id_environment_id_product_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.taxId],
			foreignColumns: [taxes.id, taxes.companyId, taxes.environmentId],
			name: "product_taxes_company_id_environment_id_tax_id_fkey"
		}),
	unique("product_taxes_company_id_environment_id_product_id_tax_id_key").on(table.companyId, table.environmentId, table.productId, table.taxId),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	actorUserId: uuid("actor_user_id"),
	entityType: varchar("entity_type", { length: 100 }).notNull(),
	entityId: uuid("entity_id").notNull(),
	action: varchar({ length: 50 }).notNull(),
	oldValues: jsonb("old_values"),
	newValues: jsonb("new_values"),
	changes: jsonb().default({}).notNull(),
	ipAddress: inet("ip_address"),
	userAgent: text("user_agent"),
	requestId: varchar("request_id", { length: 150 }),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_audit_logs_action").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.action.asc().nullsLast().op("uuid_ops")),
	index("idx_audit_logs_actor").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.actorUserId.asc().nullsLast().op("uuid_ops")),
	index("idx_audit_logs_created_at").using("btree", table.companyId.asc().nullsLast().op("timestamptz_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_audit_logs_entity").using("btree", table.companyId.asc().nullsLast().op("text_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.entityType.asc().nullsLast().op("uuid_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.actorUserId],
			foreignColumns: [users.id, users.companyId, users.environmentId],
			name: "audit_logs_company_id_environment_id_actor_user_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "audit_logs_company_id_environment_id_fkey"
		}),
	check("audit_logs_action_check", sql`(action)::text = ANY ((ARRAY['create'::character varying, 'update'::character varying, 'delete'::character varying, 'activate'::character varying, 'deactivate'::character varying, 'approve'::character varying, 'cancel'::character varying, 'login'::character varying, 'logout'::character varying, 'permission_change'::character varying])::text[])`),
	check("audit_logs_changes_check", sql`jsonb_typeof(changes) = 'object'::text`),
	check("audit_logs_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
]);

export const accounts = pgTable("accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	parentId: uuid("parent_id"),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 150 }).notNull(),
	accountType: varchar("account_type", { length: 30 }).notNull(),
	normalBalance: varchar("normal_balance", { length: 10 }).notNull(),
	isPostable: boolean("is_postable").default(true).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "accounts_company_id_environment_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.parentId],
			foreignColumns: [table.id, table.companyId, table.environmentId],
			name: "accounts_company_id_environment_id_parent_id_fkey"
		}),
	unique("accounts_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("accounts_company_id_environment_id_code_key").on(table.code, table.companyId, table.environmentId),
	check("accounts_account_type_check", sql`(account_type)::text = ANY ((ARRAY['asset'::character varying, 'liability'::character varying, 'equity'::character varying, 'income'::character varying, 'expense'::character varying, 'cost'::character varying])::text[])`),
	check("accounts_check", sql`(parent_id IS NULL) OR (parent_id <> id)`),
	check("accounts_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("accounts_normal_balance_check", sql`(normal_balance)::text = ANY ((ARRAY['debit'::character varying, 'credit'::character varying])::text[])`),
]);

export const fiscalPeriods = pgTable("fiscal_periods", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	status: varchar({ length: 20 }).default('open').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "fiscal_periods_company_id_environment_id_fkey"
		}),
	unique("fiscal_periods_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("fiscal_periods_company_id_environment_id_name_key").on(table.companyId, table.environmentId, table.name),
	check("fiscal_periods_check", sql`end_date >= start_date`),
	check("fiscal_periods_status_check", sql`(status)::text = ANY ((ARRAY['open'::character varying, 'closed'::character varying, 'locked'::character varying])::text[])`),
]);

export const journalEntries = pgTable("journal_entries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	fiscalPeriodId: uuid("fiscal_period_id").notNull(),
	entryNumber: varchar("entry_number", { length: 100 }).notNull(),
	description: text().notNull(),
	entryDate: date("entry_date").notNull(),
	status: varchar({ length: 20 }).default('draft').notNull(),
	documentId: uuid("document_id"),
	createdBy: uuid("created_by"),
	postedBy: uuid("posted_by"),
	postedAt: timestamp("posted_at", { withTimezone: true, mode: 'string' }),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_journal_entries_date").using("btree", table.companyId.asc().nullsLast().op("date_ops"), table.environmentId.asc().nullsLast().op("date_ops"), table.entryDate.asc().nullsLast().op("uuid_ops")),
	index("idx_journal_entries_status").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.documentId],
			foreignColumns: [documents.id, documents.companyId, documents.environmentId],
			name: "journal_entries_company_id_environment_id_document_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.fiscalPeriodId],
			foreignColumns: [fiscalPeriods.id, fiscalPeriods.companyId, fiscalPeriods.environmentId],
			name: "journal_entries_company_id_environment_id_fiscal_period_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "journal_entries_company_id_environment_id_fkey"
		}),
	unique("journal_entries_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("journal_entries_company_id_environment_id_entry_number_key").on(table.companyId, table.entryNumber, table.environmentId),
	check("journal_entries_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("journal_entries_status_check", sql`(status)::text = ANY ((ARRAY['draft'::character varying, 'posted'::character varying, 'reversed'::character varying])::text[])`),
]);

export const journalEntryLines = pgTable("journal_entry_lines", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	journalEntryId: uuid("journal_entry_id").notNull(),
	accountId: uuid("account_id").notNull(),
	description: text(),
	debit: numeric({ precision: 20, scale:  6 }).default('0').notNull(),
	credit: numeric({ precision: 20, scale:  6 }).default('0').notNull(),
	currencyCode: char("currency_code", { length: 3 }).notNull(),
	exchangeRate: numeric("exchange_rate", { precision: 20, scale:  10 }).default('1').notNull(),
	partyId: uuid("party_id"),
	position: integer().default(0).notNull(),
	metadata: jsonb().default({}).notNull(),
}, (table) => [
	index("idx_journal_lines_account").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.accountId.asc().nullsLast().op("uuid_ops")),
	index("idx_journal_lines_entry").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.journalEntryId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.accountId],
			foreignColumns: [accounts.id, accounts.companyId, accounts.environmentId],
			name: "journal_entry_lines_company_id_environment_id_account_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.journalEntryId],
			foreignColumns: [journalEntries.id, journalEntries.companyId, journalEntries.environmentId],
			name: "journal_entry_lines_company_id_environment_id_journal_entr_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.partyId],
			foreignColumns: [people.id, people.companyId, people.environmentId],
			name: "journal_entry_lines_company_id_environment_id_party_id_fkey"
		}),
	check("journal_entry_lines_check", sql`((debit > (0)::numeric) AND (credit = (0)::numeric)) OR ((credit > (0)::numeric) AND (debit = (0)::numeric))`),
	check("journal_entry_lines_credit_check", sql`credit >= (0)::numeric`),
	check("journal_entry_lines_currency_code_check", sql`currency_code ~ '^[A-Z]{3}$'::text`),
	check("journal_entry_lines_debit_check", sql`debit >= (0)::numeric`),
	check("journal_entry_lines_exchange_rate_check", sql`exchange_rate > (0)::numeric`),
	check("journal_entry_lines_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("journal_entry_lines_position_check", sql`"position" >= 0`),
]);

export const documentTaxes = pgTable("document_taxes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	documentId: uuid("document_id").notNull(),
	documentItemId: uuid("document_item_id"),
	taxId: uuid("tax_id"),
	taxName: varchar("tax_name", { length: 150 }).notNull(),
	taxCode: varchar("tax_code", { length: 50 }),
	taxRate: numeric("tax_rate", { precision: 12, scale:  6 }).notNull(),
	taxableBase: numeric("taxable_base", { precision: 20, scale:  6 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 20, scale:  6 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_document_taxes_document").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.documentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.documentId],
			foreignColumns: [documents.id, documents.companyId, documents.environmentId],
			name: "document_taxes_company_id_environment_id_document_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.documentItemId],
			foreignColumns: [documentItems.id, documentItems.companyId, documentItems.environmentId],
			name: "document_taxes_company_id_environment_id_document_item_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.taxId],
			foreignColumns: [taxes.id, taxes.companyId, taxes.environmentId],
			name: "document_taxes_company_id_environment_id_tax_id_fkey"
		}),
	check("document_taxes_tax_amount_check", sql`tax_amount >= (0)::numeric`),
	check("document_taxes_tax_rate_check", sql`tax_rate >= (0)::numeric`),
	check("document_taxes_taxable_base_check", sql`taxable_base >= (0)::numeric`),
]);

export const cashRegisters = pgTable("cash_registers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	branchId: uuid("branch_id"),
	warehouseId: uuid("warehouse_id").notNull(),
	name: varchar({ length: 150 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId, table.branchId],
			foreignColumns: [branches.id, branches.companyId, branches.environmentId],
			name: "cash_registers_company_id_environment_id_branch_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "cash_registers_company_id_environment_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.warehouseId],
			foreignColumns: [warehouses.id, warehouses.companyId, warehouses.environmentId],
			name: "cash_registers_company_id_environment_id_warehouse_id_fkey"
		}),
	unique("cash_registers_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("cash_registers_company_id_environment_id_code_key").on(table.code, table.companyId, table.environmentId),
	check("cash_registers_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
]);

export const cashSessions = pgTable("cash_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	cashRegisterId: uuid("cash_register_id").notNull(),
	openedBy: uuid("opened_by").notNull(),
	closedBy: uuid("closed_by"),
	status: varchar({ length: 20 }).default('open').notNull(),
	currencyCode: char("currency_code", { length: 3 }).notNull(),
	openingAmount: numeric("opening_amount", { precision: 20, scale:  6 }).default('0').notNull(),
	expectedAmount: numeric("expected_amount", { precision: 20, scale:  6 }),
	closingAmount: numeric("closing_amount", { precision: 20, scale:  6 }),
	differenceAmount: numeric("difference_amount", { precision: 20, scale:  6 }),
	openingNotes: text("opening_notes"),
	closingNotes: text("closing_notes"),
	openedAt: timestamp("opened_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	closedAt: timestamp("closed_at", { withTimezone: true, mode: 'string' }),
	metadata: jsonb().default({}).notNull(),
}, (table) => [
	uniqueIndex("idx_cash_sessions_one_open_per_register").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.cashRegisterId.asc().nullsLast().op("uuid_ops")).where(sql`((status)::text = 'open'::text)`),
	index("idx_cash_sessions_opened_at").using("btree", table.companyId.asc().nullsLast().op("timestamptz_ops"), table.environmentId.asc().nullsLast().op("timestamptz_ops"), table.openedAt.asc().nullsLast().op("uuid_ops")),
	index("idx_cash_sessions_opened_by").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.openedBy.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.cashRegisterId],
			foreignColumns: [cashRegisters.id, cashRegisters.companyId, cashRegisters.environmentId],
			name: "cash_sessions_company_id_environment_id_cash_register_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.closedBy],
			foreignColumns: [users.id, users.companyId, users.environmentId],
			name: "cash_sessions_company_id_environment_id_closed_by_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.openedBy],
			foreignColumns: [users.id, users.companyId, users.environmentId],
			name: "cash_sessions_company_id_environment_id_opened_by_fkey"
		}),
	unique("cash_sessions_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	check("cash_sessions_check", sql`(((status)::text = 'open'::text) AND (closed_at IS NULL)) OR (((status)::text = 'closed'::text) AND (closed_at IS NOT NULL))`),
	check("cash_sessions_currency_code_check", sql`currency_code ~ '^[A-Z]{3}$'::text`),
	check("cash_sessions_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("cash_sessions_opening_amount_check", sql`opening_amount >= (0)::numeric`),
	check("cash_sessions_status_check", sql`(status)::text = ANY ((ARRAY['open'::character varying, 'closed'::character varying])::text[])`),
]);

export const paymentMethods = pgTable("payment_methods", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	paymentType: varchar("payment_type", { length: 30 }).notNull(),
	requiresReference: boolean("requires_reference").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "payment_methods_company_id_environment_id_fkey"
		}),
	unique("payment_methods_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("payment_methods_company_id_environment_id_code_key").on(table.code, table.companyId, table.environmentId),
	check("payment_methods_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("payment_methods_payment_type_check", sql`(payment_type)::text = ANY ((ARRAY['cash'::character varying, 'card'::character varying, 'bank_transfer'::character varying, 'digital_wallet'::character varying, 'credit'::character varying, 'other'::character varying])::text[])`),
]);

export const sales = pgTable("sales", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	cashRegisterId: uuid("cash_register_id"),
	cashSessionId: uuid("cash_session_id"),
	warehouseId: uuid("warehouse_id").notNull(),
	customerId: uuid("customer_id"),
	sellerId: uuid("seller_id").notNull(),
	documentId: uuid("document_id"),
	saleNumber: varchar("sale_number", { length: 100 }).notNull(),
	status: varchar({ length: 30 }).default('draft').notNull(),
	saleDate: timestamp("sale_date", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	currencyCode: char("currency_code", { length: 3 }).notNull(),
	subtotal: numeric({ precision: 20, scale:  6 }).default('0').notNull(),
	discountTotal: numeric("discount_total", { precision: 20, scale:  6 }).default('0').notNull(),
	taxTotal: numeric("tax_total", { precision: 20, scale:  6 }).default('0').notNull(),
	total: numeric({ precision: 20, scale:  6 }).default('0').notNull(),
	paidTotal: numeric("paid_total", { precision: 20, scale:  6 }).default('0').notNull(),
	changeTotal: numeric("change_total", { precision: 20, scale:  6 }).default('0').notNull(),
	notes: text(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_sales_customer").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_sales_date").using("btree", table.companyId.asc().nullsLast().op("timestamptz_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.saleDate.desc().nullsFirst().op("uuid_ops")),
	index("idx_sales_seller").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("idx_sales_session").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.cashSessionId.asc().nullsLast().op("uuid_ops")),
	index("idx_sales_status").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.cashRegisterId],
			foreignColumns: [cashRegisters.id, cashRegisters.companyId, cashRegisters.environmentId],
			name: "sales_company_id_environment_id_cash_register_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.cashSessionId],
			foreignColumns: [cashSessions.id, cashSessions.companyId, cashSessions.environmentId],
			name: "sales_company_id_environment_id_cash_session_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.customerId],
			foreignColumns: [customers.id, customers.companyId, customers.environmentId],
			name: "sales_company_id_environment_id_customer_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.documentId],
			foreignColumns: [documents.id, documents.companyId, documents.environmentId],
			name: "sales_company_id_environment_id_document_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId],
			foreignColumns: [environments.id, environments.companyId],
			name: "sales_company_id_environment_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.sellerId],
			foreignColumns: [users.id, users.companyId, users.environmentId],
			name: "sales_company_id_environment_id_seller_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.warehouseId],
			foreignColumns: [warehouses.id, warehouses.companyId, warehouses.environmentId],
			name: "sales_company_id_environment_id_warehouse_id_fkey"
		}),
	unique("sales_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("sales_company_id_environment_id_sale_number_key").on(table.companyId, table.environmentId, table.saleNumber),
	check("sales_change_total_check", sql`change_total >= (0)::numeric`),
	check("sales_currency_code_check", sql`currency_code ~ '^[A-Z]{3}$'::text`),
	check("sales_discount_total_check", sql`discount_total >= (0)::numeric`),
	check("sales_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("sales_paid_total_check", sql`paid_total >= (0)::numeric`),
	check("sales_status_check", sql`(status)::text = ANY ((ARRAY['draft'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'partially_refunded'::character varying, 'refunded'::character varying])::text[])`),
	check("sales_subtotal_check", sql`subtotal >= (0)::numeric`),
	check("sales_tax_total_check", sql`tax_total >= (0)::numeric`),
	check("sales_total_check", sql`total >= (0)::numeric`),
]);

export const saleItems = pgTable("sale_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	saleId: uuid("sale_id").notNull(),
	productId: uuid("product_id"),
	productName: varchar("product_name", { length: 255 }).notNull(),
	sku: varchar({ length: 100 }),
	barcode: varchar({ length: 100 }),
	quantity: numeric({ precision: 20, scale:  6 }).notNull(),
	unit: varchar({ length: 30 }).notNull(),
	unitPrice: numeric("unit_price", { precision: 20, scale:  6 }).notNull(),
	discountAmount: numeric("discount_amount", { precision: 20, scale:  6 }).default('0').notNull(),
	taxAmount: numeric("tax_amount", { precision: 20, scale:  6 }).default('0').notNull(),
	subtotal: numeric({ precision: 20, scale:  6 }).notNull(),
	total: numeric({ precision: 20, scale:  6 }).notNull(),
	position: integer().default(0).notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_sale_items_product").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_sale_items_sale").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.saleId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.productId],
			foreignColumns: [products.id, products.companyId, products.environmentId],
			name: "sale_items_company_id_environment_id_product_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.saleId],
			foreignColumns: [sales.id, sales.companyId, sales.environmentId],
			name: "sale_items_company_id_environment_id_sale_id_fkey"
		}),
	unique("sale_items_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	check("sale_items_discount_amount_check", sql`discount_amount >= (0)::numeric`),
	check("sale_items_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("sale_items_position_check", sql`"position" >= 0`),
	check("sale_items_quantity_check", sql`quantity > (0)::numeric`),
	check("sale_items_subtotal_check", sql`subtotal >= (0)::numeric`),
	check("sale_items_tax_amount_check", sql`tax_amount >= (0)::numeric`),
	check("sale_items_total_check", sql`total >= (0)::numeric`),
	check("sale_items_unit_price_check", sql`unit_price >= (0)::numeric`),
]);

export const saleItemTaxes = pgTable("sale_item_taxes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	saleItemId: uuid("sale_item_id").notNull(),
	taxId: uuid("tax_id"),
	taxName: varchar("tax_name", { length: 150 }).notNull(),
	taxCode: varchar("tax_code", { length: 50 }),
	taxRate: numeric("tax_rate", { precision: 12, scale:  6 }).notNull(),
	taxableBase: numeric("taxable_base", { precision: 20, scale:  6 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 20, scale:  6 }).notNull(),
	isInclusive: boolean("is_inclusive").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_sale_item_taxes_item").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.saleItemId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.saleItemId],
			foreignColumns: [saleItems.id, saleItems.companyId, saleItems.environmentId],
			name: "sale_item_taxes_company_id_environment_id_sale_item_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.taxId],
			foreignColumns: [taxes.id, taxes.companyId, taxes.environmentId],
			name: "sale_item_taxes_company_id_environment_id_tax_id_fkey"
		}),
	check("sale_item_taxes_tax_amount_check", sql`tax_amount >= (0)::numeric`),
	check("sale_item_taxes_tax_rate_check", sql`tax_rate >= (0)::numeric`),
	check("sale_item_taxes_taxable_base_check", sql`taxable_base >= (0)::numeric`),
]);

export const salePayments = pgTable("sale_payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	saleId: uuid("sale_id").notNull(),
	paymentMethodId: uuid("payment_method_id").notNull(),
	amount: numeric({ precision: 20, scale:  6 }).notNull(),
	reference: varchar({ length: 255 }),
	status: varchar({ length: 20 }).default('confirmed').notNull(),
	receivedBy: uuid("received_by"),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	metadata: jsonb().default({}).notNull(),
}, (table) => [
	index("idx_sale_payments_method").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.paymentMethodId.asc().nullsLast().op("uuid_ops")),
	index("idx_sale_payments_sale").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.saleId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.paymentMethodId],
			foreignColumns: [paymentMethods.id, paymentMethods.companyId, paymentMethods.environmentId],
			name: "sale_payments_company_id_environment_id_payment_method_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.receivedBy],
			foreignColumns: [users.id, users.companyId, users.environmentId],
			name: "sale_payments_company_id_environment_id_received_by_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.saleId],
			foreignColumns: [sales.id, sales.companyId, sales.environmentId],
			name: "sale_payments_company_id_environment_id_sale_id_fkey"
		}),
	unique("sale_payments_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	check("sale_payments_amount_check", sql`amount > (0)::numeric`),
	check("sale_payments_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("sale_payments_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'failed'::character varying, 'refunded'::character varying])::text[])`),
]);

export const cashMovements = pgTable("cash_movements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	cashSessionId: uuid("cash_session_id").notNull(),
	movementType: varchar("movement_type", { length: 30 }).notNull(),
	amount: numeric({ precision: 20, scale:  6 }).notNull(),
	description: text(),
	referenceType: varchar("reference_type", { length: 50 }),
	referenceId: uuid("reference_id"),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	metadata: jsonb().default({}).notNull(),
}, (table) => [
	index("idx_cash_movements_created_at").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_cash_movements_session").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.cashSessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.cashSessionId],
			foreignColumns: [cashSessions.id, cashSessions.companyId, cashSessions.environmentId],
			name: "cash_movements_company_id_environment_id_cash_session_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.createdBy],
			foreignColumns: [users.id, users.companyId, users.environmentId],
			name: "cash_movements_company_id_environment_id_created_by_fkey"
		}),
	check("cash_movements_amount_check", sql`amount > (0)::numeric`),
	check("cash_movements_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("cash_movements_movement_type_check", sql`(movement_type)::text = ANY ((ARRAY['opening'::character varying, 'sale'::character varying, 'cash_in'::character varying, 'cash_out'::character varying, 'refund'::character varying, 'withdrawal'::character varying, 'closing_adjustment'::character varying])::text[])`),
]);

export const saleReturns = pgTable("sale_returns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	saleId: uuid("sale_id").notNull(),
	returnNumber: varchar("return_number", { length: 100 }).notNull(),
	status: varchar({ length: 20 }).default('draft').notNull(),
	reason: text(),
	subtotal: numeric({ precision: 20, scale:  6 }).default('0').notNull(),
	taxTotal: numeric("tax_total", { precision: 20, scale:  6 }).default('0').notNull(),
	total: numeric({ precision: 20, scale:  6 }).default('0').notNull(),
	createdBy: uuid("created_by").notNull(),
	approvedBy: uuid("approved_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	metadata: jsonb().default({}).notNull(),
}, (table) => [
	index("idx_sale_returns_sale").using("btree", table.companyId.asc().nullsLast().op("uuid_ops"), table.environmentId.asc().nullsLast().op("uuid_ops"), table.saleId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.approvedBy],
			foreignColumns: [users.id, users.companyId, users.environmentId],
			name: "sale_returns_company_id_environment_id_approved_by_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.createdBy],
			foreignColumns: [users.id, users.companyId, users.environmentId],
			name: "sale_returns_company_id_environment_id_created_by_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.saleId],
			foreignColumns: [sales.id, sales.companyId, sales.environmentId],
			name: "sale_returns_company_id_environment_id_sale_id_fkey"
		}),
	unique("sale_returns_company_id_environment_id_id_key").on(table.companyId, table.environmentId, table.id),
	unique("sale_returns_company_id_environment_id_return_number_key").on(table.companyId, table.environmentId, table.returnNumber),
	check("sale_returns_metadata_check", sql`jsonb_typeof(metadata) = 'object'::text`),
	check("sale_returns_status_check", sql`(status)::text = ANY ((ARRAY['draft'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])`),
	check("sale_returns_subtotal_check", sql`subtotal >= (0)::numeric`),
	check("sale_returns_tax_total_check", sql`tax_total >= (0)::numeric`),
	check("sale_returns_total_check", sql`total >= (0)::numeric`),
]);

export const saleReturnItems = pgTable("sale_return_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	companyId: uuid("company_id").notNull(),
	environmentId: uuid("environment_id").notNull(),
	saleReturnId: uuid("sale_return_id").notNull(),
	saleItemId: uuid("sale_item_id").notNull(),
	quantity: numeric({ precision: 20, scale:  6 }).notNull(),
	unitPrice: numeric("unit_price", { precision: 20, scale:  6 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 20, scale:  6 }).default('0').notNull(),
	total: numeric({ precision: 20, scale:  6 }).notNull(),
	disposition: varchar({ length: 30 }).default('restock').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.companyId, table.environmentId, table.saleItemId],
			foreignColumns: [saleItems.id, saleItems.companyId, saleItems.environmentId],
			name: "sale_return_items_company_id_environment_id_sale_item_id_fkey"
		}),
	foreignKey({
			columns: [table.companyId, table.environmentId, table.saleReturnId],
			foreignColumns: [saleReturns.id, saleReturns.companyId, saleReturns.environmentId],
			name: "sale_return_items_company_id_environment_id_sale_return_id_fkey"
		}),
	check("sale_return_items_disposition_check", sql`(disposition)::text = ANY ((ARRAY['restock'::character varying, 'damaged'::character varying, 'discarded'::character varying])::text[])`),
	check("sale_return_items_quantity_check", sql`quantity > (0)::numeric`),
	check("sale_return_items_tax_amount_check", sql`tax_amount >= (0)::numeric`),
	check("sale_return_items_total_check", sql`total >= (0)::numeric`),
	check("sale_return_items_unit_price_check", sql`unit_price >= (0)::numeric`),
]);
