import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { AuthGuard } from '../../auth/auth.guard';
import { InventoryOperationsService } from './inventory-operations.service';

@Controller('api/inventory')
@UseGuards(AuthGuard)
export class InventoryOperationsController {
  constructor(
    private readonly inventoryOperationsService: InventoryOperationsService,
  ) {}

  @Get('stock')
  stock(
    @Req() request: AuthenticatedRequest,
    @Query() filters: Record<string, unknown>,
  ) {
    return this.inventoryOperationsService.listStock(request.userId, {
      warehouseId: filters.warehouseId ?? filters.warehouse_id,
      query: filters.query,
    });
  }

  @Get('operations')
  operations(@Req() request: AuthenticatedRequest) {
    return this.inventoryOperationsService.listMovements(request.userId);
  }

  @Get('products')
  products(@Req() request: AuthenticatedRequest) {
    return this.inventoryOperationsService.listProducts(request.userId);
  }

  @Get('people')
  people(@Req() request: AuthenticatedRequest) {
    return this.inventoryOperationsService.listPeople(request.userId);
  }

  @Get('suppliers')
  suppliers(@Req() request: AuthenticatedRequest) {
    return this.inventoryOperationsService.listSuppliers(request.userId);
  }

  @Get('suppliers/search')
  searchSuppliers(
    @Req() request: AuthenticatedRequest,
    @Query('query') query: unknown,
  ) {
    return this.inventoryOperationsService.searchSuppliers(
      request.userId,
      query,
    );
  }

  @Post('operations')
  createMovement(
    @Req() request: AuthenticatedRequest,
    @Body() input: unknown,
  ) {
    return this.inventoryOperationsService.createMovement(
      request.userId,
      input,
    );
  }

  @Post('transfers')
  createTransfer(
    @Req() request: AuthenticatedRequest,
    @Body() input: unknown,
  ) {
    return this.inventoryOperationsService.createTransfer(
      request.userId,
      input,
    );
  }
}
