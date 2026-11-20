import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AuthorizationModule } from '../../common/authorization/authorization.module';
import { CrudModule } from '../../common/crud/crud.module';
import { createResourceControllers } from '../../common/crud/resource-crud.controller';
import { INVENTORY_RESOURCES } from './resources';
import { InventoryOperationsController } from './inventory-operations.controller';
import { InventoryOperationsService } from './inventory-operations.service';

@Module({
  imports: [AuthModule, AuthorizationModule, CrudModule],
  controllers: [
    InventoryOperationsController,
    ...createResourceControllers(INVENTORY_RESOURCES),
  ],
  providers: [InventoryOperationsService],
})
export class InventoryModule {}
