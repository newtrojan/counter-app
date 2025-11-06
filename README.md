# NestJS SaaS Platform 🚀

Enterprise-grade, production-ready **full-stack SaaS platform** with NestJS backend and React 19 frontend.

## 📁 Project Structure

```
/
├── packages/
│   ├── backend/          # NestJS API (Independent)
│   └── frontend/         # React 19 + Vite (Independent)
├── ARCHITECTURE.md       # Backend architecture
├── FRONTEND_SETUP.md     # Frontend setup guide
└── README.md            # This file
```

**Each package is completely independent** and can be moved to its own repository later.

---

## 🎯 Tech Stack

### Backend (`packages/backend`)
- **NestJS** - Enterprise Node.js framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database with TypeORM
- **Redis** - Caching & sessions
- **JWT** - Authentication
- **CASL** - RBAC authorization
- **OpenTelemetry** - Observability
- **Docker** - Containerization

### Frontend (`packages/frontend`)
- **React 19** - Latest React
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Query** - API state management
- **Zustand** - Global state
- **React Hook Form + Zod** - Forms & validation
- **Tailwind CSS + shadcn/ui** - Styling
- **React Router v6** - Routing
- **Axios** - HTTP client with auth

---

## ✨ Features

### 🔐 Security
- **Multi-tenancy** with token-based isolation
- **JWT authentication** with automatic refresh
- **RBAC** (Role-Based Access Control)
- **Protected routes** with role checks
- **Zod validation** on all forms
- **Security headers** (Helmet)
- **Rate limiting** (Redis-backed)
- **Audit logging**

### 🏢 Multi-Tenancy
- Token-based (primary) + Header-based (fallback)
- Request context isolation (CLS)
- Tenant guards preventing cross-tenant access
- Automatic tenant scoping for queries

### 📊 Observability
- OpenTelemetry tracing
- Jaeger UI
- Prometheus metrics
- Grafana dashboards
- Winston logging

### 💼 Business Features
- User management
- Role & permission management
- Dashboard (User & Admin)
- Profile & settings pages
- Email notifications (ready)
- Payment integration (Stripe ready)

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 15
- Redis >= 7
- Docker (recommended)

### 1. Install Dependencies

**Backend:**
```bash
cd packages/backend
npm install
```

**Frontend:**
```bash
cd packages/frontend
npm install
```

### 2. Start Infrastructure (Docker)

```bash
cd packages/backend
docker-compose up -d
```

This starts:
- PostgreSQL (5432)
- Redis (6379)
- Jaeger (16686)
- Prometheus (9090)
- Grafana (3001)

### 3. Configure Environment

**Backend** (`packages/backend/.env`):
```bash
# Copy example
cp .env.example .env

# Update these values
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nestjs_saas

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

**Frontend** (`packages/frontend/.env`):
```bash
VITE_API_URL=http://localhost:3000/api/v1
```

### 4. Run Migrations

```bash
cd packages/backend
npm run migration:run
```

### 5. Start Development Servers

**From root:**
```bash
# Backend only
npm run backend:dev

# Frontend only
npm run frontend:dev
```

**Or run each independently:**
```bash
# Terminal 1 - Backend
cd packages/backend
npm run dev

# Terminal 2 - Frontend
cd packages/frontend
npm run dev
```

### 6. Access Applications

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/docs
- **Jaeger**: http://localhost:16686
- **Grafana**: http://localhost:3001 (admin/admin)

---

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Backend architecture, entities, security
- **[FRONTEND_SETUP.md](FRONTEND_SETUP.md)** - Frontend setup, components, pages

---

## 🔒 Security Architecture

### Authentication Flow
1. User logs in → Backend validates credentials
2. Backend returns JWT access token + refresh token
3. Frontend stores tokens securely
4. Frontend includes token in all requests
5. Backend validates token on each request
6. Token expires → Auto-refresh via interceptor

### Multi-Tenancy
- Tenant ID extracted from JWT
- TenantMiddleware sets context
- TenantGuard validates access
- All queries automatically scoped to tenant

### Protected Routes
```typescript
// Frontend
<Route element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
<Route element={<AdminRoute><AdminPanel /></AdminRoute>}>

// Backend
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('admin')
```

---

## 📦 Building for Production

**Backend:**
```bash
cd packages/backend
npm run build
npm run start:prod
```

**Frontend:**
```bash
cd packages/frontend
npm run build
# Outputs to packages/frontend/dist
```

---

## 🧪 Testing

**Backend:**
```bash
cd packages/backend
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage
```

**Frontend:**
```bash
cd packages/frontend
npm run test
```

---

## 📝 Key Files Reference

### Backend
- `packages/backend/src/main.ts` - Application entry
- `packages/backend/src/app.module.ts` - Root module
- `packages/backend/src/common/guards/` - Security guards
- `packages/backend/src/database/entities/` - Database entities
- `packages/backend/docker-compose.yml` - Infrastructure

### Frontend
- `packages/frontend/src/main.tsx` - React entry
- `packages/frontend/src/App.tsx` - Routing
- `packages/frontend/src/lib/api-client.ts` - HTTP client with auth
- `packages/frontend/src/store/auth-store.ts` - Auth state
- `packages/frontend/src/pages/` - All pages

---

## 🔄 Moving to Separate Repos

When ready to split into separate repositories:

```bash
# Backend
cd packages/backend
git init
git add .
git commit -m "Initial backend"
git remote add origin <backend-repo-url>
git push -u origin main

# Frontend
cd packages/frontend
git init
git add .
git commit -m "Initial frontend"
git remote add origin <frontend-repo-url>
git push -u origin main
```

Update API URL in frontend `.env`:
```bash
VITE_API_URL=https://api.yourdomain.com/api/v1
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use for your projects!

---

## 🎉 What's Included

✅ **Backend** - Enterprise NestJS API with multi-tenancy, RBAC, security
✅ **Frontend** - Modern React 19 with TypeScript, forms, routing
✅ **Authentication** - JWT with automatic refresh, protected routes
✅ **Authorization** - RBAC with guards, role checks
✅ **Database** - PostgreSQL with TypeORM, migrations
✅ **Caching** - Redis for sessions, rate limiting
✅ **Observability** - OpenTelemetry, Jaeger, Prometheus, Grafana
✅ **Validation** - class-validator (backend), Zod (frontend)
✅ **API Client** - Axios with interceptors, auto-retry
✅ **UI Components** - shadcn/ui, Tailwind CSS
✅ **Forms** - React Hook Form with Zod validation
✅ **State Management** - Zustand (simple, powerful)
✅ **Routing** - React Router with protected routes
✅ **Docker** - Complete infrastructure setup
✅ **Documentation** - Comprehensive guides

**Ready to build your SaaS! 🚀**
