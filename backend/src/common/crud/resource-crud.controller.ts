import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Type,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { AuthGuard } from '../../auth/auth.guard';
import { CrudService } from './crud.service';
import { ApiResource, ApiResourceName } from './resources';

abstract class ResourceCrudController {
  protected abstract readonly resourceName: ApiResourceName;

  constructor(protected readonly crudService: CrudService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.crudService.list(
      request.userId,
      this.resourceName,
      limit,
      offset,
    );
  }

  @Get(':id')
  get(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.crudService.get(request.userId, this.resourceName, id);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.crudService.create(request.userId, this.resourceName, body);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.crudService.update(request.userId, this.resourceName, id, body);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.crudService.remove(request.userId, this.resourceName, id);
  }
}

export function createResourceControllers(
  resources: Partial<Record<ApiResourceName, ApiResource>>,
): Type<unknown>[] {
  return (Object.keys(resources) as ApiResourceName[]).map((resourceName) => {
    @Controller(`api/${resourceName}`)
    @UseGuards(AuthGuard)
    class GeneratedResourceController extends ResourceCrudController {
      protected readonly resourceName = resourceName;

      constructor(@Inject(CrudService) crudService: CrudService) {
        super(crudService);
      }
    }

    Object.defineProperty(GeneratedResourceController, 'name', {
      value: `${resourceName}Controller`,
    });
    return GeneratedResourceController;
  });
}
