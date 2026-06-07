import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrier } from '../carriers/carrier.entity';
import { Appointment } from '../appointments/appointment.entity';
import { ReleaseRecord } from '../releases/release.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Carrier, Appointment, ReleaseRecord])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
