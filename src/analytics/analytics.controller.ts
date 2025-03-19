import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { QueryStatsDto } from './dto/query-stats.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('track')
  @ApiOperation({ summary: 'Track a new visit to the CV' })
  trackVisit(@Body() createVisitDto: CreateVisitDto, @Req() req: Request) {
    // Obtener IP del cliente
    const ipAddress =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      'unknown';

    return this.analyticsService.createVisit(
      createVisitDto,
      typeof ipAddress === 'string' ? ipAddress : ipAddress[0],
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('stats')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get visit statistics (admin only)' })
  getStats(@Query() queryStatsDto: QueryStatsDto) {
    return this.analyticsService.getVisitStats(
      queryStatsDto.startDate ? new Date(queryStatsDto.startDate) : undefined,
      queryStatsDto.endDate ? new Date(queryStatsDto.endDate) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('qr-stats')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get QR code statistics (admin only)' })
  getQrStats(@Query() queryStatsDto: QueryStatsDto) {
    return this.analyticsService.getQrCodeStats(
      queryStatsDto.startDate ? new Date(queryStatsDto.startDate) : undefined,
      queryStatsDto.endDate ? new Date(queryStatsDto.endDate) : undefined,
    );
  }
}
