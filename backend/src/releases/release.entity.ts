import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';

export enum AcceptanceConclusion {
  PASSED = 'passed',
  NEEDS_REVIEW = 'needs_review',
  REJECTED = 'rejected',
}

@Entity('release_records')
export class ReleaseRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  releaseNo: string;

  @OneToOne(() => Appointment, (appointment) => appointment.releaseRecord, { eager: true })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column()
  appointmentId: number;

  @Column()
  plateNumber: string;

  @Column()
  carrierName: string;

  @Column({ nullable: true })
  dockNumber: string;

  @Column({ type: 'timestamp', nullable: true })
  arrivedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'int', default: 0 })
  totalPackages: number;

  @Column({ type: 'int', default: 0 })
  handledPackages: number;

  @Column({ type: 'int', default: 0 })
  actualPackages: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  detentionFee: number;

  @Column({ type: 'boolean', default: false })
  detentionPaid: boolean;

  @Column({
    type: 'enum',
    enum: AcceptanceConclusion,
    default: AcceptanceConclusion.PASSED,
  })
  acceptanceConclusion: AcceptanceConclusion;

  @Column({ type: 'boolean', default: false })
  needsReview: boolean;

  @Column({ type: 'text', nullable: true })
  reviewNote: string;

  @Column({ type: 'timestamp' })
  releasedAt: Date;

  @Column({ nullable: true })
  releasedBy: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}
