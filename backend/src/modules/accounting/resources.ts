export const ACCOUNTING_RESOURCES = {
  accounts: { table: 'accounts', module: 'Accounting' },
  'fiscal-periods': { table: 'fiscal_periods', module: 'Accounting' },
  'journal-entries': { table: 'journal_entries', module: 'Accounting' },
  'journal-entry-lines': {
    table: 'journal_entry_lines',
    module: 'Accounting',
  },
} as const;
