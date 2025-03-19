import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
//import axios from 'axios';

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

    // Visitantes únicos (basados en IP)
    const uniqueVisitors = await this.prisma.visit.groupBy({
      by: ['ipAddress'],
      _count: true,
      where,
    });

    // Duración promedio
    const avgDurationResult = await this.prisma.visit.aggregate({
      _avg: {
        duration: true,
      },
      where,
    });

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

    // Visitas por día
    const startDateForDaily =
      startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 días atrás por defecto
    const endDateForDaily = endDate || new Date();

    // Consulta para obtener visitas agrupadas por día
    const dailyVisits = await this.prisma.$queryRaw`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM visits
      WHERE timestamp >= ${startDateForDaily} AND timestamp <= ${endDateForDaily}
      GROUP BY DATE(timestamp)
      ORDER BY date
    `;

    return {
      totalVisits,
      uniqueVisitors: uniqueVisitors.length,
      avgDuration: avgDurationResult._avg.duration,
      visitsBySource: visitsBySource.map((item) => ({
        source: item.source || 'direct',
        count: item._count.id,
      })),
      visitsByCountry: visitsByCountry.map((item) => ({
        country: item.country || 'unknown',
        count: item._count.id,
      })),
      dailyVisits,
    };
  }

  async getQrCodeStats(startDate?: Date, endDate?: Date) {
    const where = {
      source: {
        startsWith: 'qr-',
      },
    };

    if (startDate || endDate) {
      where['timestamp'] = {};

      if (startDate) {
        where['timestamp']['gte'] = startDate;
      }

      if (endDate) {
        where['timestamp']['lte'] = endDate;
      }
    }

    // Visitas por códigos QR específicos
    const qrCodeVisits = await this.prisma.visit.groupBy({
      by: ['source'],
      _count: {
        id: true,
      },
      where,
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return {
      totalQrScans: qrCodeVisits.reduce(
        (total, item) => total + item._count.id,
        0,
      ),
      qrCodeVisits: qrCodeVisits.map((item) => ({
        code: item.source.replace('qr-', ''),
        source: item.source,
        count: item._count.id,
      })),
    };
  }

  private async getGeoInfo(ipAddress: string) {
    try {
      // Evitar hacer solicitudes para IPs locales/privadas
      if (
        ipAddress === '127.0.0.1' ||
        ipAddress === 'localhost' ||
        ipAddress.startsWith('192.168.') ||
        ipAddress.startsWith('10.') ||
        ipAddress.startsWith('172.')
      ) {
        return { country: 'Local', city: 'Development' };
      }

      // En una implementación real, usaríamos un servicio de geolocalización
      // como MaxMind GeoIP o ipstack. Esta es una implementación de ejemplo.

      // Ejemplo usando ipapi.co (servicio gratuito con límites)
      // const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
      // return {
      //   country: response.data.country_name,
      //   city: response.data.city,
      // };

      // Para evitar dependencias externas en desarrollo, devolvemos datos de ejemplo
      return { country: 'Peru', city: 'Lima' };
    } catch (error) {
      console.error('Error obtaining geo info:', error);
      return null;
    }
  }
}
