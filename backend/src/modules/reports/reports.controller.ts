import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { AuthGuard } from '../../auth/auth.guard';
import { ReportsService } from './reports.service';

@Controller('api/reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('inventory')
  inventory(@Req() request: AuthenticatedRequest) {
    return this.reportsService.inventory(request.userId);
  }

  @Get('sales')
  sales(
    @Req() request: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.sales(request.userId, from, to);
  }
}
