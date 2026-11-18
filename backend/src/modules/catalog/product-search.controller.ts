import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { AuthGuard } from '../../auth/auth.guard';
import { CatalogLookupService } from './catalog-lookup.service';
import { ProductImportService } from './product-import.service';
import { ProductSearchService } from './product-search.service';

@Controller('api/products')
@UseGuards(AuthGuard)
export class ProductSearchController {
  constructor(
    private readonly productSearchService: ProductSearchService,
    private readonly productImportService: ProductImportService,
  ) {}

  @Get('search')
  search(
    @Req() request: AuthenticatedRequest,
    @Query() filters: Record<string, unknown>,
  ) {
    return this.productSearchService.search(request.userId, filters);
  }

  @Post('import')
  import(@Req() request: AuthenticatedRequest, @Body() input: unknown) {
    return this.productImportService.import(request.userId, input);
  }
}

@Controller('api/catalogs')
@UseGuards(AuthGuard)
export class CatalogLookupController {
  constructor(private readonly catalogLookupService: CatalogLookupService) {}

  @Get(':resource/search')
  search(
    @Req() request: AuthenticatedRequest,
    @Param('resource') resource: string,
    @Query('query') query: unknown,
  ) {
    return this.catalogLookupService.search(request.userId, resource, query);
  }
}
