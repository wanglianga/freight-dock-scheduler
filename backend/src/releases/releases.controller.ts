import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { ReleaseRecord } from './release.entity';
import { CreateReleaseDto, ReleaseFilterDto } from './release.dto';

@Controller('api/releases')
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  findAll(@Query() filter?: ReleaseFilterDto): Promise<ReleaseRecord[]> {
    return this.releasesService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ReleaseRecord> {
    return this.releasesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateReleaseDto): Promise<ReleaseRecord> {
    return this.releasesService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.releasesService.remove(id);
  }
}
