import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants';
import { UserRole } from '../constants';

/**
 * Roles decorator
 * Restricts access to specific roles
 * Security: Must be used with RolesGuard
 *
 * @example
 * @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 * @Delete(':id')
 * async delete(@Param('id') id: string) {}
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
