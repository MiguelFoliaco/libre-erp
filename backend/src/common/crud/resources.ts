import { ACCOUNTING_RESOURCES } from '../../modules/accounting/resources';
import { CATALOG_RESOURCES } from '../../modules/catalog/resources';
import { DOCUMENT_RESOURCES } from '../../modules/documents/resources';
import { INVENTORY_RESOURCES } from '../../modules/inventory/resources';
import { ORGANIZATION_RESOURCES } from '../../modules/organization/resources';
import { PEOPLE_RESOURCES } from '../../modules/people/resources';
import { POS_RESOURCES } from '../../modules/pos/resources';
import { REPORT_RESOURCES } from '../../modules/reports/resources';
import { ROLE_RESOURCES } from '../../modules/roles/resources';
import { TAX_RESOURCES } from '../../modules/taxes/resources';
import { USER_RESOURCES } from '../../modules/users/resources';

export interface ApiResource {
  table: string;
  module: string;
  readOnly?: boolean;
}

export const API_RESOURCES = {
  ...ORGANIZATION_RESOURCES,
  ...CATALOG_RESOURCES,
  ...INVENTORY_RESOURCES,
  ...PEOPLE_RESOURCES,
  ...USER_RESOURCES,
  ...ROLE_RESOURCES,
  ...DOCUMENT_RESOURCES,
  ...TAX_RESOURCES,
  ...ACCOUNTING_RESOURCES,
  ...POS_RESOURCES,
  ...REPORT_RESOURCES,
} as const satisfies Record<string, ApiResource>;

export type ApiResourceName = keyof typeof API_RESOURCES;
