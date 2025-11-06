/**
 * Application-wide constants
 * Following SOLID principles: Single Responsibility
 */

// Metadata keys for decorators
export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const TENANT_KEY = 'tenant';
export const AUDIT_KEY = 'audit';
export const API_KEY_REQUIRED = 'apiKeyRequired';

// Request context keys
export const REQUEST_ID_KEY = 'requestId';
export const USER_KEY = 'user';
export const TENANT_ID_KEY = 'tenantId';
export const SESSION_ID_KEY = 'sessionId';

// Cache keys
export const CACHE_USER_PREFIX = 'user:';
export const CACHE_TENANT_PREFIX = 'tenant:';
export const CACHE_SESSION_PREFIX = 'session:';
export const CACHE_PERMISSION_PREFIX = 'permission:';

// Rate limiting keys
export const RATE_LIMIT_PREFIX = 'rate_limit:';

// Security headers
export const TENANT_HEADER = 'X-Tenant-ID';
export const API_KEY_HEADER = 'X-API-Key';
export const REQUEST_ID_HEADER = 'X-Request-ID';

// Default pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Token expiration
export const EMAIL_VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
export const PASSWORD_RESET_TOKEN_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// File upload
export const UPLOAD_DIRECTORY = './uploads';
export const TEMP_DIRECTORY = './tmp';

// Audit actions
export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS = 'ACCESS',
  EXPORT = 'EXPORT',
}

// User roles (base roles)
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

// Permissions (CRUD + custom)
export enum Permission {
  // Users
  USERS_CREATE = 'users:create',
  USERS_READ = 'users:read',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',

  // Tenants
  TENANTS_CREATE = 'tenants:create',
  TENANTS_READ = 'tenants:read',
  TENANTS_UPDATE = 'tenants:update',
  TENANTS_DELETE = 'tenants:delete',

  // Audit logs
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',

  // Payments
  PAYMENTS_CREATE = 'payments:create',
  PAYMENTS_READ = 'payments:read',
  PAYMENTS_REFUND = 'payments:refund',

  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',
}

// HTTP status messages
export const HTTP_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  TENANT_REQUIRED: 'Tenant context is required',
  TENANT_INACTIVE: 'Tenant is inactive',
  TENANT_MISMATCH: 'Tenant mismatch - access denied',
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
};

// Queue names
export const QUEUE_NAMES = {
  EMAIL: 'email',
  WEBHOOK: 'webhook',
  AUDIT: 'audit',
  NOTIFICATIONS: 'notifications',
  REPORTS: 'reports',
};

// Event names
export const EVENTS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  TENANT_CREATED: 'tenant.created',
  TENANT_UPDATED: 'tenant.updated',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
};
