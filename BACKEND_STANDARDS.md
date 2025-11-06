# Backend Development Standards

## 📋 Overview

This document defines the standards, patterns, and best practices for backend development using NestJS.

---

## 🏗️ Architecture Principles

### **1. Module Structure**
```
src/
├── modules/
│   ├── auth/
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── guards/           # Auth-specific guards
│   │   ├── strategies/       # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   └── .../
├── common/
│   ├── decorators/           # Reusable decorators
│   ├── guards/               # Global guards
│   ├── interceptors/         # Global interceptors
│   ├── middleware/           # Global middleware
│   ├── filters/              # Exception filters
│   ├── pipes/                # Validation pipes
│   └── constants/            # Application constants
├── config/                   # Configuration
├── database/
│   ├── prisma.service.ts     # Prisma service
│   └── prisma.module.ts      # Prisma module
├── prisma/
│   ├── schema.prisma         # Prisma schema
│   ├── migrations/           # Prisma migrations
│   └── seed.ts               # Database seeder
└── main.ts                   # Application entry
```

### **2. File Naming Conventions**
- **Modules**: kebab-case (e.g., `auth.module.ts`, `user-management.module.ts`)
- **Controllers**: kebab-case with `.controller.ts` suffix
- **Services**: kebab-case with `.service.ts` suffix
- **Entities**: PascalCase with `.entity.ts` suffix
- **DTOs**: PascalCase with `.dto.ts` suffix
- **Interfaces**: PascalCase with `.interface.ts` suffix
- **Guards**: kebab-case with `.guard.ts` suffix

---

## 🎯 Module Design Patterns

### **1. Module Structure (Feature Module)**
```typescript
// users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export if used by other modules
})
export class UsersModule {}

// Note: PrismaModule is global, so no need to import it in feature modules
```

### **2. Controller Pattern**
```typescript
// users.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, TenantGuard, RolesGuard } from '@/common/guards';
import { Roles, CurrentUser, CurrentTenant } from '@/common/decorators';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User } from './entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

/**
 * Users Controller
 * Handles all user-related endpoints
 * Security: Protected by JwtAuthGuard and TenantGuard
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all users in current tenant
   * Security: Tenant-scoped automatically
   */
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll(@CurrentTenant() tenant: Tenant): Promise<User[]> {
    return this.usersService.findAll(tenant.id);
  }

  /**
   * Get single user by ID
   * Security: Validates user belongs to tenant
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentTenant() tenant: Tenant,
  ): Promise<User> {
    return this.usersService.findOne(id, tenant.id);
  }

  /**
   * Create new user
   * Security: Only admins can create users
   */
  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create user' })
  async create(
    @Body(ValidationPipe) dto: CreateUserDto,
    @CurrentTenant() tenant: Tenant,
  ): Promise<User> {
    return this.usersService.create(dto, tenant.id);
  }

  /**
   * Update user
   * Security: Users can update themselves, admins can update anyone
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateUserDto,
    @CurrentUser() user: User,
    @CurrentTenant() tenant: Tenant,
  ): Promise<User> {
    // Check authorization
    if (user.id !== id && !user.hasRole('admin')) {
      throw new ForbiddenException('Cannot update other users');
    }

    return this.usersService.update(id, dto, tenant.id);
  }

  /**
   * Delete user
   * Security: Only admins can delete users
   */
  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete user' })
  async remove(
    @Param('id') id: string,
    @CurrentTenant() tenant: Tenant,
  ): Promise<void> {
    return this.usersService.remove(id, tenant.id);
  }
}
```

### **3. Service Pattern**
```typescript
// users.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { User } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

/**
 * Users Service
 * Business logic for user operations
 * Security: All queries are tenant-scoped via Prisma middleware
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Find all users in tenant
   * Security: Automatically filters by tenantId via Prisma middleware
   */
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find user by ID
   * Security: Validates user belongs to tenant via Prisma middleware
   */
  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Create new user
   * Security: Password is hashed, tenant is enforced
   */
  async create(dto: CreateUserDto, tenantId: string): Promise<User> {
    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      ...dto,
      passwordHash,
      tenantId,
    });

    return this.userRepository.save(user);
  }

  /**
   * Update user
   * Security: Validates ownership, hashes password if changed
   */
  async update(id: string, dto: UpdateUserDto, tenantId: string): Promise<User> {
    const user = await this.findOne(id, tenantId);

    // Hash password if changed
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  /**
   * Delete user (soft delete)
   * Security: Validates ownership
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const user = await this.findOne(id, tenantId);
    await this.userRepository.softRemove(user);
  }
}
```

---

## 📝 DTO Standards

### **1. Create DTO**
```typescript
// create-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

/**
 * Create User DTO
 * Validation: class-validator decorators
 * Documentation: Swagger/OpenAPI decorators
 */
export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
```

