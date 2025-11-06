import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * TypeORM configuration
 * Following SOLID principles: Dependency Inversion (depends on ConfigService abstraction)
 * Security: Credentials from environment variables only
 */

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('database.host'),
  port: configService.get<number>('database.port'),
  username: configService.get<string>('database.username'),
  password: configService.get<string>('database.password'),
  database: configService.get<string>('database.database'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  subscribers: [__dirname + '/../database/subscribers/*{.ts,.js}'],
  synchronize: configService.get<boolean>('database.synchronize'),
  logging: configService.get<boolean>('database.logging'),
  ssl: configService.get<boolean>('database.ssl')
    ? { rejectUnauthorized: false }
    : false,
  // Connection pool settings for production
  extra: {
    max: 20, // Maximum connections in pool
    min: 2, // Minimum connections in pool
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  },
  // Security: Prevent SQL injection by using parameterized queries
  // TypeORM handles this automatically
});

// For CLI migrations
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  subscribers: [__dirname + '/../database/subscribers/*{.ts,.js}'],
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
