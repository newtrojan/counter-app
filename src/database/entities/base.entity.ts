import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

/**
 * Base Entity
 * Provides common fields for all entities
 * Security: Includes soft delete and audit timestamps
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles base entity concerns
 * - Open/Closed: Open for extension by other entities
 * - Don't Repeat Yourself: Shared fields in one place
 *
 * Features:
 * - UUID primary key for security (prevents enumeration)
 * - Automatic timestamps (createdAt, updatedAt)
 * - Soft delete support (deletedAt)
 * - Version tracking for optimistic locking
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'timestamptz',
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt?: Date;

  /**
   * Version column for optimistic locking
   * Prevents concurrent update conflicts
   */
  @Column({ type: 'int', default: 1 })
  version: number;

  @BeforeInsert()
  setInitialVersion() {
    this.version = 1;
  }

  @BeforeUpdate()
  incrementVersion() {
    this.version++;
  }
}

/**
 * Tenant Scoped Entity
 * Extends BaseEntity with tenant isolation
 * Security: Critical for multi-tenancy data isolation
 *
 * All tenant-scoped entities MUST extend this class
 */
export abstract class TenantScopedEntity extends BaseEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;
}

/**
 * Auditable Entity
 * Adds created/updated by tracking
 * Security: Full audit trail for compliance
 */
export abstract class AuditableEntity extends TenantScopedEntity {
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;
}
