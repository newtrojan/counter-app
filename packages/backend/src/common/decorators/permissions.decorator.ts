import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../constants';
import { Permission } from '../constants';

/**
 * Permissions decorator
 * Fine-grained access control using CASL
 * Security: Must be used with PermissionsGuard
 *
 * @example
 * @Permissions(Permission.USERS_DELETE)
 * @Delete(':id')
 * async delete(@Param('id') id: string) {}
 */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
