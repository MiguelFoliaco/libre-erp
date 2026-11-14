import { relations } from "drizzle-orm/relations";
import { users, session, companies, environments, brands, categories, departments, products, branches, warehouses, inventory, inventoryMovements, transfers, transferItems, people, documentTypesPeople, customers, customerTypes, roles, userRoles, documentTypes, documentTypeFields, documentTypeHeaders, documentTypeFooters, documents, documentItems, taxes, productTaxes, auditLogs, accounts, fiscalPeriods, journalEntries, journalEntryLines, documentTaxes, cashRegisters, cashSessions, paymentMethods, sales, saleItems, saleItemTaxes, salePayments, cashMovements, saleReturns, saleReturnItems } from "./schema";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(users, {
		fields: [session.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	sessions: many(session),
	person: one(people, {
		fields: [users.companyId],
		references: [people.id]
	}),
	userRoles: many(userRoles),
	auditLogs: many(auditLogs),
	cashSessions_companyId: many(cashSessions, {
		relationName: "cashSessions_companyId_users_id"
	}),
	sales: many(sales),
	salePayments: many(salePayments),
	cashMovements: many(cashMovements),
	saleReturns_companyId: many(saleReturns, {
		relationName: "saleReturns_companyId_users_id"
	}),
}));

export const environmentsRelations = relations(environments, ({one, many}) => ({
	company: one(companies, {
		fields: [environments.companyId],
		references: [companies.id]
	}),
	brands: many(brands),
	categories: many(categories),
	departments: many(departments),
	products: many(products),
	branches: many(branches),
	warehouses: many(warehouses),
	inventories: many(inventory),
	inventoryMovements: many(inventoryMovements),
	transfers: many(transfers),
	people: many(people),
	roles: many(roles),
	documentTypes: many(documentTypes),
	taxes: many(taxes),
	auditLogs: many(auditLogs),
	accounts: many(accounts),
	fiscalPeriods: many(fiscalPeriods),
	journalEntries: many(journalEntries),
	cashRegisters: many(cashRegisters),
	paymentMethods: many(paymentMethods),
	sales: many(sales),
}));

export const companiesRelations = relations(companies, ({many}) => ({
	environments: many(environments),
}));

export const brandsRelations = relations(brands, ({one, many}) => ({
	environment: one(environments, {
		fields: [brands.companyId],
		references: [environments.id]
	}),
	products: many(products),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	environment: one(environments, {
		fields: [categories.companyId],
		references: [environments.id]
	}),
	category: one(categories, {
		fields: [categories.companyId],
		references: [categories.id],
		relationName: "categories_companyId_categories_id"
	}),
	categories: many(categories, {
		relationName: "categories_companyId_categories_id"
	}),
	products: many(products),
}));

export const departmentsRelations = relations(departments, ({one, many}) => ({
	environment: one(environments, {
		fields: [departments.companyId],
		references: [environments.id]
	}),
	products: many(products),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	brand: one(brands, {
		fields: [products.companyId],
		references: [brands.id]
	}),
	category: one(categories, {
		fields: [products.companyId],
		references: [categories.id]
	}),
	department: one(departments, {
		fields: [products.companyId],
		references: [departments.id]
	}),
	environment: one(environments, {
		fields: [products.companyId],
		references: [environments.id]
	}),
	inventories: many(inventory),
	inventoryMovements: many(inventoryMovements),
	transferItems: many(transferItems),
	documentItems: many(documentItems),
	productTaxes: many(productTaxes),
	saleItems: many(saleItems),
}));

export const branchesRelations = relations(branches, ({one, many}) => ({
	environment: one(environments, {
		fields: [branches.companyId],
		references: [environments.id]
	}),
	warehouses: many(warehouses),
	cashRegisters: many(cashRegisters),
}));

