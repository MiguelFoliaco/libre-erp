import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CrudModule } from '../../common/crud/crud.module';
import { createResourceControllers } from '../../common/crud/resource-crud.controller';
import { POS_RESOURCES } from './resources';

@Module({
  imports: [AuthModule, CrudModule],
  controllers: createResourceControllers(POS_RESOURCES),
})
export class PosModule {}
