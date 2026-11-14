import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AuthorizationModule } from '../../common/authorization/authorization.module';
import { CrudModule } from '../../common/crud/crud.module';
import { createResourceControllers } from '../../common/crud/resource-crud.controller';
import { ReportsController } from './reports.controller';
import { REPORT_RESOURCES } from './resources';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, AuthorizationModule, CrudModule],
  controllers: [
    ...createResourceControllers(REPORT_RESOURCES),
    ReportsController,
  ],
  providers: [ReportsService],
})
export class ReportsModule {}
