import { Module } from '@nestjs/common';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CrudService } from './crud.service';

@Module({
  imports: [AuthorizationModule],
  providers: [CrudService],
  exports: [CrudService],
})
export class CrudModule {}
