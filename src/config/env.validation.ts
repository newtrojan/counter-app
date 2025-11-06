import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsUrl,
  Min,
  Max,
  validateSync,
} from 'class-validator';

/**
 * Environment configuration validation
 * Ensures all required environment variables are present and valid
 * Following SOLID principles: Single Responsibility
 */

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
}

export class EnvironmentVariables {
  // Application
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1024)
  @Max(65535)
  PORT: number = 3000;

  @IsUrl({ require_tld: false })
  APP_URL: string;

  @IsString()
  API_VERSION: string = 'v1';

  @IsString()
  API_PREFIX: string = 'api';

  // Multi-tenancy
  @IsString()
  MULTI_TENANCY_MODE: string = 'token';

  @IsString()
  TENANT_HEADER_NAME: string = 'X-Tenant-ID';

  @IsBoolean()
  ALLOW_CROSS_TENANT_ACCESS: boolean = false;

  // Database
  @IsString()
  DATABASE_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  DATABASE_PORT: number;

  @IsString()
  DATABASE_USERNAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsBoolean()
  DATABASE_LOGGING: boolean = false;

  @IsBoolean()
  DATABASE_SYNCHRONIZE: boolean = false;

  @IsBoolean()
  DATABASE_SSL: boolean = false;

  // Redis
  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @Min(0)
  @Max(15)
  REDIS_DB: number = 0;

  @IsNumber()
  @Min(60)
  REDIS_TTL: number = 3600;

  // JWT
  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string = '15m';

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  JWT_ISSUER: string = 'nestjs-saas-api';

  @IsString()
  JWT_AUDIENCE: string = 'nestjs-saas-client';

  // OAuth - Google
  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  GOOGLE_CALLBACK_URL?: string;

  // OAuth - GitHub
  @IsString()
  @IsOptional()
  GITHUB_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GITHUB_CLIENT_SECRET?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  GITHUB_CALLBACK_URL?: string;

  // Stripe
  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_PUBLISHABLE_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;

  // Email
  @IsString()
  @IsOptional()
  MAIL_HOST?: string;

  @IsNumber()
  @IsOptional()
  MAIL_PORT?: number;

  @IsString()
  @IsOptional()
  MAIL_USER?: string;

  @IsString()
  @IsOptional()
  MAIL_PASSWORD?: string;

  @IsString()
  @IsOptional()
  MAIL_FROM?: string;

  @IsString()
  @IsOptional()
  MAIL_FROM_NAME?: string;

  // AWS S3
  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  AWS_S3_REGION?: string;

  @IsString()
  @IsOptional()
  AWS_S3_BUCKET?: string;

  @IsString()
  @IsOptional()
  AWS_S3_ENDPOINT?: string;

  @IsBoolean()
  @IsOptional()
  AWS_S3_FORCE_PATH_STYLE?: boolean;

  // OpenTelemetry
  @IsBoolean()
  OTEL_ENABLED: boolean = true;

  @IsUrl({ require_tld: false })
  @IsOptional()
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;

  @IsString()
  OTEL_SERVICE_NAME: string = 'nestjs-saas-api';

  @IsString()
  OTEL_SERVICE_VERSION: string = '1.0.0';

  // Rate Limiting
  @IsNumber()
  @Min(1)
  THROTTLE_TTL: number = 60;

  @IsNumber()
  @Min(1)
  THROTTLE_LIMIT: number = 100;

  @IsBoolean()
  THROTTLE_STRICT_MODE: boolean = true;

  // CORS
  @IsString()
  CORS_ORIGIN: string;

  @IsBoolean()
  CORS_CREDENTIALS: boolean = true;

  // Security
  @IsNumber()
  @Min(4)
  @Max(15)
  BCRYPT_ROUNDS: number = 10;

  @IsString()
  SESSION_SECRET: string;

  @IsBoolean()
  CSRF_ENABLED: boolean = false;

  // Logging
  @IsEnum(LogLevel)
  LOG_LEVEL: LogLevel = LogLevel.Info;

  @IsString()
  LOG_FORMAT: string = 'json';

  // Health Check
  @IsBoolean()
  HEALTH_CHECK_ENABLED: boolean = true;

  @IsBoolean()
  HEALTH_CHECK_DATABASE: boolean = true;

  @IsBoolean()
  HEALTH_CHECK_REDIS: boolean = true;

  // Webhooks
  @IsString()
  @IsOptional()
  WEBHOOK_SECRET?: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  WEBHOOK_RETRY_ATTEMPTS: number = 3;

  @IsNumber()
  @Min(1000)
  @Max(30000)
  WEBHOOK_TIMEOUT: number = 5000;

  // File Upload
  @IsNumber()
  @Min(1024)
  MAX_FILE_SIZE: number = 10485760; // 10MB

  @IsString()
  ALLOWED_FILE_TYPES: string = 'image/jpeg,image/png,image/gif,application/pdf';

  // API Keys
  @IsString()
  @IsOptional()
  INTERNAL_API_KEY?: string;

  // Feature Flags
  @IsBoolean()
  FEATURE_WEBSOCKETS_ENABLED: boolean = true;

  @IsBoolean()
  FEATURE_PAYMENTS_ENABLED: boolean = true;

  @IsBoolean()
  FEATURE_EMAIL_ENABLED: boolean = true;
}

/**
 * Validates environment variables
 * Throws an error if validation fails
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((err) => Object.values(err.constraints || {}).join(', ')).join('\n')}`,
    );
  }

  return validatedConfig;
}
