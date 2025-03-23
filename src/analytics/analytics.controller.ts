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
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private prismaService: PrismaService,
  ) {}

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
  async getStats(@Query() queryStatsDto: QueryStatsDto) {
    try {
      // Mejor manejo de conversión de fechas
      let startDate: Date | undefined = undefined;
      let endDate: Date | undefined = undefined;

      if (queryStatsDto.startDate) {
        startDate = new Date(queryStatsDto.startDate);
        // Asegurar que inicie al principio del día
        startDate.setHours(0, 0, 0, 0);

        // Validar la fecha
        if (isNaN(startDate.getTime())) {
          throw new Error(
            `Invalid start date format: ${queryStatsDto.startDate}`,
          );
        }
      }

      if (queryStatsDto.endDate) {
        endDate = new Date(queryStatsDto.endDate);
        // Asegurar que termine al final del día
        endDate.setHours(23, 59, 59, 999);

        // Validar la fecha
        if (isNaN(endDate.getTime())) {
          throw new Error(`Invalid end date format: ${queryStatsDto.endDate}`);
        }
      }

      // Si no se proporciona rango, usar el último mes
      if (!startDate && !endDate) {
        endDate = new Date();
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
      }

      console.log(`Getting stats from ${startDate} to ${endDate}`);

      return this.analyticsService.getVisitStats(startDate, endDate);
    } catch (error: unknown) {
      console.error(
        'Error in getStats:',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
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

  // Añadir este endpoint para debugging
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('debug')
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Debug endpoint for visit statistics' })
  async debugStats() {
    try {
      // Contar todas las visitas sin filtro
      const totalVisits = await this.prismaService.visit.count();

      // Obtener 5 visitas más recientes para inspección
      const recentVisits = await this.prismaService.visit.findMany({
        take: 5,
        orderBy: {
          timestamp: 'desc',
        },
      });

      // Contar visitas del último mes
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

      const lastMonthVisits = await this.prismaService.visit.count({
        where: {
          timestamp: {
            gte: lastMonthDate,
          },
        },
      });

      return {
        totalVisits,
        lastMonthVisits,
        recentVisits,
        serverTime: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        stack:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.stack
            : undefined,
      };
    }
  }
}
