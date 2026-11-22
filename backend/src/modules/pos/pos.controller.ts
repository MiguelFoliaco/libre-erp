import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
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

    @Get('status')
    status(@Req() req: AuthenticatedRequest) {
        return this.service.status(req.userId);
    }

    @Get('registers')
    registers(@Req() req: AuthenticatedRequest) {
        return this.service.listRegisters(req.userId);
    }

    @Get('sessions/active')
    activeSession(@Req() req: AuthenticatedRequest) {
        return this.service.activeSession(req.userId);
    }

    @Post('sessions/open')
    openSession(
        @Req() req: AuthenticatedRequest,
        @Body() input: unknown,
    ) {
        return this.service.openSession(req.userId, input);
    }

    @Post('sessions/:id/close')
    closeSession(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() input: unknown,
    ) {
        return this.service.closeSession(req.userId, id, input);
    }

    @Get('products/search')
    searchProducts(
        @Req() req: AuthenticatedRequest,
        @Query('cashRegisterId') cashRegisterId: string,
        @Query('query') query: string,
    ) {
        return this.service.searchProducts(req.userId, cashRegisterId, query);
    }

    @Get('payment-methods')
    paymentMethods(@Req() req: AuthenticatedRequest) {
        return this.service.paymentMethods(req.userId);
    }

    @Post('checkout')
    checkout(
        @Req() req: AuthenticatedRequest,
        @Body() input: unknown,
    ) {
        return this.service.checkout(req.userId, input);
    }

}