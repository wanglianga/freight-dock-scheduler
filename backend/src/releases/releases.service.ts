import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ReleaseRecord } from './release.entity';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { CreateReleaseDto, ReleaseFilterDto } from './release.dto';

@Injectable()
export class ReleasesService {
  constructor(
    @InjectRepository(ReleaseRecord)
    private readonly releaseRepository: Repository<ReleaseRecord>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async findAll(filter?: ReleaseFilterDto): Promise<ReleaseRecord[]> {
    const where: any = {};
    if (filter?.plateNumber) {
      where.plateNumber = filter.plateNumber;
    }
    if (filter?.carrierName) {
      where.carrierName = filter.carrierName;
    }
    if (filter?.startDate && filter?.endDate) {
      where.releasedAt = Between(new Date(filter.startDate), new Date(filter.endDate));
    }
    return this.releaseRepository.find({
      where,
      order: { releasedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ReleaseRecord> {
    const record = await this.releaseRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`放行记录 ID ${id} 不存在`);
    }
    return record;
  }

  async create(dto: CreateReleaseDto): Promise<ReleaseRecord> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: dto.appointmentId },
      relations: ['carrier'],
    });
    if (!appointment) {
      throw new NotFoundException(`预约 ID ${dto.appointmentId} 不存在`);
    }
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException('只有装卸完成的预约才能放行');
    }

    const releaseNo = `FX${Date.now().toString().slice(-8)}`;
    const now = new Date();

    const record = this.releaseRepository.create({
      releaseNo,
      appointmentId: dto.appointmentId,
      plateNumber: appointment.plateNumber,
      carrierName: appointment.carrier?.name || '',
      totalPackages: appointment.totalPackages,
      handledPackages: appointment.handledPackages,
      detentionFee: dto.detentionFee ?? appointment.detentionFee ?? 0,
      releasedAt: now,
      releasedBy: dto.releasedBy || '系统管理员',
      remarks: dto.remarks,
    });

    appointment.status = AppointmentStatus.RELEASED;
    await this.appointmentRepository.save(appointment);

    return this.releaseRepository.save(record);
  }

  async remove(id: number): Promise<void> {
    const result = await this.releaseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`放行记录 ID ${id} 不存在`);
    }
  }
}