export const warehousesRelations = relations(warehouses, ({one, many}) => ({
	branch: one(branches, {
		fields: [warehouses.companyId],
		references: [branches.id]
	}),
	environment: one(environments, {
		fields: [warehouses.companyId],
		references: [environments.id]
	}),
	inventories: many(inventory),
	inventoryMovements: many(inventoryMovements),
	transfers_companyId: many(transfers, {
		relationName: "transfers_companyId_warehouses_id"
	}),
	cashRegisters: many(cashRegisters),
	sales: many(sales),
}));

export const inventoryRelations = relations(inventory, ({one}) => ({
	environment: one(environments, {
		fields: [inventory.companyId],
		references: [environments.id]
	}),
	product: one(products, {
		fields: [inventory.companyId],
		references: [products.id]
	}),
	warehouse: one(warehouses, {
		fields: [inventory.companyId],
		references: [warehouses.id]
	}),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({one}) => ({
	environment: one(environments, {
		fields: [inventoryMovements.companyId],
		references: [environments.id]
	}),
	product: one(products, {
		fields: [inventoryMovements.companyId],
		references: [products.id]
	}),
	warehouse: one(warehouses, {
		fields: [inventoryMovements.companyId],
		references: [warehouses.id]
	}),
	transfer: one(transfers, {
		fields: [inventoryMovements.companyId],
		references: [transfers.id]
	}),
}));

export const transfersRelations = relations(transfers, ({one, many}) => ({
	inventoryMovements: many(inventoryMovements),
	warehouse_companyId: one(warehouses, {
		fields: [transfers.companyId],
		references: [warehouses.id],
		relationName: "transfers_companyId_warehouses_id"
	}),
	environment: one(environments, {
		fields: [transfers.companyId],
		references: [environments.id]
	}),
	transferItems: many(transferItems),
}));

export const transferItemsRelations = relations(transferItems, ({one}) => ({
	product: one(products, {
		fields: [transferItems.companyId],
		references: [products.id]
	}),
	transfer: one(transfers, {
		fields: [transferItems.companyId],
		references: [transfers.id]
	}),
}));

export const peopleRelations = relations(people, ({one, many}) => ({
	environment: one(environments, {
		fields: [people.companyId],
		references: [environments.id]
	}),
	documentTypesPerson: one(documentTypesPeople, {
		fields: [people.documentTypesPeopleId],
		references: [documentTypesPeople.id]
	}),
	customers: many(customers),
	users: many(users),
	documents: many(documents),
	journalEntryLines: many(journalEntryLines),
}));

export const documentTypesPeopleRelations = relations(documentTypesPeople, ({many}) => ({
	people: many(people),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	person: one(people, {
		fields: [customers.companyId],
		references: [people.id]
	}),
	customerType: one(customerTypes, {
		fields: [customers.customerTypeId],
		references: [customerTypes.id]
	}),
	documents: many(documents),
	sales: many(sales),
}));

export const customerTypesRelations = relations(customerTypes, ({many}) => ({
	customers: many(customers),
}));

export const rolesRelations = relations(roles, ({one, many}) => ({
	environment: one(environments, {
		fields: [roles.companyId],
		references: [environments.id]
	}),
	userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	role: one(roles, {
		fields: [userRoles.companyId],
		references: [roles.id]
	}),
	user: one(users, {
		fields: [userRoles.companyId],
		references: [users.id]
	}),
}));

export const documentTypesRelations = relations(documentTypes, ({one, many}) => ({
	environment: one(environments, {
		fields: [documentTypes.companyId],
		references: [environments.id]
	}),
	documentTypeFields: many(documentTypeFields),
	documentTypeHeaders: many(documentTypeHeaders),
	documentTypeFooters: many(documentTypeFooters),
	documents: many(documents),
}));

export const documentTypeFieldsRelations = relations(documentTypeFields, ({one}) => ({
	documentType: one(documentTypes, {
		fields: [documentTypeFields.companyId],
		references: [documentTypes.id]
	}),
}));

export const documentTypeHeadersRelations = relations(documentTypeHeaders, ({one}) => ({
	documentType: one(documentTypes, {
		fields: [documentTypeHeaders.companyId],
		references: [documentTypes.id]
	}),
}));

export const documentTypeFootersRelations = relations(documentTypeFooters, ({one}) => ({
	documentType: one(documentTypes, {
		fields: [documentTypeFooters.companyId],
		references: [documentTypes.id]
	}),
}));

export const documentsRelations = relations(documents, ({one, many}) => ({
	customer: one(customers, {
		fields: [documents.companyId],
		references: [customers.id]
	}),
	documentType: one(documentTypes, {
		fields: [documents.companyId],
		references: [documentTypes.id]
	}),
	person: one(people, {
		fields: [documents.companyId],
		references: [people.id]
	}),
	documentItems: many(documentItems),
	journalEntries: many(journalEntries),
	documentTaxes: many(documentTaxes),
	sales: many(sales),
}));

export const documentItemsRelations = relations(documentItems, ({one, many}) => ({
	document: one(documents, {
		fields: [documentItems.companyId],
		references: [documents.id]
	}),
	product: one(products, {
		fields: [documentItems.companyId],
		references: [products.id]
	}),
	documentTaxes: many(documentTaxes),
}));

export const taxesRelations = relations(taxes, ({one, many}) => ({
	environment: one(environments, {
		fields: [taxes.companyId],
		references: [environments.id]
	}),
	productTaxes: many(productTaxes),
	documentTaxes: many(documentTaxes),
	saleItemTaxes: many(saleItemTaxes),
}));

export const productTaxesRelations = relations(productTaxes, ({one}) => ({
	product: one(products, {
		fields: [productTaxes.companyId],
		references: [products.id]
	}),
	tax: one(taxes, {
		fields: [productTaxes.companyId],
		references: [taxes.id]
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user: one(users, {
		fields: [auditLogs.companyId],
		references: [users.id]
	}),
	environment: one(environments, {
		fields: [auditLogs.companyId],
		references: [environments.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one, many}) => ({
	environment: one(environments, {
		fields: [accounts.companyId],
		references: [environments.id]
	}),
	account: one(accounts, {
		fields: [accounts.companyId],
		references: [accounts.id],
		relationName: "accounts_companyId_accounts_id"
	}),
	accounts: many(accounts, {
		relationName: "accounts_companyId_accounts_id"
	}),
	journalEntryLines: many(journalEntryLines),
}));

export const fiscalPeriodsRelations = relations(fiscalPeriods, ({one, many}) => ({
	environment: one(environments, {
		fields: [fiscalPeriods.companyId],
		references: [environments.id]
	}),
	journalEntries: many(journalEntries),
}));

export const journalEntriesRelations = relations(journalEntries, ({one, many}) => ({
	document: one(documents, {
		fields: [journalEntries.companyId],
		references: [documents.id]
	}),
	fiscalPeriod: one(fiscalPeriods, {
		fields: [journalEntries.companyId],
		references: [fiscalPeriods.id]
	}),
	environment: one(environments, {
		fields: [journalEntries.companyId],
		references: [environments.id]
	}),
	journalEntryLines: many(journalEntryLines),
}));

export const journalEntryLinesRelations = relations(journalEntryLines, ({one}) => ({
	account: one(accounts, {
		fields: [journalEntryLines.companyId],
		references: [accounts.id]
	}),
	journalEntry: one(journalEntries, {
		fields: [journalEntryLines.companyId],
		references: [journalEntries.id]
	}),
	person: one(people, {
		fields: [journalEntryLines.companyId],
		references: [people.id]
	}),
}));

export const documentTaxesRelations = relations(documentTaxes, ({one}) => ({
	document: one(documents, {
		fields: [documentTaxes.companyId],
		references: [documents.id]
	}),
	documentItem: one(documentItems, {
		fields: [documentTaxes.companyId],
		references: [documentItems.id]
	}),
	tax: one(taxes, {
		fields: [documentTaxes.companyId],
		references: [taxes.id]
	}),
}));

export const cashRegistersRelations = relations(cashRegisters, ({one, many}) => ({
	branch: one(branches, {
		fields: [cashRegisters.companyId],
		references: [branches.id]
	}),
	environment: one(environments, {
		fields: [cashRegisters.companyId],
		references: [environments.id]
	}),
	warehouse: one(warehouses, {
		fields: [cashRegisters.companyId],
		references: [warehouses.id]
	}),
	cashSessions: many(cashSessions),
	sales: many(sales),
}));

export const cashSessionsRelations = relations(cashSessions, ({one, many}) => ({
	cashRegister: one(cashRegisters, {
		fields: [cashSessions.companyId],
		references: [cashRegisters.id]
	}),
	user_companyId: one(users, {
		fields: [cashSessions.companyId],
		references: [users.id],
		relationName: "cashSessions_companyId_users_id"
	}),
	sales: many(sales),
	cashMovements: many(cashMovements),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({one, many}) => ({
	environment: one(environments, {
		fields: [paymentMethods.companyId],
		references: [environments.id]
	}),
	salePayments: many(salePayments),
}));

export const salesRelations = relations(sales, ({one, many}) => ({
	cashRegister: one(cashRegisters, {
		fields: [sales.companyId],
		references: [cashRegisters.id]
	}),
	cashSession: one(cashSessions, {
		fields: [sales.companyId],
		references: [cashSessions.id]
	}),
	customer: one(customers, {
		fields: [sales.companyId],
		references: [customers.id]
	}),
	document: one(documents, {
		fields: [sales.companyId],
		references: [documents.id]
	}),
	environment: one(environments, {
		fields: [sales.companyId],
		references: [environments.id]
	}),
	user: one(users, {
		fields: [sales.companyId],
		references: [users.id]
	}),
	warehouse: one(warehouses, {
		fields: [sales.companyId],
		references: [warehouses.id]
	}),
	saleItems: many(saleItems),
	salePayments: many(salePayments),
	saleReturns: many(saleReturns),
}));

export const saleItemsRelations = relations(saleItems, ({one, many}) => ({
	product: one(products, {
		fields: [saleItems.companyId],
		references: [products.id]
	}),
	sale: one(sales, {
		fields: [saleItems.companyId],
		references: [sales.id]
	}),
	saleItemTaxes: many(saleItemTaxes),
	saleReturnItems: many(saleReturnItems),
}));

export const saleItemTaxesRelations = relations(saleItemTaxes, ({one}) => ({
	saleItem: one(saleItems, {
		fields: [saleItemTaxes.companyId],
		references: [saleItems.id]
	}),
	tax: one(taxes, {
		fields: [saleItemTaxes.companyId],
		references: [taxes.id]
	}),
}));

export const salePaymentsRelations = relations(salePayments, ({one}) => ({
	paymentMethod: one(paymentMethods, {
		fields: [salePayments.companyId],
		references: [paymentMethods.id]
	}),
	user: one(users, {
		fields: [salePayments.companyId],
		references: [users.id]
	}),
	sale: one(sales, {
		fields: [salePayments.companyId],
		references: [sales.id]
	}),
}));

export const cashMovementsRelations = relations(cashMovements, ({one}) => ({
	cashSession: one(cashSessions, {
		fields: [cashMovements.companyId],
		references: [cashSessions.id]
	}),
	user: one(users, {
		fields: [cashMovements.companyId],
		references: [users.id]
	}),
}));

export const saleReturnsRelations = relations(saleReturns, ({one, many}) => ({
	user_companyId: one(users, {
		fields: [saleReturns.companyId],
		references: [users.id],
		relationName: "saleReturns_companyId_users_id"
	}),
	sale: one(sales, {
		fields: [saleReturns.companyId],
		references: [sales.id]
	}),
	saleReturnItems: many(saleReturnItems),
}));

export const saleReturnItemsRelations = relations(saleReturnItems, ({one}) => ({
	saleItem: one(saleItems, {
		fields: [saleReturnItems.companyId],
		references: [saleItems.id]
	}),
	saleReturn: one(saleReturns, {
		fields: [saleReturnItems.companyId],
		references: [saleReturns.id]
	}),
}));