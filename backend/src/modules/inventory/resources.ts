export const INVENTORY_RESOURCES = {
  branches: { table: 'branches', module: 'Inventory' },
  warehouses: { table: 'warehouses', module: 'Inventory' },
  inventory: { table: 'inventory', module: 'Inventory' },
  'inventory-movements': {
    table: 'inventory_movements',
    module: 'Inventory',
  },
  transfers: { table: 'transfers', module: 'Inventory' },
  'transfer-items': { table: 'transfer_items', module: 'Inventory' },
} as const;
