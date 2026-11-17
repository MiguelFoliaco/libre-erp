import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { AuthGuard } from '../../auth/auth.guard';
import { CustomerSearchService } from './customer-search.service';

@Controller('api/customers')
@UseGuards(AuthGuard)
export class CustomerSearchController {
  constructor(private readonly customerSearchService: CustomerSearchService) {}

  @Get('search')
  search(
    @Req() request: AuthenticatedRequest,
    @Query('query') query?: string,
  ) {
    return this.customerSearchService.search(request.userId, query);
  }
}
