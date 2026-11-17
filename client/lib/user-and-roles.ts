import { type People } from './crm';

export type PersonSearchResult = People;

export interface UserRecord {
  id: string;
  person_id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  actions: string[];
  is_system: boolean;
  is_active: boolean;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
}

export interface CreateUserInput {
  personId: string;
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  username: string;
  email: string;
  isActive: boolean;
}

export interface SaveRoleInput {
  name: string;
  description: string;
  actions: string[];
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
}

export const ROLE_PERMISSION_MODULES = [
  'Accounting',
  'Brand',
  'Category',
  'Client',
  'Company',
  'Configuration',
  'Department',
  'Document',
  'Document Type',
  'Inventory',
  'POS',
  'Product',
  'Report',
  'Role',
  'Seller',
  'Tax Manager',
  'User',
] as const;

export const ROLE_PERMISSION_ACTIONS = [
  'READ',
  'INSERT',
  'UPDATE',
  'DELETE',
] as const;

export type RolePermissionModule = (typeof ROLE_PERMISSION_MODULES)[number];
export type RolePermissionAction = (typeof ROLE_PERMISSION_ACTIONS)[number];
export type RolePermissionSelection = Record<
  RolePermissionModule,
  RolePermissionAction[]
>;

const ROLE_MODULE_ALIASES: Record<string, RolePermissionModule> = {
  ACCOUNTING: 'Accounting',
  CONTABILIDAD: 'Accounting',
  CONTADURIA: 'Accounting',
  BRAND: 'Brand',
  BRANDS: 'Brand',
  MARCA: 'Brand',
  MARCAS: 'Brand',
  CATEGORY: 'Category',
  CATEGORIES: 'Category',
  CATEGORIA: 'Category',
  CATEGORIAS: 'Category',
  CLIENT: 'Client',
  CLIENTS: 'Client',
  CUSTOMER: 'Client',
  CUSTOMERS: 'Client',
  CLIENTE: 'Client',
  CLIENTES: 'Client',
  COMPANY: 'Company',
  COMPANIES: 'Company',
  EMPRESA: 'Company',
  EMPRESAS: 'Company',
  CONFIGURATION: 'Configuration',
  CONFIGURACION: 'Configuration',
  DEPARTMENT: 'Department',
  DEPARTMENTS: 'Department',
  DEPARTAMENTO: 'Department',
  DEPARTAMENTOS: 'Department',
  DOCUMENT: 'Document',
  DOCUMENTS: 'Document',
  DOCUMENTO: 'Document',
  DOCUMENTOS: 'Document',
  'DOCUMENT TYPE': 'Document Type',
  'DOCUMENT TYPES': 'Document Type',
  'TIPO DE DOCUMENTO': 'Document Type',
  'TIPOS DE DOCUMENTOS': 'Document Type',
  INVENTORY: 'Inventory',
  INVENTARIO: 'Inventory',
  POS: 'POS',
  PRODUCT: 'Product',
  PRODUCTS: 'Product',
  PRODUCTO: 'Product',
  PRODUCTOS: 'Product',
  REPORT: 'Report',
  REPORTS: 'Report',
  REPORTE: 'Report',
  REPORTES: 'Report',
  ROLE: 'Role',
  ROLES: 'Role',
  SELLER: 'Seller',
  SELLERS: 'Seller',
  SELLERMAN: 'Seller',
  'SELLER MAN': 'Seller',
  VENDEDOR: 'Seller',
  VENDEDORES: 'Seller',
  'TAX MANAGER': 'Tax Manager',
  TAX: 'Tax Manager',
  TAXES: 'Tax Manager',
  IMPUESTOS: 'Tax Manager',
  USER: 'User',
  USERS: 'User',
  USUARIO: 'User',
  USUARIOS: 'User',
};

function normalizeRoleModule(moduleName: string): string {
  return moduleName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export function emptyRolePermissionSelection(): RolePermissionSelection {
  return {
    Accounting: [],
    Brand: [],
    Category: [],
    Client: [],
    Company: [],
    Configuration: [],
    Department: [],
    Document: [],
    'Document Type': [],
    Inventory: [],
    POS: [],
    Product: [],
    Report: [],
    Role: [],
    Seller: [],
    'Tax Manager': [],
    User: [],
  };
}

export function roleActionsToSelection(
  actions: readonly string[],
): RolePermissionSelection {
  const selection = emptyRolePermissionSelection();

  for (const action of actions) {
    const match = /^([^[]+)\[\s*([^\]]+)\s*\]$/.exec(action.trim());
    if (!match) continue;

    const moduleName = ROLE_MODULE_ALIASES[normalizeRoleModule(match[1])];
    if (!moduleName) continue;

    for (const permission of match[2].split(/[|,]/)) {
      const normalized = permission.trim().toUpperCase();
      if (normalized === '*') {
        selection[moduleName] = [...ROLE_PERMISSION_ACTIONS];
        break;
      }
      const permissionAction = ROLE_PERMISSION_ACTIONS.find(
        (candidate) => candidate === normalized,
      );
      if (
        permissionAction &&
        !selection[moduleName].includes(permissionAction)
      ) {
        selection[moduleName].push(permissionAction);
      }
    }
  }

  return selection;
}

export function selectionToRoleActions(
  selection: RolePermissionSelection,
): string[] {
  return ROLE_PERMISSION_MODULES.flatMap((moduleName) => {
    const actions = ROLE_PERMISSION_ACTIONS.filter((action) =>
      selection[moduleName].includes(action),
    );
    return actions.length > 0
      ? [`${moduleName}[${actions.join('|')}]`]
      : [];
  });
}
