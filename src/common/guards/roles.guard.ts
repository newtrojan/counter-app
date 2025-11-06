import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserRole } from '../constants';

/**
 * Roles Guard
 * Enforces role-based access control
 * Security: Validates user has required roles
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles role validation
 * - Open/Closed: Extensible for custom role logic
 *
 * @example
 * @Roles(UserRole.ADMIN)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Security: User must be authenticated
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Security: Check if user has any of the required roles
    const hasRole = this.matchRoles(requiredRoles, user.roles);

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Matches user roles against required roles
   * Security: SuperAdmin bypasses role checks
   */
  private matchRoles(requiredRoles: UserRole[], userRoles: string[]): boolean {
    if (!userRoles || userRoles.length === 0) {
      return false;
    }

    // Security: SuperAdmin has access to everything
    if (userRoles.includes(UserRole.SUPER_ADMIN)) {
      return true;
    }

    // Check if user has any of the required roles
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
