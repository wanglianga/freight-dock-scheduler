import { IsInt, IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { AcceptanceConclusion } from './release.entity';

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
  dockNumber?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  minDetentionFee?: number;

  @IsOptional()
  @IsNumber()
  maxDetentionFee?: number;

  @IsOptional()
  @IsEnum(AcceptanceConclusion)
  acceptanceConclusion?: AcceptanceConclusion;
}
