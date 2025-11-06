import { SetMetadata } from '@nestjs/common';
import { AUDIT_KEY, AuditAction } from '../constants';

export interface AuditOptions {
  action: AuditAction;
  resource: string;
  description?: string;
}

/**
 * Audit decorator
 * Automatically logs actions for compliance
 * Security: Creates immutable audit trail
 *
 * @example
 * @Audit({ action: AuditAction.DELETE, resource: 'User' })
 * @Delete(':id')
 * async delete(@Param('id') id: string) {}
 */
export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);
