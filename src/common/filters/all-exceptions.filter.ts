import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * All Exceptions Filter
 * Catches all unhandled exceptions
 * Security: Prevents information leakage via error messages
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles unexpected exceptions
 * - Liskov Substitution: Can replace HttpExceptionFilter
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
      stack = exception.stack;
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
    }

    const error = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      // Security: Don't expose internal error details in production
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message,
      ...(process.env.NODE_ENV !== 'production' && { stack }),
    };

    // Log critical errors
    this.logger.error('Unhandled exception', {
      ...error,
      userId: request['user']?.id,
      tenantId: request['tenantId'],
      originalError: exception,
    });

    response.status(status).json({
      success: false,
      error,
    });
  }
}
