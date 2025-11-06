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
 * HTTP Exception Filter
 * Handles all HTTP exceptions and returns consistent error format
 * Security: Sanitizes error messages in production
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles HTTP exception formatting
 * - Open/Closed: Can be extended for custom exception types
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const error = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.extractMessage(exceptionResponse),
      ...(process.env.NODE_ENV !== 'production' && {
        stack: exception.stack,
      }),
    };

    // Log error
    if (status >= 500) {
      this.logger.error('Server error', {
        ...error,
        userId: request['user']?.id,
        tenantId: request['tenantId'],
      });
    } else {
      this.logger.warn('Client error', {
        ...error,
        userId: request['user']?.id,
        tenantId: request['tenantId'],
      });
    }

    response.status(status).json({
      success: false,
      error,
    });
  }

  /**
   * Extract error message from exception response
   */
  private extractMessage(exceptionResponse: string | object): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      return (exceptionResponse as any).message;
    }

    return 'An error occurred';
  }
}
