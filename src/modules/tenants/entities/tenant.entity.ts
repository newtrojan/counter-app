import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

/**
 * Tenant Entity
 * Multi-tenant organization model
 * Security: Root of tenant isolation hierarchy
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles tenant data
 * - Interface Segregation: Clean entity structure
 */
@Entity('tenants')
@Index(['slug'], { unique: true })
@Index(['domain'], { unique: true, where: 'domain IS NOT NULL' })
export class Tenant extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  domain?: string;

  @Column({ type: 'varchar', length: 100, default: 'America/New_York' })
  timezone: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'public_booking_enabled', type: 'boolean', default: false })
  publicBookingEnabled: boolean;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  // Business Address
  @Column({ type: 'varchar', length: 2, nullable: true })
  country?: string;

  @Column({ name: 'state_province', type: 'varchar', length: 100, nullable: true })
  stateProvince?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city?: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode?: string;

  @Column({ name: 'address_line1', type: 'varchar', length: 500, nullable: true })
  addressLine1?: string;

  @Column({ name: 'address_line2', type: 'varchar', length: 500, nullable: true })
  addressLine2?: string;

  // Business Contact
  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry?: string;

  // Relationships will be added when other entities are created
  // @OneToMany(() => User, user => user.tenant)
  // users: User[];
}
