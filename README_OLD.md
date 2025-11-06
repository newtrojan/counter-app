# NestJS SaaS Boilerplate 🚀

Enterprise-grade, production-ready NestJS boilerplate for building multi-tenant SaaS applications with authentication, RBAC, payments, observability, and more.

## ✨ Features

### 🏢 Multi-Tenancy
- **Hybrid tenant isolation**: Token-based (primary) + Header-based (fallback)
- **Request context isolation** using CLS (Continuation Local Storage)
- **Tenant guards** preventing cross-tenant data access
- **Automatic tenant scoping** for all database queries

### 🔐 Security
- **JWT authentication** with refresh tokens
- **RBAC (Role-Based Access Control)** using CASL
- **Social OAuth** (Google, GitHub)
- **Security headers** via Helmet
- **Rate limiting** with Redis backing
- **API key authentication** for webhooks
- **CORS configuration**
- **Input validation** with class-validator
- **SQL injection prevention** via TypeORM
- **Audit logging** for compliance
- **Password hashing** with bcrypt

### 📊 Observability
- **OpenTelemetry** integration
- **Distributed tracing** with Jaeger
- **Metrics collection** with Prometheus
- **Visualization** with Grafana
- **Structured logging** with Winston
- **Request/response logging**
- **Health checks** (database, Redis, custom)

### 💳 Payments
- **Stripe integration** (ready to implement)
- **Webhook handling** with signature verification
- **Subscription management** support

### 📧 Communication
- **Email service** with templates (Nodemailer)
- **Transactional emails** (verification, password reset)
- **Queue-based sending** via Bull

### 📁 File Storage
- **S3-compatible storage** (AWS S3, MinIO)
- **File upload/download**
- **Image processing** with Sharp

### 🔄 Background Jobs
- **Bull/BullMQ** for job processing
- **Cron jobs** via @nestjs/schedule
- **Event-driven architecture** with EventEmitter

### 🌐 Additional Features
- **WebSocket support** (Socket.io)
- **API versioning**
- **Swagger documentation**
- **Docker support**
- **Database migrations**
- **Seeding support**
- **Testing infrastructure**

---

## 🏗️ Architecture

```
src/
├── common/               # Shared utilities
│   ├── constants/       # Application constants
│   ├── decorators/      # Custom decorators (@CurrentUser, @Roles, etc.)
│   ├── guards/          # Security guards (JWT, Tenant, Roles, API Key)
│   ├── interceptors/    # Logging, Audit, Transform
│   ├── middleware/      # Tenant, Logger middleware
│   ├── filters/         # Exception filters
│   └── pipes/           # Validation pipes
├── config/              # Configuration
│   ├── configuration.ts # Config factory
│   ├── env.validation.ts # Environment validation
│   └── typeorm.config.ts # Database config
├── database/
│   ├── entities/        # Base entities
│   ├── migrations/      # TypeORM migrations
│   ├── seeds/           # Database seeders
│   └── subscribers/     # TypeORM subscribers
└── modules/
    ├── auth/            # Authentication
    ├── users/           # User management
    ├── tenants/         # Tenant management
    ├── rbac/            # Roles & Permissions
    ├── audit/           # Audit logging
    ├── health/          # Health checks
    ├── payments/        # Stripe integration
    ├── webhooks/        # Webhook handlers
    ├── email/           # Email service
    ├── storage/         # File storage
    └── jobs/            # Background jobs
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **PostgreSQL** >= 15.x
- **Redis** >= 7.x
- **Docker** (optional, recommended)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd nestjs-saas-boilerplate
```

2. **Install dependencies**
```bash
npm install
```

3. **Start infrastructure** (PostgreSQL, Redis, Jaeger, Prometheus, Grafana)
```bash
docker-compose up -d
```

4. **Configure environment**
```bash
# .env file is already created with development defaults
# Update the values as needed
```

5. **Run database migrations**
```bash
npm run migration:run
```

6. **Seed database** (optional)
```bash
npm run seed
```

7. **Start development server**
```bash
npm run start:dev
```

The API will be available at:
- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/docs
- **Jaeger UI**: http://localhost:16686
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

---

## 🔒 Security Architecture

### Multi-Tenancy Isolation

```typescript
// 1. Tenant Context Extraction (TenantMiddleware)
Request → Extract tenant from JWT/Header/Slug → Store in CLS

// 2. Tenant Validation (TenantGuard)
Request → Verify tenant exists and active → Prevent cross-tenant access

// 3. Automatic Tenant Scoping (BaseRepository)
Query → Auto-inject tenantId filter → Return only tenant's data
```

### Authentication Flow

```typescript
// 1. Login
POST /api/v1/auth/login
{ email, password } → Validate credentials → Return { accessToken, refreshToken }

// 2. Access Protected Route
GET /api/v1/users/profile
Headers: { Authorization: "Bearer <accessToken>" }
→ JwtAuthGuard validates token
→ TenantGuard validates tenant
→ Return user data

// 3. Refresh Token
POST /api/v1/auth/refresh
{ refreshToken } → Validate refresh token → Return new accessToken
```

### RBAC (Role-Based Access Control)

```typescript
// Using decorators for access control
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Delete(':id')
async deleteUser(@Param('id') id: string) {
  // Only admins can access
}

@Permissions(Permission.USERS_DELETE)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Delete(':id')
async deleteUser(@Param('id') id: string) {
  // Fine-grained permission check
}
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📦 Building for Production

```bash
# Build
npm run build

# Run production server
npm run start:prod
```

### Docker Build

```bash
# Build image
docker build -t nestjs-saas-api .

# Run container
docker run -p 3000:3000 --env-file .env nestjs-saas-api
```

---

## 🔐 Environment Variables

See `.env.example` for all available configuration options.

**Critical variables for production:**

```bash
# Security
JWT_SECRET=<strong-random-secret-min-32-chars>
JWT_REFRESH_SECRET=<strong-random-secret-min-32-chars>
SESSION_SECRET=<strong-random-secret-min-32-chars>
BCRYPT_ROUNDS=12

# Database
DATABASE_SSL=true
DATABASE_SYNCHRONIZE=false

# Application
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

---

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs-json

---

## 🧩 SOLID Principles Implementation

This boilerplate strictly follows SOLID principles:

### Single Responsibility
- Each class has one reason to change
- Guards only handle authorization
- Services only handle business logic
- Repositories only handle data access

### Open/Closed
- Guards can be extended without modification
- Strategies can be added for new OAuth providers
- New modules can be added without changing existing code

### Liskov Substitution
- All entities can replace BaseEntity
- All tenant-scoped entities can replace TenantScopedEntity

### Interface Segregation
- Small, focused interfaces
- Decorators for specific purposes
- Guards implement specific interfaces

### Dependency Inversion
- Depend on abstractions (ConfigService, not process.env)
- Inject dependencies, don't create them
- Use NestJS dependency injection throughout

---

## 🔒 Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Use DTOs with class-validator
3. **Sanitize outputs** - Transform interceptor, exclude sensitive fields
4. **Rate limiting** - Prevent brute force attacks
5. **SQL injection prevention** - Use TypeORM parameterized queries
6. **XSS prevention** - Helmet middleware, input validation
7. **CSRF protection** - Enable in production if using cookies
8. **Audit logging** - Track all important actions
9. **Least privilege** - Use RBAC, grant minimum permissions
10. **Regular updates** - Keep dependencies updated

---

## 📝 License

MIT License - feel free to use this boilerplate for your projects!

---

**Happy coding! 🎉**
