import type { AddressValues } from '@/config';


export type CashRegisters = {
    id: string;
    company_id: string;
    environment_id: string;
    branch_id: string;
    warehouse_id: string;

    name: string;
    code: string;

    is_active: boolean;
    warehouse_name: string;
    branch_name: string;
    branch_address: AddressValues
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export type CashRegistersInputCreate = Omit<CashRegisters, 'id' | 'created_at' | 'updated_at'>;
export type CashRegistersInputUpdate = Partial<Omit<CashRegisters, 'created_at'>> & { id: string };