### **2. Update DTO**
```typescript
// update-user.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * Update User DTO
 * Makes all fields optional except email (omitted)
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email'] as const),
) {}
```

---

## 🛡️ Security Standards

### **1. Authentication Guards**

#### ✅ Always Use Guards on Protected Routes
```typescript
// ✅ Good - Explicitly protected
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('users')
export class UsersController { ... }

// ❌ Bad - No protection
@Controller('users')
export class UsersController { ... }
```

#### ✅ Mark Public Routes Explicitly
```typescript
@Public()
@Post('login')
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

### **2. Tenant Isolation**

#### ✅ Always Validate Tenant Ownership
```typescript
// ✅ Good - Validates tenant
async findOne(id: string, tenantId: string): Promise<User> {
  const user = await this.userRepository.findOne({
    where: { id, tenantId }, // Both conditions!
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}

// ❌ Bad - Missing tenant validation
async findOne(id: string): Promise<User> {
  return this.userRepository.findOne({ where: { id } });
}
```

#### ✅ Use Tenant Scoping in Queries
```typescript
// ✅ Good - Tenant-scoped
const users = await this.userRepository.find({
  where: { tenantId },
});

// ❌ Bad - Returns all tenants' data!
const users = await this.userRepository.find();
```

### **3. Input Validation**

#### ✅ Use ValidationPipe Globally
```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Strip non-whitelisted properties
    forbidNonWhitelisted: true, // Throw error on non-whitelisted properties
    transform: true, // Auto-transform to DTO types
  }),
);
```

#### ✅ Validate All Inputs
```typescript
// ✅ Good - DTO with validation
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// ❌ Bad - No validation
export class CreateUserDto {
  email: string;
  password: string;
}
```

### **4. Password Security**

#### ✅ Always Hash Passwords
```typescript
import * as bcrypt from 'bcrypt';

// ✅ Good - Hashed with sufficient rounds
const hash = await bcrypt.hash(password, 10);

// ❌ Bad - Plain text password
user.password = password;
```

#### ✅ Never Return Passwords
```typescript
// Use class-transformer in DTOs
import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;

  @Exclude() // Never expose in API responses
  password: string;
}

// Or exclude in Prisma select
const user = await this.prisma.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    // password is excluded by not selecting it
  },
});
```

### **5. SQL Injection Prevention**

#### ✅ Use Prisma (Automatic Protection)
```typescript
// ✅ Good - Prisma automatically parameterizes all queries (safe)
const user = await this.prisma.user.findUnique({
  where: { email: userEmail },
});

// ✅ Good - Complex queries are still safe
const users = await this.prisma.user.findMany({
  where: {
    AND: [
      { email: { contains: searchTerm } },
      { status: 'active' },
    ],
  },
});

// ⚠️  Use raw queries only when absolutely necessary
// Prisma still parameterizes raw queries
const users = await this.prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userEmail}
`;

// ❌ Bad - Never use string interpolation in raw queries!
// This is vulnerable to SQL injection
const users = await this.prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

### **6. Rate Limiting**

#### ✅ Apply Rate Limiting
```typescript
// ✅ Global rate limiting (main.ts)
app.useGlobalGuards(
  new ThrottlerGuard({
    ttl: 60,
    limit: 10,
  }),
);

// ✅ Route-specific rate limiting
@Throttle(5, 60) // 5 requests per 60 seconds
@Post('login')
async login(@Body() dto: LoginDto) { ... }
```

---

## 🗃️ Database Standards (Prisma)

### **1. Schema Design**

#### ✅ Define Models with Multi-Tenancy
```prisma
// prisma/schema.prisma

// ✅ Good - Model with tenant isolation
model User {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  email     String

  // Timestamps (automatically handled)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Audit fields
  createdBy String?  @map("created_by") @db.Uuid
  updatedBy String?  @map("updated_by") @db.Uuid

  // Relations
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, email])
  @@map("users")
  @@index([tenantId])
  @@index([email])
}
```

#### ✅ Use Indexes and Constraints
```prisma
model User {
  id       String @id @default(uuid()) @db.Uuid
  tenantId String @map("tenant_id") @db.Uuid
  email    String

  // Unique constraint within tenant
  @@unique([tenantId, email])

  // Indexes for performance
  @@index([tenantId])
  @@index([email])
  @@index([status])

  @@map("users")
}
```

### **2. Migrations**

#### ✅ Create Migration for Schema Changes
```bash
# After modifying schema.prisma
npm run prisma:migrate      # Creates and applies migration
npm run prisma:migrate:deploy # Deploy to production

# For development without migration history
npm run db:push
```

#### ✅ Migration Workflow
```bash
# 1. Edit schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_user_phone_number

