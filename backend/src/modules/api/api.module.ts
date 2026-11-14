import { Module } from '@nestjs/common';
import { AccountingModule } from '../accounting/accounting.module';
import { CatalogModule } from '../catalog/catalog.module';
import { DocumentsModule } from '../documents/documents.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrganizationModule } from '../organization/organization.module';
import { PeopleModule } from '../people/people.module';
import { PosModule } from '../pos/pos.module';
import { ReportsModule } from '../reports/reports.module';
import { RolesModule } from '../roles/roles.module';
import { TaxesModule } from '../taxes/taxes.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    OrganizationModule,
    CatalogModule,
    InventoryModule,
    PeopleModule,
    UsersModule,
    RolesModule,
    DocumentsModule,
    TaxesModule,
    AccountingModule,
    PosModule,
    ReportsModule,
  ],
})
export class ApiModule {}
