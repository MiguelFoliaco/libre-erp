import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CrudModule } from '../../common/crud/crud.module';
import { createResourceControllers } from '../../common/crud/resource-crud.controller';
import { CATALOG_RESOURCES } from './resources';

@Module({
  imports: [AuthModule, CrudModule],
  controllers: createResourceControllers(CATALOG_RESOURCES),
})
export class CatalogModule {}
