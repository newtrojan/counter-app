import { Injectable, NestMiddleware, Logger, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';
import { JwtService } from '@nestjs/jwt';
import { TENANT_ID_KEY, TENANT_HEADER, REQUEST_ID_KEY } from '../constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tenant Middleware
 * Extracts tenant context from request and stores in CLS (Continuation Local Storage)
 * Security: Critical for multi-tenancy isolation
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles tenant context extraction
 * - Dependency Inversion: Depends on ClsService and JwtService abstractions
 *
 * Extraction Priority:
 * 1. JWT token (decoded tenantId claim) - Primary for authenticated users
 * 2. Custom header (X-Tenant-ID) - For API keys and webhooks
 * 3. Public routes (extracted from URL slug) - For customer-facing pages
 *
 * Security features:
 * - Request ID generation for tracing
 * - Tenant context isolation using CLS
 * - Prevents tenant context pollution between requests
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    private readonly cls: ClsService,
    private readonly jwtService: JwtService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Generate request ID for tracing
    const requestId = uuidv4();
    this.cls.set(REQUEST_ID_KEY, requestId);
    req['requestId'] = requestId;

    let tenantId: string | null = null;

    try {
      // Priority 1: Extract from JWT token (most common for authenticated requests)
      tenantId = this.extractFromJWT(req);

      // Priority 2: Extract from header (for API keys, webhooks, server-to-server)
      if (!tenantId) {
        tenantId = this.extractFromHeader(req);
      }

      // Priority 3: Extract from URL slug (for public routes)
      if (!tenantId) {
        tenantId = this.extractFromSlug(req);
      }

      // Store tenant context in CLS for this request
      if (tenantId) {
        this.cls.set(TENANT_ID_KEY, tenantId);
        req['tenantId'] = tenantId;

        this.logger.debug('Tenant context set', {
          requestId,
          tenantId,
          path: req.path,
        });
      }
    } catch (error) {
      this.logger.error('Failed to extract tenant context', {
        error: error.message,
        path: req.path,
      });
    }

    next();
  }

  /**
   * Extract tenant from JWT token
   * Security: Token validation handled by JwtStrategy
   */
  private extractFromJWT(req: Request): string | null {
    try {
      const token = this.extractTokenFromHeader(req);
      if (!token) {
        return null;
      }

      // Decode without verifying (verification happens in JwtStrategy)
      const decoded = this.jwtService.decode(token) as any;
      return decoded?.tenantId || null;
    } catch (error) {
      // Token decoding failed, but don't throw - let AuthGuard handle it
      return null;
    }
  }

  /**
   * Extract tenant from custom header
   * Security: Requires API key validation (handled by ApiKeyGuard)
   */
  private extractFromHeader(req: Request): string | null {
    return (req.headers[TENANT_HEADER.toLowerCase()] as string) || null;
  }

  /**
   * Extract tenant from URL slug
   * Used for public booking pages: /book/{tenant-slug}
   */
  private extractFromSlug(req: Request): string | null {
    // Example: /public/book/acme-company
    const slugMatch = req.path.match(/\/public\/book\/([a-z0-9-]+)/i);
    if (slugMatch) {
      // TODO: Lookup tenant by slug
      // const tenant = await this.tenantService.findBySlug(slugMatch[1]);
      // return tenant?.id;
      return null; // Placeholder until TenantService is implemented
    }
    return null;
  }

  /**
   * Extract Bearer token from Authorization header
   */
  private extractTokenFromHeader(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
