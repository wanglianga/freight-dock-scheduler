import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsDateString, IsBoolean, IsNumber } from 'class-validator';
import { AppointmentStatus, OperationType } from './appointment.entity';

export class CreateAppointmentDto {
  @IsInt()
  @IsNotEmpty()
  carrierId: number;

  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @IsString()
  @IsNotEmpty()
  driverName: string;

  @IsString()
  @IsNotEmpty()
  driverPhone: string;

  @IsEnum(OperationType)
  @IsOptional()
  operationType?: OperationType;

  @IsInt()
  @IsOptional()
  totalPackages?: number;

  @IsDateString()
  @IsOptional()
  scheduledTime?: string;

  @IsString()
  @IsOptional()
  dockNumber?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateAppointmentDto {
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @IsInt()
  @IsOptional()
  handledPackages?: number;

  @IsBoolean()
  @IsOptional()
  boundaryCheckPassed?: boolean;

  @IsString()
  @IsOptional()
  boundaryCheckNote?: string;

  @IsNumber()
  @IsOptional()
  detentionFee?: number;

  @IsString()
  @IsOptional()
  dockNumber?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class HandlePackagesDto {
  @IsInt()
  @IsNotEmpty()
  packages: number;
}
