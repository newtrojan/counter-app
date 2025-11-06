import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { API_KEY_REQUIRED, API_KEY_HEADER } from '../constants';

/**
 * API Key Guard
 * Validates API keys for server-to-server communication
 * Security: Protects webhook and internal endpoints
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles API key validation
 * - Dependency Inversion: Depends on ConfigService abstraction
 *
 * Security features:
 * - Constant-time comparison to prevent timing attacks
 * - Logs failed authentication attempts
 * - Supports multiple API keys (future enhancement)
 *
 * @example
 * @ApiKeyRequired()
 * @Post('webhook')
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  private readonly internalApiKey: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.internalApiKey = this.configService.get<string>('apiKeys.internal', '');
  }

  canActivate(context: ExecutionContext): boolean {
    const apiKeyRequired = this.reflector.getAllAndOverride<boolean>(API_KEY_REQUIRED, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!apiKeyRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers[API_KEY_HEADER.toLowerCase()] as string;

    if (!apiKey) {
      this.logger.warn('API key missing', {
        path: request.path,
        ip: request.ip,
      });
      throw new UnauthorizedException('API key is required');
    }

    // Security: Use constant-time comparison to prevent timing attacks
    const isValid = this.secureCompare(apiKey, this.internalApiKey);

    if (!isValid) {
      this.logger.warn('Invalid API key', {
        path: request.path,
        ip: request.ip,
        providedKey: apiKey.substring(0, 8) + '...', // Log partial key only
      });
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  /**
   * Constant-time string comparison
   * Security: Prevents timing attacks by comparing every character
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
