import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { AuthorizationModule } from '../../common/authorization/authorization.module';
import { CrudModule } from '../../common/crud/crud.module';
import { createResourceControllers } from '../../common/crud/resource-crud.controller';
import { PEOPLE_RESOURCES } from './resources';
import { PeopleSearchController } from './people-search.controller';
import { PeopleSearchService } from './people-search.service';

@Module({
  imports: [AuthModule, AuthorizationModule, CrudModule],
  controllers: [
    PeopleSearchController,
    ...createResourceControllers(PEOPLE_RESOURCES),
  ],
  providers: [PeopleSearchService],
})
export class PeopleModule {}
