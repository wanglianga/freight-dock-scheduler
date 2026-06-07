import { IsInt, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateReleaseDto {
  @IsInt()
  @IsNotEmpty()
  appointmentId: number;

  @IsString()
  @IsOptional()
  releasedBy?: string;

  @IsNumber()
  @IsOptional()
  detentionFee?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class ReleaseFilterDto {
  @IsOptional()
  @IsString()
  plateNumber?: string;

  @IsOptional()
  @IsString()
  carrierName?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
