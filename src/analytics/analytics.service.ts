import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async createVisit(createVisitDto: CreateVisitDto, ipAddress: string) {
    // Obtener localización en base a IP (implementación simplificada)
    const geoInfo = await this.getGeoInfo(ipAddress);

    return this.prisma.visit.create({
      data: {
        source: createVisitDto.source,
        timestamp: new Date(createVisitDto.timestamp),
        userAgent: createVisitDto.userAgent,
        language: createVisitDto.language,
        ipAddress,
        country: geoInfo?.country,
        city: geoInfo?.city,
        referrer: createVisitDto.referrer,
      },
    });
  }

  async getVisitStats(startDate?: Date, endDate?: Date) {
    const where = {};

    if (startDate || endDate) {
      where['timestamp'] = {};

      if (startDate) {
        where['timestamp']['gte'] = startDate;
      }

      if (endDate) {
        where['timestamp']['lte'] = endDate;
      }
    }

    // Total de visitas
    const totalVisits = await this.prisma.visit.count({ where });

    // Visitas por fuente
    const visitsBySource = await this.prisma.visit.groupBy({
      by: ['source'],
      _count: {
        id: true,
      },
      where,
    });

    // Visitas por país
    const visitsByCountry = await this.prisma.visit.groupBy({
      by: ['country'],
      _count: {
        id: true,
      },
      where,
    });

    return {
      totalVisits,
      visitsBySource: visitsBySource.map((item) => ({
        source: item.source || 'direct',
        count: item._count.id,
      })),
      visitsByCountry: visitsByCountry.map((item) => ({
        country: item.country || 'unknown',
        count: item._count.id,
      })),
    };
  }

  private async getGeoInfo(ipAddress: string) {
    try {
      // En una implementación real, se usaría un servicio de geolocalización
      // como MaxMind GeoIP o ipstack
      return { country: 'Peru', city: 'Lima' };
    } catch (error) {
      return null;
    }
  }
}
