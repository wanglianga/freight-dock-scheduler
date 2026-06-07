import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CarriersService } from './carriers.service';
import { Carrier } from './carrier.entity';
import { CreateCarrierDto, UpdateCarrierDto } from './carrier.dto';

@Controller('api/carriers')
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Get()
  findAll(): Promise<Carrier[]> {
    return this.carriersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Carrier> {
    return this.carriersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCarrierDto): Promise<Carrier> {
    return this.carriersService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCarrierDto,
  ): Promise<Carrier> {
    return this.carriersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.carriersService.remove(id);
  }
}
