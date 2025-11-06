import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from './role.entity';

/**
 * User-Role Junction Entity
 * Maps users to roles (many-to-many)
 * Security: Defines user access levels
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles user-role mapping
 */
@Entity('user_roles')
@Index(['userId', 'roleId'], { unique: true })
export class UserRole extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
