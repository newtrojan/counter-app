import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';

/**
 * Role Entity
 * RBAC role definition
 * Security: System roles cannot be modified
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles role data
 * - Open/Closed: Can be extended with custom roles
 */
@Entity('roles')
@Index(['name'], { unique: true })
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * System roles cannot be modified or deleted
   * Examples: super_admin, admin, user
   */
  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  // Relationships
  // @OneToMany(() => RolePermission, rp => rp.role)
  // permissions: RolePermission[];

  // @OneToMany(() => UserRole, ur => ur.role)
  // userRoles: UserRole[];
}
