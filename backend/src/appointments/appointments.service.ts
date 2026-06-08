import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  HandlePackagesDto,
  SubmitActualPackagesDto,
  PayDetentionDto,
} from './appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async findAll(status?: AppointmentStatus): Promise<Appointment[]> {
    const where = status ? { status } : {};
    return this.appointmentRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findPending(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: [
        { status: AppointmentStatus.PENDING },
        { status: AppointmentStatus.QUEUED },
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async findProcessing(): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: [
        { status: AppointmentStatus.ARRIVED },
        { status: AppointmentStatus.LOADING },
        { status: AppointmentStatus.COMPLETED },
      ],
      order: { updatedAt: 'DESC' },
    });
  }

  async findReleased(): Promise<Appointment[]> {
    return this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.releaseRecord', 'releaseRecord')
      .leftJoinAndSelect('appointment.carrier', 'carrier')
      .where('appointment.status = :status', { status: AppointmentStatus.RELEASED })
      .orderBy('releaseRecord.releasedAt', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException(`预约 ID ${id} 不存在`);
    }
    return appointment;
  }

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const appointmentNo = `YY${Date.now().toString().slice(-8)}`;
    const appointment = this.appointmentRepository.create({
      ...dto,
      appointmentNo,
      status: AppointmentStatus.PENDING,
    });
    return this.appointmentRepository.save(appointment);
  }

  private calculateDetentionFee(appointment: Appointment, completedAt: Date): number {
    if (!appointment.startedAt) return 0;
    const standardMs = (appointment.standardDurationMinutes || 60) * 60 * 1000;
    const rate = Number(appointment.detentionRatePerMinute || 1);
    const actualMs = completedAt.getTime() - new Date(appointment.startedAt).getTime();
    const overtimeMs = actualMs - standardMs;
    if (overtimeMs <= 0) return 0;
    const overtimeMinutes = Math.ceil(overtimeMs / (60 * 1000));
    return Number((overtimeMinutes * rate).toFixed(2));
  }

  async update(id: number, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (dto.status !== undefined) {
      const now = new Date();
      switch (dto.status) {
        case AppointmentStatus.QUEUED:
          break;
        case AppointmentStatus.ARRIVED:
          appointment.arrivedAt = now;
          break;
        case AppointmentStatus.LOADING:
          if (!appointment.arrivedAt) {
            appointment.arrivedAt = now;
          }
          appointment.startedAt = now;
          break;
        case AppointmentStatus.COMPLETED:
          appointment.completedAt = now;
          appointment.detentionFee = this.calculateDetentionFee(appointment, now);
          if (appointment.handledPackages === 0 && appointment.totalPackages > 0) {
            appointment.handledPackages = appointment.totalPackages;
          }
          if (appointment.actualPackages === 0 && appointment.totalPackages > 0) {
            appointment.actualPackages = appointment.totalPackages;
          }
          break;
      }
    }

    Object.assign(appointment, dto);
    return this.appointmentRepository.save(appointment);
  }

  async queueCheck(id: number): Promise<{ passed: boolean; note: string }> {
    const appointment = await this.findOne(id);
    const note: string[] = [];
    let passed = true;

    if (!appointment.plateNumber) {
      passed = false;
      note.push('车牌号未填写');
    }
    if (!appointment.driverName) {
      passed = false;
      note.push('司机姓名未填写');
    }
    if (appointment.totalPackages <= 0) {
      passed = false;
      note.push('件数必须大于0');
    }

    const result = { passed, note: note.join('；') || '排队校验通过' };
    await this.appointmentRepository.update(id, {
      boundaryCheckPassed: passed,
      boundaryCheckNote: result.note,
      status: passed ? AppointmentStatus.QUEUED : appointment.status,
    });
    return result;
  }

  async handlePackages(id: number, dto: HandlePackagesDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (appointment.status !== AppointmentStatus.LOADING) {
      throw new BadRequestException('只有装卸中的预约才能处理计件');
    }
    const newHandled = appointment.handledPackages + dto.packages;
    if (newHandled > appointment.totalPackages) {
      throw new BadRequestException(`处理件数超过总件数（总件数：${appointment.totalPackages}，当前已处理：${appointment.handledPackages}）`);
    }
    appointment.handledPackages = newHandled;
    if (newHandled >= appointment.totalPackages) {
      appointment.status = AppointmentStatus.COMPLETED;
      const now = new Date();
      appointment.completedAt = now;
      appointment.detentionFee = this.calculateDetentionFee(appointment, now);
      if (appointment.actualPackages === 0 && appointment.totalPackages > 0) {
        appointment.actualPackages = appointment.totalPackages;
      }
    }
    return this.appointmentRepository.save(appointment);
  }

  async submitActualPackages(
    id: number,
    dto: SubmitActualPackagesDto,
  ): Promise<{ appointment: Appointment; needsReview: boolean; diffPercent: number }> {
    const appointment = await this.findOne(id);
    if (
      appointment.status !== AppointmentStatus.LOADING &&
      appointment.status !== AppointmentStatus.COMPLETED &&
      appointment.status !== AppointmentStatus.ARRIVED
    ) {
      throw new BadRequestException('当前状态不能录入实际装卸件数');
    }

    const total = appointment.totalPackages || 0;
    const actual = dto.actualPackages;
    let diffPercent = 0;
    if (total > 0) {
      diffPercent = Math.abs(actual - total) / total;
    }
    const needsReview = diffPercent > 0.1;

    appointment.actualPackages = actual;
    appointment.needsReview = needsReview;
    if (dto.reviewNote) {
      appointment.reviewNote = dto.reviewNote;
    }

    const saved = await this.appointmentRepository.save(appointment);
    return {
      appointment: saved,
      needsReview,
      diffPercent: Number((diffPercent * 100).toFixed(2)),
    };
  }

  async computeDetentionFee(id: number): Promise<{
    appointment: Appointment;
    fee: number;
    overtimeMinutes: number;
    actualMinutes: number;
  }> {
    const appointment = await this.findOne(id);
    if (!appointment.startedAt) {
      throw new BadRequestException('装卸尚未开始，无法计算滞留罚金');
    }
    const now = appointment.completedAt ? new Date(appointment.completedAt) : new Date();
    const fee = this.calculateDetentionFee(appointment, now);
    const actualMinutes = Math.ceil(
      (now.getTime() - new Date(appointment.startedAt).getTime()) / (60 * 1000),
    );
    const standard = appointment.standardDurationMinutes || 60;
    const overtimeMinutes = Math.max(0, actualMinutes - standard);
    return {
      appointment,
      fee,
      overtimeMinutes,
      actualMinutes,
    };
  }

  async payDetention(id: number, dto: PayDetentionDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    if (dto.detentionFee !== undefined) {
      appointment.detentionFee = dto.detentionFee;
    }
    appointment.detentionPaid = dto.paid !== undefined ? dto.paid : true;
    return this.appointmentRepository.save(appointment);
  }

  async remove(id: number): Promise<void> {
    const result = await this.appointmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`预约 ID ${id} 不存在`);
    }
  }
}
