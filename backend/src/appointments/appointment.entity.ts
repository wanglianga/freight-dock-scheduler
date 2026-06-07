import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Carrier } from '../carriers/carrier.entity';
import { ReleaseRecord } from '../releases/release.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  ARRIVED = 'arrived',
  LOADING = 'loading',
  COMPLETED = 'completed',
  RELEASED = 'released',
  CANCELLED = 'cancelled',
}

export enum OperationType {
  LOAD = 'load',
  UNLOAD = 'unload',
  BOTH = 'both',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  appointmentNo: string;

  @ManyToOne(() => Carrier, (carrier) => carrier.appointments, { eager: true })
  @JoinColumn({ name: 'carrierId' })
  carrier: Carrier;

  @Column()
  carrierId: number;

  @Column()
  plateNumber: string;

  @Column()
  driverName: string;

  @Column()
  driverPhone: string;

  @Column({
    type: 'enum',
    enum: OperationType,
    default: OperationType.UNLOAD,
  })
  operationType: OperationType;

  @Column({ type: 'int', default: 0 })
  totalPackages: number;

  @Column({ type: 'int', default: 0 })
  handledPackages: number;

  @Column({ type: 'timestamp', nullable: true })
  scheduledTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  arrivedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ nullable: true })
  dockNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  detentionFee: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'boolean', default: false })
  boundaryCheckPassed: boolean;

  @Column({ type: 'text', nullable: true })
  boundaryCheckNote: string;

  @OneToOne(() => ReleaseRecord, (release) => release.appointment)
  releaseRecord: ReleaseRecord;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
