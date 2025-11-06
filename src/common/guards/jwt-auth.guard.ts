import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../constants';

/**
 * JWT Authentication Guard
 * Validates JWT tokens and attaches user to request
 * Security: Enforces authentication on all routes unless marked @Public()
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles JWT authentication
 * - Open/Closed: Extensible via Passport strategies
 * - Dependency Inversion: Depends on Passport abstraction
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if authentication is required
   * Security: Public routes bypass authentication
   */
  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Validate JWT token
    return super.canActivate(context);
  }

  /**
   * Custom error handling
   * Security: Don't leak sensitive information in error messages
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
