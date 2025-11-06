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
│   │   ├── entities/         # TypeORM entities
│   │   ├── guards/           # Auth-specific guards
│   │   ├── strategies/       # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── dto/
│   │   ├── entities/
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
│   ├── entities/             # Base entities
│   ├── migrations/           # TypeORM migrations
│   ├── seeds/                # Database seeders
│   └── subscribers/          # TypeORM subscribers
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
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export if used by other modules
})
export class UsersModule {}
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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

/**
 * Users Service
 * Business logic for user operations
 * Security: All queries are tenant-scoped
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find all users in tenant
   * Security: Automatically filters by tenantId
   */
  async findAll(tenantId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find user by ID
   * Security: Validates user belongs to tenant
   */
  async findOne(id: string, tenantId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
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
// user.entity.ts
import { Exclude } from 'class-transformer';

export class User extends BaseEntity {
  @Exclude() // Never expose in API responses
  @Column({ name: 'password_hash' })
  passwordHash: string;
}
```

### **5. SQL Injection Prevention**

#### ✅ Use Parameterized Queries (TypeORM)
```typescript
// ✅ Good - Parameterized (safe)
const user = await this.userRepository.findOne({
  where: { email: userEmail },
});

// ✅ Good - Query builder (parameterized)
const users = await this.userRepository
  .createQueryBuilder('user')
  .where('user.email = :email', { email: userEmail })
  .getMany();

// ❌ Bad - String concatenation (SQL injection!)
const users = await this.userRepository.query(
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

## 🗃️ Database Standards

### **1. Entity Design**

#### ✅ Extend Base Entities
```typescript
// ✅ Good - Extends TenantScopedEntity for multi-tenancy
export class User extends TenantScopedEntity {
  @Column()
  email: string;

  // tenantId, createdAt, updatedAt, deletedAt inherited
}

// ✅ Good - Use BaseEntity for non-tenant data
export class Role extends BaseEntity {
  @Column()
  name: string;

  // id, createdAt, updatedAt, deletedAt inherited
}
```

#### ✅ Use Indexes
```typescript
@Entity('users')
@Index(['email'], { unique: true })
@Index(['tenantId'])
@Index(['tenantId', 'email'], { unique: true })
export class User extends TenantScopedEntity {
  @Column({ unique: true })
  email: string;
}
```

### **2. Migrations**

#### ✅ Create Migration for Schema Changes
```bash
npm run typeorm migration:generate -- src/database/migrations/AddUserPhoneNumber
npm run typeorm migration:run
```

#### ✅ Migration Example
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPhoneNumber1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phone_number" varchar(50) NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "phone_number"`
    );
  }
}
```

### **3. Transactions**

#### ✅ Use Transactions for Multi-Step Operations
```typescript
async createUserWithRole(dto: CreateUserDto, roleId: string): Promise<User> {
  return this.dataSource.transaction(async (manager) => {
    // Create user
    const user = manager.create(User, dto);
    await manager.save(user);

    // Assign role
    const userRole = manager.create(UserRole, {
      userId: user.id,
      roleId,
    });
    await manager.save(userRole);

    return user;
  });
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

### **1. Unit Test Structure**
```typescript
// users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const user = { id: '1', email: 'test@example.com' };
      repository.findOne.mockResolvedValue(user);

      const result = await service.findOne('1', 'tenant-1');

      expect(result).toEqual(user);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1', tenantId: 'tenant-1' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1', 'tenant-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

function mockRepository() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };
}
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