# This will:
# - Create migration file
# - Apply migration to database
# - Regenerate Prisma Client
```

#### ✅ Prisma Migration Example
```sql
-- Migration file: prisma/migrations/20240101000000_add_user_phone_number/migration.sql
-- AddUserPhoneNumber

-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone_number" VARCHAR(50);

-- CreateIndex (if needed)
CREATE INDEX "users_phone_number_idx" ON "users"("phone_number");
```

### **3. Transactions**

#### ✅ Use Prisma Transactions for Multi-Step Operations
```typescript
async createUserWithRole(dto: CreateUserDto, roleId: string) {
  return this.prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: await bcrypt.hash(dto.password, 10),
      },
    });

    // Assign role
    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId,
      },
    });

    return user;
  });
}

// ✅ Alternative: Sequential operations with automatic rollback
async createUserWithRole(dto: CreateUserDto, roleId: string) {
  return this.prisma.$transaction([
    this.prisma.user.create({
      data: { ...dto, password: await bcrypt.hash(dto.password, 10) },
    }),
    this.prisma.userRole.create({
      data: { userId: user.id, roleId },
    }),
  ]);
}
```

---

## 🎯 Error Handling Standards

### **1. Use Built-in HTTP Exceptions**
```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

// ✅ Good - Descriptive error messages
if (!user) {
  throw new NotFoundException(`User with ID ${id} not found`);
}

if (user.tenantId !== tenantId) {
  throw new ForbiddenException('Access denied to this resource');
}

if (await this.userExists(email)) {
  throw new ConflictException('User with this email already exists');
}
```

### **2. Custom Exception Filters**
```typescript
// Already implemented in common/filters/
// - HttpExceptionFilter
// - AllExceptionsFilter
```

---

## 📊 Logging Standards

### **1. Use Logger Service**
```typescript
import { Logger } from '@nestjs/common';

export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async create(dto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user: ${dto.email}`);

    try {
      const user = await this.userRepository.save(dto);
      this.logger.log(`User created successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

### **2. Don't Log Sensitive Data**
```typescript
// ✅ Good - No sensitive data
this.logger.log(`User login attempt: ${email}`);

// ❌ Bad - Logs password!
this.logger.log(`Login attempt: ${email} / ${password}`);
```

---

## 🧪 Testing Standards

### **1. Unit Test Structure (with Prisma)**
```typescript
// users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/database/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

// Mock PrismaService with common methods
function mockPrismaService() {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };
}

type MockPrismaService = ReturnType<typeof mockPrismaService>;
```

### **2. E2E Test Structure**
```typescript
// users.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'password' });

    authToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return users array', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });
});
```

---

## 📖 Documentation Standards

### **1. OpenAPI/Swagger**
```typescript
// ✅ Always add API documentation
@ApiTags('users')
@ApiOperation({ summary: 'Get all users' })
@ApiResponse({ status: 200, description: 'Users retrieved successfully', type: [User] })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Get()
async findAll() { ... }
```

### **2. Code Comments**
```typescript
/**
 * UsersService handles all user-related business logic
 * Security: All methods are tenant-scoped
 */
@Injectable()
export class UsersService {
  /**
   * Find user by ID
   * @param id - User ID
   * @param tenantId - Tenant ID for isolation
   * @returns User entity
   * @throws NotFoundException if user not found
   */
  async findOne(id: string, tenantId: string): Promise<User> {
    // Implementation
  }
}
```

---

## ✅ Code Review Checklist

Before submitting a PR, ensure:

- [ ] All controllers use guards (JwtAuthGuard, TenantGuard)
- [ ] All DTOs have validation decorators
- [ ] All passwords are hashed
- [ ] All queries are tenant-scoped
- [ ] No sensitive data in logs
- [ ] Swagger documentation is complete
- [ ] Unit tests are written
- [ ] E2E tests for new endpoints
- [ ] Error handling is consistent
- [ ] TypeScript strict mode passes
- [ ] No ESLint errors
- [ ] Migrations are created for schema changes

---

## 🚫 Common Mistakes to Avoid

### ❌ Don't Skip Tenant Validation
```typescript
// ❌ Bad - Missing tenant check
const user = await this.userRepository.findOne({ where: { id } });

// ✅ Good - Validates tenant
const user = await this.userRepository.findOne({ where: { id, tenantId } });
```

### ❌ Don't Return Sensitive Data
```typescript
// ❌ Bad - Returns password hash
return user;

// ✅ Good - Use @Exclude() decorator on sensitive fields
@Exclude()
passwordHash: string;
```

### ❌ Don't Hardcode Configuration
```typescript
// ❌ Bad - Hardcoded
const apiKey = 'sk_test_1234';

// ✅ Good - From ConfigService
const apiKey = this.configService.get('stripe.secretKey');
```

---

**Follow these standards to ensure secure, maintainable, and scalable backend code! 🚀**
