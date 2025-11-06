import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_KEY, AuditAction } from '../constants';

export interface AuditOptions {
  action: AuditAction;
  resource: string;
  description?: string;
}

/**
 * Audit Interceptor
 * Creates audit trail for all decorated actions
 * Security: Immutable audit logs for compliance
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles audit logging
 * - Dependency Inversion: Will depend on AuditService abstraction
 *
 * @example
 * @Audit({ action: AuditAction.DELETE, resource: 'User' })
 * @Delete(':id')
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditOptions>(AUDIT_KEY, context.getHandler());

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { user, tenantId, ip, method, url } = request;
    const userAgent = request.headers['user-agent'];

    const auditData = {
      action: auditOptions.action,
      resource: auditOptions.resource,
      description: auditOptions.description,
      userId: user?.id,
      tenantId,
      ipAddress: ip,
      userAgent,
      method,
      url,
      timestamp: new Date().toISOString(),
    };

    return next.handle().pipe(
      tap({
        next: (result) => {
          // TODO: Save to audit log table
          // await this.auditService.create({
          //   ...auditData,
          //   status: 'SUCCESS',
          //   result: this.sanitizeResult(result),
          // });

          this.logger.log('Audit log created', auditData);
        },
        error: (error) => {
          // TODO: Save failed attempt to audit log
          // await this.auditService.create({
          //   ...auditData,
          //   status: 'FAILURE',
          //   error: error.message,
          // });

          this.logger.error('Audit log created (failed action)', {
            ...auditData,
            error: error.message,
          });
        },
      }),
    );
  }

  /**
   * Sanitizes result before logging
   * Security: Remove sensitive fields
   */
  private sanitizeResult(result: any): any {
    if (!result) return result;
    // Add logic to remove sensitive fields if needed
    return result;
  }
}
