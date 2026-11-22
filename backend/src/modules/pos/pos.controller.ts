import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthenticatedRequest } from '@/auth/auth.guard';
import { PosServices } from './pos.service';


@Controller('api/pos')
@UseGuards(AuthGuard)
export class POSController {

    constructor(private service: PosServices) { }

    @Get('search')
    search(
        @Req() req: AuthenticatedRequest,
        @Query('query') query: string,
            @Query('limit') limit: number,
            @Query('offset') offset: number,
    ) {

        return this.service.list(req.userId, query ?? '', limit ?? 50, offset ?? 0)
    }

}