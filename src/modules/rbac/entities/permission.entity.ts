import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

/**
 * Permission Entity
 * Fine-grained permissions for RBAC
 * Security: Defines what actions users can perform
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles permission data
 * - Interface Segregation: Simple, focused interface
 *
 * Permission naming convention: resource:action
 * Examples: users:create, users:read, users:update, users:delete
 */
@Entity('permissions')
@Index(['name'], { unique: true })
@Index(['resource', 'action'], { unique: true })
export class Permission extends BaseEntity {
  /**
   * Permission identifier
   * Format: resource:action
   * Example: users:create, tenants:delete, audit:read
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Resource being protected
   * Examples: users, tenants, calls, payments
   */
  @Column({ type: 'varchar', length: 50 })
  resource: string;

  /**
   * Action being performed
   * Examples: create, read, update, delete, export
   */
  @Column({ type: 'varchar', length: 50 })
  action: string;

  // Relationships
  // @OneToMany(() => RolePermission, rp => rp.permission)
  // roles: RolePermission[];
}
