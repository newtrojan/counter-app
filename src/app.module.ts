import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClsModule } from 'nestjs-cls';
import { redisStore } from 'cache-manager-redis-yet';
import type { RedisClientOptions } from 'redis';

import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { getTypeOrmConfig } from './config/typeorm.config';

/**
 * App Module
 * Root module of the application
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles module wiring
 * - Dependency Inversion: Depends on ConfigService abstraction
 * - Interface Segregation: Clean module imports
 *
 * Security features:
 * - Environment validation on startup
 * - Rate limiting configured
 * - Request context isolation (CLS)
 * - Database connection pooling
 * - Redis caching
 */
@Module({
  imports: [
    /**
     * Configuration Module
     * Security: Validates environment variables on startup
     */
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      cache: true,
    }),

    /**
     * TypeORM Module
     * Database connection with connection pooling
     * Security: SSL support, connection limits
     */
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
    }),

    /**
     * Cache Module (Redis)
     * Security: TTL enforcement, Redis authentication
     */
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get<string>('redis.host'),
            port: configService.get<number>('redis.port'),
          },
          password: configService.get<string>('redis.password'),
          database: configService.get<number>('redis.db'),
          ttl: configService.get<number>('redis.ttl'),
        }),
      }),
    }),

    /**
     * Rate Limiting Module
     * Security: Prevents brute-force and DDoS attacks
     */
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('throttle.ttl'),
            limit: configService.get<number>('throttle.limit'),
          },
        ],
      }),
    }),

    /**
     * CLS (Continuation Local Storage) Module
     * Security: Request context isolation for multi-tenancy
     * Critical: Prevents tenant context pollution between requests
     */
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req) => {
          // Request ID is set by TenantMiddleware
          // This provides request-scoped storage
        },
      },
    }),

    /**
     * Schedule Module
     * For cron jobs and scheduled tasks
     */
    ScheduleModule.forRoot(),

    /**
     * Event Emitter Module
     * For event-driven architecture
     */
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
    }),

    // Feature Modules (will be created)
    // TenantsModule,
    // UsersModule,
    // AuthModule,
    // RbacModule,
    // AuditModule,
    // HealthModule,
    // PaymentsModule,
    // WebhooksModule,
    // EmailModule,
    // StorageModule,
    // JobsModule,
  ],
  controllers: [],
  providers: [
    // Provide CLS Service globally
    {
      provide: 'CLS_SERVICE',
      useExisting: ClsModule,
    },
  ],
})
export class AppModule {
  constructor(private readonly configService: ConfigService) {
    // Log configuration on startup (non-sensitive values only)
    const env = this.configService.get<string>('app.env');
    const port = this.configService.get<number>('app.port');
    const dbHost = this.configService.get<string>('database.host');
    const redisHost = this.configService.get<string>('redis.host');

    console.log('📋 Configuration loaded:');
    console.log(`  Environment: ${env}`);
    console.log(`  Port: ${port}`);
    console.log(`  Database: ${dbHost}`);
    console.log(`  Redis: ${redisHost}`);
    console.log(`  Multi-tenancy: ${this.configService.get<string>('multiTenancy.mode')}`);
  }
}
