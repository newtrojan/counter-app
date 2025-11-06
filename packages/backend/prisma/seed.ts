import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Prisma Seed Script
 *
 * This script seeds the database with initial data for development.
 * Run with: npm run db:seed or npm run prisma:seed
 *
 * Security:
 * - Passwords are hashed using bcrypt
 * - Default admin credentials should be changed in production
 * - API keys are generated securely
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================================================
  // Create Default Tenant
  // ============================================================================

  console.log('📦 Creating default tenant...');
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Organization',
      slug: 'default',
      plan: 'pro',
      status: 'active',
      settings: {},
      metadata: {
        seeded: true,
        seedDate: new Date().toISOString(),
      },
    },
  });
  console.log(`✅ Created tenant: ${defaultTenant.name} (${defaultTenant.id})`);

  // ============================================================================
  // Create Permissions
  // ============================================================================

  console.log('🔐 Creating permissions...');
  const resources = ['users', 'roles', 'tenants', 'audit_logs', 'api_keys', 'subscriptions'];
  const actions = ['create', 'read', 'update', 'delete', 'manage'];

  const permissions = [];
  for (const resource of resources) {
    for (const action of actions) {
      const permission = await prisma.permission.upsert({
        where: {
          tenantId_resource_action_scope: {
            tenantId: defaultTenant.id,
            resource,
            action,
            scope: 'tenant',
          },
        },
        update: {},
        create: {
          tenantId: defaultTenant.id,
          resource,
          action,
          scope: 'tenant',
          description: `${action} ${resource} within tenant`,
        },
      });
      permissions.push(permission);
    }
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  // ============================================================================
  // Create Roles
  // ============================================================================

  console.log('👥 Creating roles...');

  // Super Admin Role - All permissions
  const superAdminRole = await prisma.role.upsert({
    where: {
      tenantId_slug: {
        tenantId: defaultTenant.id,
        slug: 'super_admin',
      },
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: 'Super Admin',
      slug: 'super_admin',
      description: 'Full system access',
      isSystem: true,
    },
  });

  // Admin Role - Most permissions
  const adminRole = await prisma.role.upsert({
    where: {
      tenantId_slug: {
        tenantId: defaultTenant.id,
        slug: 'admin',
      },
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: 'Admin',
      slug: 'admin',
      description: 'Administrative access',
      isSystem: true,
    },
  });

  // User Role - Basic permissions
  const userRole = await prisma.role.upsert({
    where: {
      tenantId_slug: {
        tenantId: defaultTenant.id,
        slug: 'user',
      },
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      name: 'User',
      slug: 'user',
      description: 'Standard user access',
      isSystem: true,
    },
  });

  console.log(`✅ Created roles: Super Admin, Admin, User`);

  // ============================================================================
  // Assign Permissions to Roles
  // ============================================================================

  console.log('🔗 Assigning permissions to roles...');

  // Super Admin gets all permissions
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Admin gets most permissions (exclude tenant management)
  const adminPermissions = permissions.filter(p => p.resource !== 'tenants');
  for (const permission of adminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // User gets read permissions only
  const userPermissions = permissions.filter(p => p.action === 'read');
  for (const permission of userPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log(`✅ Assigned permissions to all roles`);

  // ============================================================================
  // Create Users
  // ============================================================================

  console.log('👤 Creating users...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Super Admin User
  const superAdmin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: defaultTenant.id,
        email: 'superadmin@example.com',
      },
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      email: 'superadmin@example.com',
      username: 'superadmin',
      firstName: 'Super',
      lastName: 'Admin',
      password: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'active',
      isSuperuser: true,
      isStaff: true,
      metadata: {
        seeded: true,
      },
    },
  });

  // Admin User
  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: defaultTenant.id,
        email: 'admin@example.com',
      },
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      email: 'admin@example.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      password: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'active',
      isStaff: true,
      metadata: {
        seeded: true,
      },
    },
  });

  // Regular User
  const regularUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: defaultTenant.id,
        email: 'user@example.com',
      },
    },
    update: {},
    create: {
      tenantId: defaultTenant.id,
      email: 'user@example.com',
      username: 'user',
      firstName: 'Regular',
      lastName: 'User',
      password: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'active',
      metadata: {
        seeded: true,
      },
    },
  });

  console.log(`✅ Created users: superadmin, admin, user`);

  // ============================================================================
  // Assign Roles to Users
  // ============================================================================

  console.log('🔗 Assigning roles to users...');

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: regularUser.id,
        roleId: userRole.id,
      },
    },
    update: {},
    create: {
      userId: regularUser.id,
      roleId: userRole.id,
    },
  });

  console.log(`✅ Assigned roles to all users`);

  // ============================================================================
  // Summary
  // ============================================================================

  console.log('\n✨ Seed completed successfully!\n');
  console.log('📝 Default credentials:');
  console.log('   Super Admin: superadmin@example.com / Password123!');
  console.log('   Admin:       admin@example.com / Password123!');
  console.log('   User:        user@example.com / Password123!');
  console.log('\n⚠️  IMPORTANT: Change these passwords in production!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
