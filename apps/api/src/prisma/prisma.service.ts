import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SCHEMA_PATCHES } from './schema-patches';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    await this.applySchemaPatches();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async applySchemaPatches() {
    for (const sql of SCHEMA_PATCHES) {
      try {
        await this.$executeRawUnsafe(sql);
      } catch (error) {
        this.logger.warn(`Schema patch skipped: ${sql.slice(0, 80)}…`);
        this.logger.warn(error);
      }
    }
    this.logger.log('Database schema patches applied');
  }
}
