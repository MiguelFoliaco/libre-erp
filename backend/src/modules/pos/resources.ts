export const POS_RESOURCES = {
  'cash-registers': { table: 'cash_registers', module: 'POS' },
  'cash-sessions': { table: 'cash_sessions', module: 'POS' },
  'payment-methods': { table: 'payment_methods', module: 'POS' },
  sales: { table: 'sales', module: 'POS' },
  'sale-items': { table: 'sale_items', module: 'POS' },
  'sale-item-taxes': { table: 'sale_item_taxes', module: 'POS' },
  'sale-payments': { table: 'sale_payments', module: 'POS' },
  'cash-movements': { table: 'cash_movements', module: 'POS' },
  'sale-returns': { table: 'sale_returns', module: 'POS' },
  'sale-return-items': { table: 'sale_return_items', module: 'POS' },
} as const;
