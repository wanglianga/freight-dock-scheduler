import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrier } from '../carriers/carrier.entity';
import { Appointment, AppointmentStatus, OperationType } from '../appointments/appointment.entity';
import { ReleaseRecord } from '../releases/release.entity';

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
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);

    const appointments = await this.appointmentRepository.save([
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
        scheduledTime: hoursAgo(1),
        status: AppointmentStatus.PENDING,
        dockNumber: null,
        detentionFee: 0,
        remarks: '电子产品，轻拿轻放',
        boundaryCheckPassed: false,
        boundaryCheckNote: null,
      }),
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
        scheduledTime: hoursAgo(2),
        status: AppointmentStatus.QUEUED,
        dockNumber: 'A-03',
        detentionFee: 0,
        remarks: '百货用品',
        boundaryCheckPassed: true,
        boundaryCheckNote: '排队校验通过',
        createdAt: hoursAgo(3),
      }),
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
        scheduledTime: hoursAgo(4),
        arrivedAt: hoursAgo(3),
        startedAt: hoursAgo(2),
        status: AppointmentStatus.LOADING,
        dockNumber: 'B-01',
        detentionFee: 50,
        remarks: '生鲜食品，需冷链',
        boundaryCheckPassed: true,
        boundaryCheckNote: '排队校验通过',
        createdAt: hoursAgo(5),
      }),
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
        scheduledTime: hoursAgo(6),
        arrivedAt: hoursAgo(5),
        startedAt: hoursAgo(4),
        completedAt: hoursAgo(1),
        status: AppointmentStatus.COMPLETED,
        dockNumber: 'A-01',
        detentionFee: 100,
        remarks: '先卸后装',
        boundaryCheckPassed: true,
        boundaryCheckNote: '排队校验通过',
        createdAt: hoursAgo(7),
      }),
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
        scheduledTime: hoursAgo(10),
        arrivedAt: hoursAgo(9),
        startedAt: hoursAgo(8),
        completedAt: hoursAgo(6),
        status: AppointmentStatus.COMPLETED,
        dockNumber: 'C-02',
        detentionFee: 200,
        remarks: '建材类',
        boundaryCheckPassed: true,
        boundaryCheckNote: '排队校验通过',
        createdAt: hoursAgo(11),
      }),
    ]);
    console.log('[Seed] 预约数据创建完成');

    const apt4 = appointments[3];
    const apt5 = appointments[4];
    apt4.status = AppointmentStatus.RELEASED;
    apt5.status = AppointmentStatus.RELEASED;
    await this.appointmentRepository.save([apt4, apt5]);

    await this.releaseRepository.save([
      this.releaseRepository.create({
        releaseNo: 'FX00000001',
        appointmentId: apt4.id,
        plateNumber: apt4.plateNumber,
        carrierName: carriers[0].name,
        totalPackages: apt4.totalPackages,
        handledPackages: apt4.handledPackages,
        detentionFee: 100,
        releasedAt: hoursAgo(0.5),
        releasedBy: '张调度',
        remarks: '正常放行，滞留费已结算',
      }),
      this.releaseRepository.create({
        releaseNo: 'FX00000002',
        appointmentId: apt5.id,
        plateNumber: apt5.plateNumber,
        carrierName: carriers[1].name,
        totalPackages: apt5.totalPackages,
        handledPackages: apt5.handledPackages,
        detentionFee: 200,
        releasedAt: hoursAgo(5),
        releasedBy: '李调度',
        remarks: '建材卸货完成',
      }),
    ]);
    console.log('[Seed] 放行记录创建完成');
    console.log('[Seed] 种子数据初始化完成');
  }
}
