import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseRecord } from './release.entity';
import { Appointment } from '../appointments/appointment.entity';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReleaseRecord, Appointment])],
  providers: [ReleasesService],
  controllers: [ReleasesController],
  exports: [ReleasesService],
})
export class ReleasesModule {}
