import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { TenantScopedEntity } from '../../../database/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

/**
 * User Entity
 * User model with multi-tenant support
 * Security: Password is hashed, excluded from responses
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles user data
 * - Dependency Inversion: Relations via abstraction
 */
@Entity('users')
@Index(['email'], { unique: true })
@Index(['tenantId'])
@Index(['isActive'])
export class User extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Exclude() // Never expose password in API responses
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 50, nullable: true })
  phoneNumber?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  // Staff capabilities
  @Column({ name: 'can_take_appointments', type: 'boolean', default: false })
  canTakeAppointments: boolean;

  @Column({ name: 'appointment_capacity', type: 'int', nullable: true })
  appointmentCapacity?: number;

  @Column({ name: 'skill_tags', type: 'simple-array', default: [] })
  skillTags: string[];

  @Column({ name: 'is_preferred_staff', type: 'boolean', default: false })
  isPreferredStaff: boolean;

  // Performance tracking
  @Column({ name: 'current_appointment_count', type: 'int', default: 0 })
  currentAppointmentCount: number;

  @Column({ name: 'total_appointments', type: 'int', default: 0 })
  totalAppointments: number;

  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  avgRating?: number;

  @Column({ name: 'completion_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionRate: number;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  // Invitation tracking
  @Column({ name: 'invitation_id', type: 'uuid', nullable: true })
  invitationId?: string;

  @Column({ name: 'last_active_at', type: 'timestamptz', nullable: true })
  lastActiveAt?: Date;

  @Column({ name: 'deactivated_at', type: 'timestamptz', nullable: true })
  deactivatedAt?: Date;

  @Column({ name: 'deactivated_by', type: 'uuid', nullable: true })
  deactivatedBy?: string;

  @Column({ name: 'deactivation_reason', type: 'text', nullable: true })
  deactivationReason?: string;

  // Relationships
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Virtual field - full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Security: Method to check if user can perform action
  hasRole(role: string): boolean {
    // TODO: Implement after creating UserRole relation
    return false;
  }

  hasPermission(permission: string): boolean {
    // TODO: Implement after creating Permission system
    return false;
  }
}
