export const DOCUMENT_RESOURCES = {
  'document-types': { table: 'document_types', module: 'Document Type' },
  'document-type-fields': {
    table: 'document_type_fields',
    module: 'Document Type',
  },
  'document-type-headers': {
    table: 'document_type_headers',
    module: 'Document Type',
  },
  'document-type-footers': {
    table: 'document_type_footers',
    module: 'Document Type',
  },
  'sales-flows': {
    table: 'sales_flows',
    module: 'Document Type',
  },
  'sales-flow-steps': {
    table: 'sales_flow_steps',
    module: 'Document Type',
  },
  'sales-flow-transitions': {
    table: 'sales_flow_transitions',
    module: 'Document Type',
  },
  documents: { table: 'documents', module: 'Document' },
  'document-items': { table: 'document_items', module: 'Document' },
  'document-taxes': { table: 'document_taxes', module: 'Document' },
} as const;
