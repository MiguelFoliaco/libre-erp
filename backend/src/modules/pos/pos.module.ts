import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CrudModule } from '../../common/crud/crud.module';
import { createResourceControllers } from '../../common/crud/resource-crud.controller';
import { POS_RESOURCES } from './resources';
import { POSController } from './pos.controller';
import { PosServices } from './pos.service';
import { AuthorizationModule } from '@/common/authorization/authorization.module';

@Module({
  imports: [AuthModule, AuthorizationModule, CrudModule],
  controllers: [
    POSController,
    ...createResourceControllers(POS_RESOURCES),
  ],
  providers: [PosServices]
})
export class PosModule { }
