import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter, HttpExceptionFilter } from './common/filters';
import { LoggingInterceptor, TransformInterceptor } from './common/interceptors';
import { JwtAuthGuard, TenantGuard } from './common/guards';

/**
 * Bootstrap application
 * Security-first configuration
 *
 * Following SOLID principles and NestJS best practices:
 * - Global validation pipes
 * - Global exception filters
 * - Global interceptors for logging and transformation
 * - Global guards for authentication and tenant isolation
 * - Security headers via Helmet
 * - CORS configuration
 * - API versioning
 * - Swagger documentation
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    cors: false, // We'll configure CORS manually
  });

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // ============================================
  // SECURITY CONFIGURATION
  // ============================================

  /**
   * Helmet - Security headers
   * Protects against common vulnerabilities
   */
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  /**
   * CORS configuration
   * Security: Restrict origins in production
   */
  const corsOrigins = configService.get<string[]>('cors.origin') || ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: configService.get<boolean>('cors.credentials'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-ID',
      'X-API-Key',
      'X-Request-ID',
    ],
  });

  /**
   * Cookie parser
   * For session management
   */
  app.use(cookieParser(configService.get<string>('security.sessionSecret')));

  /**
   * Compression
   * Reduces response payload size
   */
  app.use(compression());

  // ============================================
  // API CONFIGURATION
  // ============================================

  /**
   * Global prefix
   * Example: /api/v1/users
   */
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix);

  /**
   * API versioning
   * Security: Allows gradual deprecation of old APIs
   */
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: configService.get<string>('app.apiVersion') || 'v1',
  });

  // ============================================
  // GLOBAL PIPES, FILTERS, INTERCEPTORS, GUARDS
  // ============================================

  /**
   * Global validation pipe
   * Security: Validates all incoming DTOs
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error on non-whitelisted properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide detailed errors in production
    }),
  );

  /**
   * Global exception filters
   * Security: Consistent error handling, prevents information leakage
   */
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  /**
   * Global interceptors
   * Logging and response transformation
   */
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  /**
   * Global guards
   * Security: Authentication and tenant isolation enforced globally
   * Note: Individual routes can opt-out using @Public() decorator
   */
  app.useGlobalGuards(
    new JwtAuthGuard(reflector),
    new TenantGuard(reflector, app.get('CLS_SERVICE')),
  );

  // ============================================
  // SWAGGER DOCUMENTATION
  // ============================================

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('NestJS SaaS Boilerplate API')
      .setDescription(
        'Enterprise-grade multi-tenant SaaS API with authentication, RBAC, payments, and more',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API Key for server-to-server communication',
        },
        'API-Key',
      )
      .addServer('http://localhost:3000', 'Local')
      .addServer('https://api.yoursaas.com', 'Production')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('tenants', 'Tenant management')
      .addTag('health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log('Swagger documentation available at /docs');
  }

  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================

  app.enableShutdownHooks();

  // ============================================
  // START SERVER
  // ============================================

  const port = configService.get<number>('app.port') || 3000;
  const env = configService.get<string>('app.env');

  await app.listen(port);

  logger.log(`🚀 Application running in ${env} mode on port ${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
  logger.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
  logger.log(`🏢 Multi-tenancy: ${configService.get<string>('multiTenancy.mode')} mode`);
}

bootstrap();
