import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, MoreThanOrEqual, LessThanOrEqual, Brackets } from 'typeorm';
import { ReleaseRecord, AcceptanceConclusion } from './release.entity';
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
    const queryBuilder = this.releaseRepository
      .createQueryBuilder('release')
      .leftJoinAndSelect('release.appointment', 'appointment')
      .orderBy('release.releasedAt', 'DESC');

    if (filter?.plateNumber) {
      queryBuilder.andWhere('release.plateNumber LIKE :plateNumber', {
        plateNumber: `%${filter.plateNumber}%`,
      });
    }
    if (filter?.carrierName) {
      queryBuilder.andWhere('release.carrierName LIKE :carrierName', {
        carrierName: `%${filter.carrierName}%`,
      });
    }
    if (filter?.dockNumber) {
      queryBuilder.andWhere('release.dockNumber = :dockNumber', { dockNumber: filter.dockNumber });
    }
    if (filter?.startDate && filter?.endDate) {
      queryBuilder.andWhere('release.releasedAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(filter.startDate),
        endDate: new Date(filter.endDate),
      });
    } else if (filter?.startDate) {
      queryBuilder.andWhere('release.releasedAt >= :startDate', {
        startDate: new Date(filter.startDate),
      });
    } else if (filter?.endDate) {
      queryBuilder.andWhere('release.releasedAt <= :endDate', {
        endDate: new Date(filter.endDate),
      });
    }
    if (filter?.minDetentionFee !== undefined) {
      queryBuilder.andWhere('release.detentionFee >= :minFee', {
        minFee: Number(filter.minDetentionFee),
      });
    }
    if (filter?.maxDetentionFee !== undefined) {
      queryBuilder.andWhere('release.detentionFee <= :maxFee', {
        maxFee: Number(filter.maxDetentionFee),
      });
    }
    if (filter?.acceptanceConclusion) {
      queryBuilder.andWhere('release.acceptanceConclusion = :conclusion', {
        conclusion: filter.acceptanceConclusion,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<ReleaseRecord> {
    const queryBuilder = this.releaseRepository
      .createQueryBuilder('release')
      .leftJoinAndSelect('release.appointment', 'appointment')
      .leftJoinAndSelect('appointment.carrier', 'carrier')
      .where('release.id = :id', { id });

    const record = await queryBuilder.getOne();
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

    const finalFee = dto.detentionFee ?? appointment.detentionFee ?? 0;
    if (Number(finalFee) > 0 && !appointment.detentionPaid) {
      throw new BadRequestException('滞留罚金未缴纳，不能放行。请先标记"罚金已缴"后再执行放行。');
    }

    const actualPackages = appointment.actualPackages || appointment.handledPackages || appointment.totalPackages;
    const diffPercent =
      appointment.totalPackages > 0
        ? Math.abs(actualPackages - appointment.totalPackages) / appointment.totalPackages
        : 0;
    let acceptanceConclusion = AcceptanceConclusion.PASSED;
    if (appointment.needsReview || diffPercent > 0.1) {
      acceptanceConclusion = AcceptanceConclusion.NEEDS_REVIEW;
    }

    const releaseNo = `FX${Date.now().toString().slice(-8)}`;
    const now = new Date();

    const record = this.releaseRepository.create({
      releaseNo,
      appointmentId: dto.appointmentId,
      plateNumber: appointment.plateNumber,
      carrierName: appointment.carrier?.name || '',
      dockNumber: appointment.dockNumber,
      arrivedAt: appointment.arrivedAt,
      startedAt: appointment.startedAt,
      completedAt: appointment.completedAt,
      totalPackages: appointment.totalPackages,
      handledPackages: appointment.handledPackages,
      actualPackages,
      detentionFee: finalFee,
      detentionPaid: appointment.detentionPaid,
      acceptanceConclusion,
      needsReview: appointment.needsReview,
      reviewNote: appointment.reviewNote,
      releasedAt: now,
      releasedBy: dto.releasedBy || '系统管理员',
      remarks: dto.remarks,
    });

    appointment.status = AppointmentStatus.RELEASED;
    appointment.detentionFee = finalFee;
    await this.appointmentRepository.save(appointment);

    return this.releaseRepository.save(record);
  }

  async exportCsv(filter?: ReleaseFilterDto): Promise<string> {
    const records = await this.findAll(filter);

    const headers = [
      '放行单号',
      '预约号',
      '车牌号',
      '承运商',
      '月台号',
      '入场时间',
      '作业开始时间',
      '作业结束时间',
      '停留总时长(分钟)',
      '预报件数',
      '实际装卸件数',
      '验收结论',
      '罚金金额(元)',
      '罚金缴纳状态',
      '放行时间',
      '放行操作人',
      '备注',
    ];

    const formatDate = (d: Date | null | undefined): string => {
      if (!d) return '';
      const date = new Date(d);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
        date.getHours(),
      )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const calcDuration = (start: Date | null | undefined, end: Date | null | undefined): number => {
      if (!start || !end) return 0;
      return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    };

    const conclusionText: Record<AcceptanceConclusion, string> = {
      [AcceptanceConclusion.PASSED]: '通过',
      [AcceptanceConclusion.NEEDS_REVIEW]: '需复核',
      [AcceptanceConclusion.REJECTED]: '拒收',
    };

    const rows = records.map((r) => {
      const stayDuration = calcDuration(r.arrivedAt, r.completedAt);
      return [
        r.releaseNo,
        r.appointment?.appointmentNo || '',
        r.plateNumber,
        r.carrierName,
        r.dockNumber || '',
        formatDate(r.arrivedAt),
        formatDate(r.startedAt),
        formatDate(r.completedAt),
        stayDuration.toString(),
        r.totalPackages.toString(),
        r.actualPackages.toString(),
        conclusionText[r.acceptanceConclusion] || '',
        Number(r.detentionFee).toFixed(2),
        r.detentionPaid ? '已缴' : '未缴',
        formatDate(r.releasedAt),
        r.releasedBy || '',
        (r.remarks || '').replace(/\r?\n/g, ' '),
      ];
    });

    const escapeCsv = (val: string): string => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvContent =
      '\uFEFF' +
      [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');

    return csvContent;
  }

  async remove(id: number): Promise<void> {
    const result = await this.releaseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`放行记录 ID ${id} 不存在`);
    }
  }
}
