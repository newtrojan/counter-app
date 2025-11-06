import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule - Global module providing Prisma Client
 *
 * This module is marked as @Global(), so PrismaService can be injected
 * anywhere in the application without importing this module in each module.
 *
 * Features:
 * - Global availability of PrismaService
 * - Automatic connection management
 * - Multi-tenancy support via middleware
 * - Soft delete support
 *
 * @example
 * ```typescript
 * // In any service
 * constructor(private readonly prisma: PrismaService) {}
 * ```
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
