import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Logging Interceptor
 * Logs all HTTP requests and responses
 * Security: Sanitizes sensitive data before logging
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles logging
 * - Open/Closed: Extensible for custom logging logic
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers, ip } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id || 'anonymous';
    const tenantId = request.tenantId || 'N/A';
    const startTime = Date.now();

    // Log request
    this.logger.log({
      type: 'request',
      method,
      url,
      userId,
      tenantId,
      ip,
      userAgent,
      // Security: Don't log sensitive fields
      body: this.sanitizeBody(body),
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          const response = context.switchToHttp().getResponse();

          this.logger.log({
            type: 'response',
            method,
            url,
            statusCode: response.statusCode,
            responseTime,
            userId,
            tenantId,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;

          this.logger.error({
            type: 'error',
            method,
            url,
            error: error.message,
            stack: error.stack,
            responseTime,
            userId,
            tenantId,
          });
        },
      }),
    );
  }

  /**
   * Sanitizes request body
   * Security: Removes sensitive fields from logs
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'passwordConfirm',
      'token',
      'refreshToken',
      'apiKey',
      'secret',
      'creditCard',
      'ssn',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
