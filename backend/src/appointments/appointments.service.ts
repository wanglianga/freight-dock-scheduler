import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { CreateAppointmentDto, UpdateAppointmentDto, HandlePackagesDto } from './appointment.dto';

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
          if (appointment.handledPackages === 0 && appointment.totalPackages > 0) {
            appointment.handledPackages = appointment.totalPackages;
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
      appointment.completedAt = new Date();
    }
    return this.appointmentRepository.save(appointment);
  }

  async remove(id: number): Promise<void> {
    const result = await this.appointmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`预约 ID ${id} 不存在`);
    }
  }
}
