import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';

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

  @Column({ type: 'int', default: 0 })
  totalPackages: number;

  @Column({ type: 'int', default: 0 })
  handledPackages: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  detentionFee: number;

  @Column({ type: 'timestamp' })
  releasedAt: Date;

  @Column({ nullable: true })
  releasedBy: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;
}
