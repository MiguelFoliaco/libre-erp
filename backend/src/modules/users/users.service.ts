import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Pool } from 'pg';
import { hashPassword, verifyPassword } from '../../auth/password';
import { PG_POOL } from '../../database/database.module';

@Injectable()
export class UsersService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async changePassword(
    userId: string,
    targetUserId: string,
    currentPassword: unknown,
    newPassword: unknown,
  ): Promise<{ success: true }> {
    if (targetUserId !== userId) {
      throw new ForbiddenException('You can only change your own password');
    }
    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      newPassword.length < 12 ||
      newPassword.length > 1024
    ) {
      throw new BadRequestException(
        'Current password and a new password of at least 12 characters are required',
      );
    }

    const user = await this.pool.query<{ password_hash: string | null }>(
      `SELECT password_hash FROM users WHERE id = $1 AND is_active = TRUE`,
      [userId],
    );
    const passwordHash = user.rows[0]?.password_hash;
    if (
      !passwordHash ||
      !(await verifyPassword(currentPassword, passwordHash))
    ) {
      throw new ForbiddenException('Current password is incorrect');
    }

    await this.pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2 AND is_active = TRUE`,
      [await hashPassword(newPassword), userId],
    );
    await this.pool.query(
      `UPDATE session
       SET active = FALSE, updated_at = NOW()
       WHERE user_id = $1 AND active = TRUE`,
      [userId],
    );
    return { success: true };
  }
}
