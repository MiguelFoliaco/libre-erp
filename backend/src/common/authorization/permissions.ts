import { BadRequestException, ForbiddenException } from '@nestjs/common';

export type CrudAction = 'READ' | 'INSERT' | 'UPDATE' | 'DELETE';

const MODULE_ALIASES: Record<string, string> = {
  PRODUCT: 'PRODUCT',
  PRODUCTS: 'PRODUCT',
  PRODUCTO: 'PRODUCT',
  PRODUCTOS: 'PRODUCT',
  BRAND: 'BRAND',
  BRANDS: 'BRAND',
  MARCA: 'BRAND',
  MARCAS: 'BRAND',
  CATEGORY: 'CATEGORY',
  CATEGORIES: 'CATEGORY',
  CATEGORIA: 'CATEGORY',
  CATEGORIAS: 'CATEGORY',
  DEPARTMENT: 'DEPARTMENT',
  DEPARTMENTS: 'DEPARTMENT',
  DEPARTAMENTO: 'DEPARTMENT',
  DEPARTAMENTOS: 'DEPARTMENT',
  SELLER: 'SELLER',
  SELLERS: 'SELLER',
  SELLERMAN: 'SELLER',
  'SELLER MAN': 'SELLER',
  VENDEDOR: 'SELLER',
  VENDEDORES: 'SELLER',
  USER: 'USER',
  USERS: 'USER',
  USUARIO: 'USER',
  USUARIOS: 'USER',
  CLIENT: 'CLIENT',
  CLIENTS: 'CLIENT',
  CUSTOMER: 'CLIENT',
  CUSTOMERS: 'CLIENT',
  CLIENTE: 'CLIENT',
  CLIENTES: 'CLIENT',
  ROLE: 'ROLE',
  ROLES: 'ROLE',
  REPORT: 'REPORT',
  REPORTS: 'REPORT',
  REPORTE: 'REPORT',
  REPORTES: 'REPORT',
  DOCUMENT: 'DOCUMENT',
  DOCUMENTS: 'DOCUMENT',
  DOCUMENTO: 'DOCUMENT',
  DOCUMENTOS: 'DOCUMENT',
  'DOCUMENT TYPE': 'DOCUMENT TYPE',
  'DOCUMENT TYPES': 'DOCUMENT TYPE',
  'TIPO DE DOCUMENTO': 'DOCUMENT TYPE',
  'TIPOS DE DOCUMENTOS': 'DOCUMENT TYPE',
  INVENTORY: 'INVENTORY',
  INVENTARIO: 'INVENTORY',
  ACCOUNTING: 'ACCOUNTING',
  CONTABILIDAD: 'ACCOUNTING',
  CONTADURIA: 'ACCOUNTING',
  'TAX MANAGER': 'TAX MANAGER',
  TAX: 'TAX MANAGER',
  TAXES: 'TAX MANAGER',
  IMPUESTOS: 'TAX MANAGER',
  POS: 'POS',
  COMPANY: 'COMPANY',
  COMPANIES: 'COMPANY',
  EMPRESA: 'COMPANY',
  EMPRESAS: 'COMPANY',
  CONFIGURATION: 'CONFIGURATION',
  CONFIGURACION: 'CONFIGURATION',
  'CUSTOMER TYPE': 'CLIENT',
  'PEOPLE TYPE': 'CLIENT',
};

export function normalizeModule(moduleName: string): string {
  const normalized = moduleName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
  return MODULE_ALIASES[normalized] ?? normalized;
}

export function assertAssignableActions(
  grants: readonly string[],
  requestedActions: unknown,
  isRoot: boolean,
): asserts requestedActions is string[] {
  if (
    !Array.isArray(requestedActions) ||
    !requestedActions.every((action) => typeof action === 'string')
  ) {
    throw new BadRequestException('Role actions must be an array of strings');
  }
  for (const grant of requestedActions) {
    const trimmedGrant = grant.trim();
    if (trimmedGrant === '*') {
      if (isRoot) continue;
      throw new ForbiddenException(
        'Only a super administrator can grant all permissions',
      );
    }

    const match = /^([^[]+)\[\s*([^\]]*)\s*\]$/.exec(trimmedGrant);
    if (!match) {
      throw new BadRequestException(`Invalid role permission: ${grant}`);
    }
    const moduleName = normalizeModule(match[1]);
    const actions = match[2]
      .split(/[|,]/)
      .map((item) => item.trim().toUpperCase());
    if (
      actions.length === 0 ||
      actions.some(
        (action) =>
          action !== '*' &&
          action !== 'READ' &&
          action !== 'INSERT' &&
          action !== 'UPDATE' &&
          action !== 'DELETE',
      )
    ) {
      throw new BadRequestException(`Invalid role permission: ${grant}`);
    }
    const expandedActions: CrudAction[] = actions.includes('*')
      ? ['READ', 'INSERT', 'UPDATE', 'DELETE']
      : (actions as CrudAction[]);
    if (isRoot) continue;
    for (const action of expandedActions) {
      assertPermission(grants, moduleName, action);
    }
  }
}

export function hasPermission(
  grants: readonly string[],
  moduleName: string,
  action: CrudAction,
): boolean {
  const requestedModule = normalizeModule(moduleName);

  return grants.some((grant) => {
    const trimmedGrant = grant.trim();
    if (trimmedGrant === '*') return true;

    const match = /^([^[]+)\[\s*([^\]]*)\s*\]$/.exec(trimmedGrant);
    if (!match || normalizeModule(match[1]) !== requestedModule) return false;

    const grantedActions = match[2]
      .split(/[|,]/)
      .map((item) => item.trim().toUpperCase());
    return grantedActions.includes('*') || grantedActions.includes(action);
  });
}

export function assertPermission(
  grants: readonly string[],
  moduleName: string,
  action: CrudAction,
): void {
  if (!hasPermission(grants, moduleName, action)) {
    throw new ForbiddenException(
      `Missing permission: ${moduleName}[${action}]`,
    );
  }
}
