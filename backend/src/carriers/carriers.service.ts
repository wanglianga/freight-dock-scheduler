import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Carrier } from './carrier.entity';
import { CreateCarrierDto, UpdateCarrierDto } from './carrier.dto';

@Injectable()
export class CarriersService {
  constructor(
    @InjectRepository(Carrier)
    private readonly carrierRepository: Repository<Carrier>,
  ) {}

  async findAll(): Promise<Carrier[]> {
    return this.carrierRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Carrier> {
    const carrier = await this.carrierRepository.findOne({ where: { id } });
    if (!carrier) {
      throw new NotFoundException(`承运商 ID ${id} 不存在`);
    }
    return carrier;
  }

  async create(dto: CreateCarrierDto): Promise<Carrier> {
    const carrier = this.carrierRepository.create(dto);
    return this.carrierRepository.save(carrier);
  }

  async update(id: number, dto: UpdateCarrierDto): Promise<Carrier> {
    await this.findOne(id);
    await this.carrierRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.carrierRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`承运商 ID ${id} 不存在`);
    }
  }
}
