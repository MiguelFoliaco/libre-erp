import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { AuthGuard } from '../../auth/auth.guard';
import { PeopleSearchService } from './people-search.service';

@Controller('api/people')
@UseGuards(AuthGuard)
export class PeopleSearchController {
  constructor(private readonly peopleSearchService: PeopleSearchService) {}

  @Get('search')
  search(
    @Req() request: AuthenticatedRequest,
    @Query('query') query: string,
  ) {
    return this.peopleSearchService.search(request.userId, query);
  }
}
