import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TENANT_KEY } from '../constants';

/**
 * Current Tenant decorator
 * Extracts tenant from request context
 * Security: Tenant is validated by TenantGuard before reaching this point
 *
 * @example
 * @Get('settings')
 * async getSettings(@CurrentTenant() tenant: Tenant) {}
 */
export const CurrentTenant = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request[TENANT_KEY] || request.tenant;

    return data ? tenant?.[data] : tenant;
  },
);
