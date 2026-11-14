import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../auth/auth.guard';
import { AuthGuard } from '../../auth/auth.guard';
import { UsersService } from './users.service';

@Controller('api/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/password')
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() body: { currentPassword?: unknown; newPassword?: unknown },
  ) {
    return this.usersService.changePassword(
      request.userId,
      userId,
      body?.currentPassword,
      body?.newPassword,
    );
  }
}
