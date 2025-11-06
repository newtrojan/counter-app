import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Transform Interceptor
 * Standardizes API responses
 * Security: Ensures consistent response structure
 *
 * Response format:
 * {
 *   success: true,
 *   data: {...},
 *   meta: { timestamp, version }
 * }
 */
export interface Response<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const apiVersion = process.env.API_VERSION || 'v1';

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          version: apiVersion,
        },
      })),
    );
  }
}
