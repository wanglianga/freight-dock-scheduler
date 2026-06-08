import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ReleasesService } from './releases.service';
import { ReleaseRecord } from './release.entity';
import { CreateReleaseDto, ReleaseFilterDto } from './release.dto';

@Controller('api/releases')
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  findAll(@Query() filter?: any): Promise<ReleaseRecord[]> {
    const parsed: ReleaseFilterDto = {};
    if (filter?.plateNumber) parsed.plateNumber = String(filter.plateNumber);
    if (filter?.carrierName) parsed.carrierName = String(filter.carrierName);
    if (filter?.dockNumber) parsed.dockNumber = String(filter.dockNumber);
    if (filter?.startDate) parsed.startDate = String(filter.startDate);
    if (filter?.endDate) parsed.endDate = String(filter.endDate);
    if (filter?.minDetentionFee !== undefined && filter?.minDetentionFee !== '') {
      parsed.minDetentionFee = Number(filter.minDetentionFee);
    }
    if (filter?.maxDetentionFee !== undefined && filter?.maxDetentionFee !== '') {
      parsed.maxDetentionFee = Number(filter.maxDetentionFee);
    }
    if (filter?.acceptanceConclusion) {
      parsed.acceptanceConclusion = filter.acceptanceConclusion;
    }
    return this.releasesService.findAll(parsed);
  }

  @Get('export')
  async exportCsv(@Query() filter?: any, @Res() res?: Response): Promise<void> {
    const parsed: ReleaseFilterDto = {};
    if (filter?.plateNumber) parsed.plateNumber = String(filter.plateNumber);
    if (filter?.carrierName) parsed.carrierName = String(filter.carrierName);
    if (filter?.dockNumber) parsed.dockNumber = String(filter.dockNumber);
    if (filter?.startDate) parsed.startDate = String(filter.startDate);
    if (filter?.endDate) parsed.endDate = String(filter.endDate);
    if (filter?.minDetentionFee !== undefined && filter?.minDetentionFee !== '') {
      parsed.minDetentionFee = Number(filter.minDetentionFee);
    }
    if (filter?.maxDetentionFee !== undefined && filter?.maxDetentionFee !== '') {
      parsed.maxDetentionFee = Number(filter.maxDetentionFee);
    }
    if (filter?.acceptanceConclusion) {
      parsed.acceptanceConclusion = filter.acceptanceConclusion;
    }
    const csv = await this.releasesService.exportCsv(parsed);
    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="release-records-${timestamp}.csv"`,
    );
    res.send(csv);
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
