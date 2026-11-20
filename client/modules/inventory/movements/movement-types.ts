import type { InventoryMovementInput } from '@/lib/sdk';

export type OperationKind = InventoryMovementInput['movementType'] | 'transfer';
export type EntrySource = 'supplier' | 'return';