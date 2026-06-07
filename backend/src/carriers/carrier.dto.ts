import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCarrierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  contactPerson: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCarrierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
