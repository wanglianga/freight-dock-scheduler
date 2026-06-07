import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { CreateAppointmentDto, UpdateAppointmentDto, HandlePackagesDto } from './appointment.dto';

@Controller('api/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(@Query('status') status?: AppointmentStatus): Promise<Appointment[]> {
    return this.appointmentsService.findAll(status);
  }

  @Get('pending')
  findPending(): Promise<Appointment[]> {
    return this.appointmentsService.findPending();
  }

  @Get('processing')
  findProcessing(): Promise<Appointment[]> {
    return this.appointmentsService.findProcessing();
  }

  @Get('released')
  findReleased(): Promise<Appointment[]> {
    return this.appointmentsService.findReleased();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Appointment> {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto): Promise<Appointment> {
    return this.appointmentsService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return this.appointmentsService.update(id, dto);
  }

  @Post(':id/queue-check')
  queueCheck(@Param('id', ParseIntPipe) id: number): Promise<{ passed: boolean; note: string }> {
    return this.appointmentsService.queueCheck(id);
  }

  @Post(':id/handle-packages')
  handlePackages(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: HandlePackagesDto,
  ): Promise<Appointment> {
    return this.appointmentsService.handlePackages(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.appointmentsService.remove(id);
  }
}
