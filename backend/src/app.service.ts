import { Injectable } from '@nestjs/common';
import { documentItems } from './database/migrations/schema';

export type DocumentItem = typeof documentItems.$inferSelect;

export type NewDocumentItem = typeof documentItems.$inferInsert;

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
