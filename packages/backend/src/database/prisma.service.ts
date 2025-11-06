import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { TENANT_ID_KEY } from '../common/constants/keys';

/**
 * PrismaService - Prisma Client Service with Multi-tenancy Support
 *
 * Features:
 * - Automatic connection management (connect on init, disconnect on destroy)
 * - Query logging in development
 * - Tenant-scoped queries using Prisma middleware
 * - Integration with CLS for request context
 *
 * @example
 * ```typescript
 * constructor(private readonly prisma: PrismaService) {}
 *
 * async findUser(email: string) {
 *   return this.prisma.user.findUnique({ where: { email } });
 * }
 * ```
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly cls: ClsService) {
    super({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
      errorFormat: 'pretty',
    });

    // Middleware for automatic tenant isolation
    this.$use(async (params, next) => {
      // Skip tenant filtering for certain models that are not tenant-scoped
      const nonTenantModels = ['Tenant'];

      if (nonTenantModels.includes(params.model)) {
        return next(params);
      }

      // Get tenantId from CLS context
      const tenantId = this.cls.get(TENANT_ID_KEY);

      // Only apply tenant filtering if tenantId exists in context
      if (tenantId) {
        // Models that have tenantId field
        const tenantScopedModels = [
          'User', 'Role', 'Permission', 'UserRole', 'RolePermission',
          'ApiKey', 'AuditLog', 'Subscription', 'Invitation', 'Webhook', 'WebhookDelivery'
        ];

        if (tenantScopedModels.includes(params.model)) {
          // Add tenantId filter to queries
          if (params.action === 'findUnique' || params.action === 'findFirst') {
            params.args.where = { ...params.args.where, tenantId };
          } else if (params.action === 'findMany') {
            params.args.where = { ...params.args.where, tenantId };
          } else if (params.action === 'count') {
            params.args.where = { ...params.args.where, tenantId };
          } else if (params.action === 'aggregate') {
            params.args.where = { ...params.args.where, tenantId };
          } else if (params.action === 'update' || params.action === 'updateMany') {
            params.args.where = { ...params.args.where, tenantId };
          } else if (params.action === 'delete' || params.action === 'deleteMany') {
            params.args.where = { ...params.args.where, tenantId };
          } else if (params.action === 'create') {
            // Auto-inject tenantId on create
            params.args.data = { ...params.args.data, tenantId };
          } else if (params.action === 'upsert') {
            params.args.where = { ...params.args.where, tenantId };
            params.args.create = { ...params.args.create, tenantId };
          }
        }
      }

      return next(params);
    });

    // Middleware for audit logging
    this.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();

      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(
          `Query ${params.model}.${params.action} took ${after - before}ms`,
        );
      }

      return result;
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }

  /**
   * Enable soft deletes for a model
   * Automatically filters out soft-deleted records
   */
  enableSoftDelete() {
    this.$use(async (params, next) => {
      // Check incoming query type
      if (params.action === 'delete') {
        // Change action to update
        params.action = 'update';
        params.args.data = { deletedAt: new Date() };
      }
      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data !== undefined) {
          params.args.data.deletedAt = new Date();
        } else {
          params.args.data = { deletedAt: new Date() };
        }
      }

      return next(params);
    });

    this.$use(async (params, next) => {
      // Filter out soft-deleted records
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.action = 'findFirst';
        params.args.where.deletedAt = null;
      }
      if (params.action === 'findMany') {
        if (params.args.where) {
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        } else {
          params.args.where = { deletedAt: null };
        }
      }

      return next(params);
    });
  }

  /**
   * Execute a query without tenant isolation
   * Use with caution - only for admin/system operations
   *
   * @example
   * ```typescript
   * await this.prisma.withoutTenantScope(() => {
   *   return this.prisma.user.findMany();
   * });
   * ```
   */
  async withoutTenantScope<T>(callback: () => Promise<T>): Promise<T> {
    // Temporarily clear tenant ID from context
    const originalTenantId = this.cls.get(TENANT_ID_KEY);
    this.cls.set(TENANT_ID_KEY, undefined);

    try {
      return await callback();
    } finally {
      // Restore original tenant ID
      this.cls.set(TENANT_ID_KEY, originalTenantId);
    }
  }
}
