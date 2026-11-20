import type { AddressValues } from '@/config';

export interface WarehouseRecord {
  id: string;
  name: string;
  code: string | null;
  warehouse_type: 'standard' | 'returns' | 'damaged' | 'transit';
  is_active: boolean;
  address: AddressValues;
  address_str: string | null;
  address_fields: string[];
}

export interface SupplierRecord {
  id: string;
  person_id: string;
  supplier_code: string | null;
  is_active: boolean;
}

export interface PersonOption {
  id: string;
  name: string;
}

export interface ProductOption {
  id: string;
  name: string;
  sku: string | null;
}

export function errorMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : 'Ocurrió un error inesperado. Intenta de nuevo.';
}
