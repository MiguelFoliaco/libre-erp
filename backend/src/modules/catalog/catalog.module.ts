import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AuthorizationModule } from '../../common/authorization/authorization.module';
import { CrudModule } from '../../common/crud/crud.module';
import { createResourceControllers } from '../../common/crud/resource-crud.controller';
import {
  CatalogLookupController,
  ProductSearchController,
} from './product-search.controller';
import { CatalogLookupService } from './catalog-lookup.service';
import { ProductImportService } from './product-import.service';
import { ProductSearchService } from './product-search.service';
import { CATALOG_RESOURCES } from './resources';

@Module({
  imports: [AuthModule, AuthorizationModule, CrudModule],
  controllers: [
    ProductSearchController,
    CatalogLookupController,
    ...createResourceControllers(CATALOG_RESOURCES),
  ],
  providers: [ProductSearchService, ProductImportService, CatalogLookupService],
})
export class CatalogModule {}
