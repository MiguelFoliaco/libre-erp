import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { CrudModule } from '../../common/crud/crud.module';
import { createResourceControllers } from '../../common/crud/resource-crud.controller';
import { UsersController } from './users.controller';
import { USER_RESOURCES } from './resources';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule, CrudModule],
  controllers: [...createResourceControllers(USER_RESOURCES), UsersController],
  providers: [UsersService],
})
export class UsersModule {}
