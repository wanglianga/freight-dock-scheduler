import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrier } from './carrier.entity';
import { CarriersService } from './carriers.service';
import { CarriersController } from './carriers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Carrier])],
  providers: [CarriersService],
  controllers: [CarriersController],
  exports: [CarriersService],
})
export class CarriersModule {}
