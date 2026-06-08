import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrier } from '../carriers/carrier.entity';
import { Appointment, AppointmentStatus, OperationType } from '../appointments/appointment.entity';
import { ReleaseRecord, AcceptanceConclusion } from '../releases/release.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Carrier)
    private readonly carrierRepository: Repository<Carrier>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(ReleaseRecord)
    private readonly releaseRepository: Repository<ReleaseRecord>,
  ) {}

  async run() {
    const carrierCount = await this.carrierRepository.count();
    if (carrierCount > 0) {
      console.log('[Seed] 数据已存在，跳过种子数据初始化');
      return;
    }

    console.log('[Seed] 开始初始化种子数据...');

    const carriers = await this.carrierRepository.save([
      this.carrierRepository.create({
        name: '顺达物流有限公司',
        contactPerson: '张经理',
        phone: '13800138001',
        isActive: true,
      }),
      this.carrierRepository.create({
        name: '运通货运集团',
        contactPerson: '李主管',
        phone: '13800138002',
        isActive: true,
      }),
      this.carrierRepository.create({
        name: '宏远运输公司',
        contactPerson: '王队长',
        phone: '13800138003',
        isActive: true,
      }),
    ]);
    console.log('[Seed] 承运商数据创建完成');

    const now = new Date();
    const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000);
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000);

    const appointments: Appointment[] = [];

    appointments.push(
      this.appointmentRepository.create({
        appointmentNo: 'YY00000001',
        carrierId: carriers[0].id,
        carrier: carriers[0],
        plateNumber: '京A12345',
        driverName: '刘师傅',
        driverPhone: '13900139001',
        operationType: OperationType.UNLOAD,
        totalPackages: 120,
        handledPackages: 0,
        actualPackages: 0,
        scheduledTime: hoursAgo(1),
        status: AppointmentStatus.PENDING,
        dockNumber: null,
        detentionFee: 0,
        detentionPaid: false,
        remarks: '电子产品，轻拿轻放',
        boundaryCheckPassed: false,
        boundaryCheckNote: null,
      }),
    );

    appointments.push(
      this.appointmentRepository.create({
        appointmentNo: 'YY00000002',
        carrierId: carriers[1].id,
        carrier: carriers[1],
        plateNumber: '沪B67890',
        driverName: '陈师傅',
        driverPhone: '13900139002',
        operationType: OperationType.LOAD,
        totalPackages: 200,
        handledPackages: 0,
        actualPackages: 0,
        scheduledTime: hoursAgo(2),
        status: AppointmentStatus.QUEUED,
        dockNumber: 'A-03',
        detentionFee: 0,
        detentionPaid: false,
        remarks: '百货用品',
        boundaryCheckPassed: true,
        boundaryCheckNote: '排队校验通过',
        createdAt: hoursAgo(3),
      }),
    );

    appointments.push(
      this.appointmentRepository.create({
        appointmentNo: 'YY00000003',
        carrierId: carriers[2].id,
        carrier: carriers[2],
        plateNumber: '粤C11111',
        driverName: '赵师傅',
        driverPhone: '13900139003',
        operationType: OperationType.UNLOAD,
        totalPackages: 80,
        handledPackages: 45,
        actualPackages: 0,
        scheduledTime: hoursAgo(4),
        arrivedAt: hoursAgo(3),
        startedAt: hoursAgo(2),
        status: AppointmentStatus.LOADING,
        dockNumber: 'B-01',
        detentionFee: 50,
        detentionPaid: false,
        remarks: '生鲜食品，需冷链',
        boundaryCheckPassed: true,
        boundaryCheckNote: '排队校验通过',
        createdAt: hoursAgo(5),
      }),
    );

    appointments.push(
      this.appointmentRepository.create({
        appointmentNo: 'YY00000004',
        carrierId: carriers[0].id,
        carrier: carriers[0],
        plateNumber: '京A22222',
        driverName: '孙师傅',
        driverPhone: '13900139004',
        operationType: OperationType.BOTH,
        totalPackages: 150,
        handledPackages: 150,
        actualPackages: 0,
        scheduledTime: hoursAgo(6),
        arrivedAt: hoursAgo(5),
        startedAt: hoursAgo(4),
        completedAt: hoursAgo(1),
        status: AppointmentStatus.COMPLETED,
        dockNumber: 'A-01',
        detentionFee: 100,
        detentionPaid: true,
        remarks: '先卸后装',
        boundaryCheckPassed: true,
        boundaryCheckNote: '排队校验通过',
        createdAt: hoursAgo(7),
      }),
    );

    appointments.push(
      this.appointmentRepository.create({
        appointmentNo: 'YY00000005',
        carrierId: carriers[1].id,
        carrier: carriers[1],
        plateNumber: '沪B33333',
        driverName: '周师傅',
        driverPhone: '13900139005',
        operationType: OperationType.UNLOAD,
        totalPackages: 300,
        handledPackages: 300,
        actualPackages: 0,
        scheduledTime: hoursAgo(10),
        arrivedAt: hoursAgo(9),
        startedAt: hoursAgo(8),
        completedAt: hoursAgo(6),
        status: AppointmentStatus.COMPLETED,
        dockNumber: 'C-02',
        detentionFee: 200,
        detentionPaid: true,
        remarks: '建材类',
        boundaryCheckPassed: true,
        boundaryCheckNote: '排队校验通过',
        createdAt: hoursAgo(11),
      }),
    );

    const releasedApt1 = this.appointmentRepository.create({
      appointmentNo: 'YY00000006',
      carrierId: carriers[0].id,
      carrier: carriers[0],
      plateNumber: '京A88888',
      driverName: '吴师傅',
      driverPhone: '13900139006',
      operationType: OperationType.UNLOAD,
      totalPackages: 100,
      handledPackages: 100,
      actualPackages: 100,
      scheduledTime: daysAgo(1),
      arrivedAt: minutesAgo(60 * 24 + 180),
      startedAt: minutesAgo(60 * 24 + 150),
      completedAt: minutesAgo(60 * 24 + 90),
      status: AppointmentStatus.RELEASED,
      dockNumber: 'A-01',
      detentionFee: 0,
      detentionPaid: true,
      standardDurationMinutes: 60,
      needsReview: false,
      remarks: '正常卸货，无罚金，验收通过',
      boundaryCheckPassed: true,
      boundaryCheckNote: '排队校验通过',
      createdAt: daysAgo(1),
    });
    appointments.push(releasedApt1);

    const releasedApt2 = this.appointmentRepository.create({
      appointmentNo: 'YY00000007',
      carrierId: carriers[1].id,
      carrier: carriers[1],
      plateNumber: '沪B99999',
      driverName: '郑师傅',
      driverPhone: '13900139007',
      operationType: OperationType.LOAD,
      totalPackages: 250,
      handledPackages: 250,
      actualPackages: 220,
      scheduledTime: daysAgo(1),
      arrivedAt: minutesAgo(60 * 24 + 300),
      startedAt: minutesAgo(60 * 24 + 270),
      completedAt: minutesAgo(60 * 24 + 170),
      status: AppointmentStatus.RELEASED,
      dockNumber: 'A-02',
      detentionFee: 40,
      detentionPaid: true,
      standardDurationMinutes: 60,
      needsReview: true,
      reviewNote: '实际装载件数少于预报，客户确认部分货物延迟发运',
      remarks: '超时40分钟，件数差异需复核',
      boundaryCheckPassed: true,
      boundaryCheckNote: '排队校验通过',
      createdAt: daysAgo(1),
    });
    appointments.push(releasedApt2);

    const releasedApt3 = this.appointmentRepository.create({
      appointmentNo: 'YY00000008',
      carrierId: carriers[2].id,
      carrier: carriers[2],
      plateNumber: '粤C55555',
      driverName: '冯师傅',
      driverPhone: '13900139008',
      operationType: OperationType.BOTH,
      totalPackages: 180,
      handledPackages: 180,
      actualPackages: 175,
      scheduledTime: hoursAgo(20),
      arrivedAt: minutesAgo(60 * 18 + 60),
      startedAt: minutesAgo(60 * 18 + 30),
      completedAt: minutesAgo(60 * 17),
      status: AppointmentStatus.RELEASED,
      dockNumber: 'B-01',
      detentionFee: 120,
      detentionPaid: true,
      standardDurationMinutes: 60,
      needsReview: false,
      remarks: '超时120分钟，装卸件数基本吻合',
      boundaryCheckPassed: true,
      boundaryCheckNote: '排队校验通过',
      createdAt: hoursAgo(25),
    });
    appointments.push(releasedApt3);

    const releasedApt4 = this.appointmentRepository.create({
      appointmentNo: 'YY00000009',
      carrierId: carriers[0].id,
      carrier: carriers[0],
      plateNumber: '京A66666',
      driverName: '何师傅',
      driverPhone: '13900139009',
      operationType: OperationType.UNLOAD,
      totalPackages: 90,
      handledPackages: 90,
      actualPackages: 108,
      scheduledTime: hoursAgo(15),
      arrivedAt: minutesAgo(60 * 14 + 45),
      startedAt: minutesAgo(60 * 14 + 20),
      completedAt: minutesAgo(60 * 13),
      status: AppointmentStatus.RELEASED,
      dockNumber: 'C-02',
      detentionFee: 180,
      detentionPaid: true,
      standardDurationMinutes: 60,
      needsReview: true,
      reviewNote: '卸货数量超出预报20%，疑似夹带货物，已登记',
      remarks: '严重超时，件数超量，需复核',
      boundaryCheckPassed: true,
      boundaryCheckNote: '排队校验通过',
      createdAt: hoursAgo(20),
    });
    appointments.push(releasedApt4);

    const releasedApt5 = this.appointmentRepository.create({
      appointmentNo: 'YY00000010',
      carrierId: carriers[1].id,
      carrier: carriers[1],
      plateNumber: '沪B77777',
      driverName: '韩师傅',
      driverPhone: '13900139010',
      operationType: OperationType.LOAD,
      totalPackages: 150,
      handledPackages: 150,
      actualPackages: 150,
      scheduledTime: daysAgo(2),
      arrivedAt: minutesAgo(60 * 48 + 120),
      startedAt: minutesAgo(60 * 48 + 90),
      completedAt: minutesAgo(60 * 48 + 30),
      status: AppointmentStatus.RELEASED,
      dockNumber: 'A-03',
      detentionFee: 0,
      detentionPaid: true,
      standardDurationMinutes: 60,
      needsReview: false,
      remarks: '标准作业，提前完成，无异常',
      boundaryCheckPassed: true,
      boundaryCheckNote: '排队校验通过',
      createdAt: daysAgo(2),
    });
    appointments.push(releasedApt5);

    const releasedApt6 = this.appointmentRepository.create({
      appointmentNo: 'YY00000011',
      carrierId: carriers[2].id,
      carrier: carriers[2],
      plateNumber: '粤C77777',
      driverName: '曹师傅',
      driverPhone: '13900139011',
      operationType: OperationType.UNLOAD,
      totalPackages: 400,
      handledPackages: 400,
      actualPackages: 380,
      scheduledTime: hoursAgo(10),
      arrivedAt: minutesAgo(60 * 8 + 90),
      startedAt: minutesAgo(60 * 8 + 60),
      completedAt: minutesAgo(60 * 6 + 30),
      status: AppointmentStatus.RELEASED,
      dockNumber: 'B-02',
      detentionFee: 330,
      detentionPaid: true,
      standardDurationMinutes: 60,
      needsReview: true,
      reviewNote: '破损20件，已拍照留证，承运商确认',
      remarks: '大额罚金，件数差异因破损',
      boundaryCheckPassed: true,
      boundaryCheckNote: '排队校验通过',
      createdAt: hoursAgo(12),
    });
    appointments.push(releasedApt6);

    const savedAppointments = await this.appointmentRepository.save(appointments);
    console.log('[Seed] 预约数据创建完成');

    const relList: Appointment[] = [
      savedAppointments.find((a) => a.appointmentNo === 'YY00000006')!,
      savedAppointments.find((a) => a.appointmentNo === 'YY00000007')!,
      savedAppointments.find((a) => a.appointmentNo === 'YY00000008')!,
      savedAppointments.find((a) => a.appointmentNo === 'YY00000009')!,
      savedAppointments.find((a) => a.appointmentNo === 'YY00000010')!,
      savedAppointments.find((a) => a.appointmentNo === 'YY00000011')!,
    ];

    await this.releaseRepository.save([
      this.releaseRepository.create({
        releaseNo: 'FX00000001',
        appointmentId: relList[0].id,
        plateNumber: relList[0].plateNumber,
        carrierName: carriers[0].name,
        dockNumber: relList[0].dockNumber,
        arrivedAt: relList[0].arrivedAt,
        startedAt: relList[0].startedAt,
        completedAt: relList[0].completedAt,
        totalPackages: relList[0].totalPackages,
        handledPackages: relList[0].handledPackages,
        actualPackages: relList[0].actualPackages,
        detentionFee: 0,
        detentionPaid: true,
        acceptanceConclusion: AcceptanceConclusion.PASSED,
        needsReview: false,
        releasedAt: minutesAgo(60 * 24 + 60),
        releasedBy: '张调度',
        remarks: '正常卸货，无罚金，验收通过',
      }),
      this.releaseRepository.create({
        releaseNo: 'FX00000002',
        appointmentId: relList[1].id,
        plateNumber: relList[1].plateNumber,
        carrierName: carriers[1].name,
        dockNumber: relList[1].dockNumber,
        arrivedAt: relList[1].arrivedAt,
        startedAt: relList[1].startedAt,
        completedAt: relList[1].completedAt,
        totalPackages: relList[1].totalPackages,
        handledPackages: relList[1].handledPackages,
        actualPackages: 220,
        detentionFee: 40,
        detentionPaid: true,
        acceptanceConclusion: AcceptanceConclusion.NEEDS_REVIEW,
        needsReview: true,
        reviewNote: '实际装载件数少于预报，客户确认部分货物延迟发运',
        releasedAt: minutesAgo(60 * 24 + 120),
        releasedBy: '李调度',
        remarks: '超时40分钟，件数差异需复核',
      }),
      this.releaseRepository.create({
        releaseNo: 'FX00000003',
        appointmentId: relList[2].id,
        plateNumber: relList[2].plateNumber,
        carrierName: carriers[2].name,
        dockNumber: relList[2].dockNumber,
        arrivedAt: relList[2].arrivedAt,
        startedAt: relList[2].startedAt,
        completedAt: relList[2].completedAt,
        totalPackages: relList[2].totalPackages,
        handledPackages: relList[2].handledPackages,
        actualPackages: 175,
        detentionFee: 120,
        detentionPaid: true,
        acceptanceConclusion: AcceptanceConclusion.PASSED,
        needsReview: false,
        releasedAt: minutesAgo(60 * 16 + 30),
        releasedBy: '王调度',
        remarks: '超时120分钟，装卸件数基本吻合',
      }),
      this.releaseRepository.create({
        releaseNo: 'FX00000004',
        appointmentId: relList[3].id,
        plateNumber: relList[3].plateNumber,
        carrierName: carriers[0].name,
        dockNumber: relList[3].dockNumber,
        arrivedAt: relList[3].arrivedAt,
        startedAt: relList[3].startedAt,
        completedAt: relList[3].completedAt,
        totalPackages: relList[3].totalPackages,
        handledPackages: relList[3].handledPackages,
        actualPackages: 108,
        detentionFee: 180,
        detentionPaid: true,
        acceptanceConclusion: AcceptanceConclusion.NEEDS_REVIEW,
        needsReview: true,
        reviewNote: '卸货数量超出预报20%，疑似夹带货物，已登记',
        releasedAt: minutesAgo(60 * 12 + 45),
        releasedBy: '张调度',
        remarks: '严重超时，件数超量，需复核',
      }),
      this.releaseRepository.create({
        releaseNo: 'FX00000005',
        appointmentId: relList[4].id,
        plateNumber: relList[4].plateNumber,
        carrierName: carriers[1].name,
        dockNumber: relList[4].dockNumber,
        arrivedAt: relList[4].arrivedAt,
        startedAt: relList[4].startedAt,
        completedAt: relList[4].completedAt,
        totalPackages: relList[4].totalPackages,
        handledPackages: relList[4].handledPackages,
        actualPackages: relList[4].actualPackages,
        detentionFee: 0,
        detentionPaid: true,
        acceptanceConclusion: AcceptanceConclusion.PASSED,
        needsReview: false,
        releasedAt: minutesAgo(60 * 47),
        releasedBy: '李调度',
        remarks: '标准作业，提前完成，无异常',
      }),
      this.releaseRepository.create({
        releaseNo: 'FX00000006',
        appointmentId: relList[5].id,
        plateNumber: relList[5].plateNumber,
        carrierName: carriers[2].name,
        dockNumber: relList[5].dockNumber,
        arrivedAt: relList[5].arrivedAt,
        startedAt: relList[5].startedAt,
        completedAt: relList[5].completedAt,
        totalPackages: relList[5].totalPackages,
        handledPackages: relList[5].handledPackages,
        actualPackages: 380,
        detentionFee: 330,
        detentionPaid: true,
        acceptanceConclusion: AcceptanceConclusion.NEEDS_REVIEW,
        needsReview: true,
        reviewNote: '破损20件，已拍照留证，承运商确认',
        releasedAt: minutesAgo(60 * 6),
        releasedBy: '王调度',
        remarks: '大额罚金，件数差异因破损',
      }),
    ]);
    console.log('[Seed] 放行记录创建完成（共6条，覆盖多场景）');
    console.log('[Seed] 种子数据初始化完成');
  }
}
