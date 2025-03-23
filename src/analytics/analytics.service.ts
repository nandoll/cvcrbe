import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
//import axios from 'axios';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

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
    try {
      this.logger.log(
        `Getting stats - startDate: ${startDate}, endDate: ${endDate}`,
      );

      // Construir condición where con seguridad de tipo
      const where: any = {};

      if (startDate || endDate) {
        where.timestamp = {};

        if (startDate) {
          where.timestamp.gte = startDate;
          this.logger.debug(`Filter by start date: ${startDate}`);
        }

        if (endDate) {
          where.timestamp.lte = endDate;
          this.logger.debug(`Filter by end date: ${endDate}`);
        }
      }

      // Primero comprobemos si hay visitas en general
      const totalVisits = await this.prisma.visit.count();
      this.logger.debug(`Total visits (without filters): ${totalVisits}`);

      // Ahora con filtros
      const filteredTotalVisits = await this.prisma.visit.count({ where });
      this.logger.debug(`Filtered total visits: ${filteredTotalVisits}`);

      // Si no hay visitas filtradas, devolvemos una estructura vacía
      if (filteredTotalVisits === 0) {
        this.logger.warn('No visits found with the provided filters');
        return {
          totalVisits: 0,
          uniqueVisitors: 0,
          avgDuration: 0,
          visitsBySource: [],
          visitsByCountry: [],
          dailyVisits: [],
        };
      }

      // Visitantes únicos (basados en IP)
      const uniqueVisitors = await this.prisma.visit.groupBy({
        by: ['ipAddress'],
        _count: true,
        where,
      });

      // Duración promedio - con manejo de nulos
      const avgDurationResult = await this.prisma.visit.aggregate({
        _avg: {
          duration: true,
        },
        where,
      });

      // Asegurar que no sea null
      const avgDuration = avgDurationResult._avg.duration || 0;

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

      // Fechas para visitas diarias - con validación extra
      const startDateForDaily =
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDateForDaily = endDate || new Date();

      // Verificar que las fechas son válidas
      if (
        isNaN(startDateForDaily.getTime()) ||
        isNaN(endDateForDaily.getTime())
      ) {
        throw new Error('Invalid date format for daily visits query');
      }

      // Intento con query builder en lugar de raw SQL para mayor compatibilidad
      try {
        // Usar consulta más segura y compatible
        const dailyVisitsResult = await this.prisma.$queryRaw`
        SELECT
          DATE(timestamp) as date,
          COUNT(*) as count
        FROM visits
        WHERE timestamp >= ${startDateForDaily} AND timestamp <= ${endDateForDaily}
        GROUP BY DATE(timestamp)
        ORDER BY date
      `;

        this.logger.debug(
          `Daily visits query successful, results: ${
            Array.isArray(dailyVisitsResult)
              ? dailyVisitsResult.length
              : 'unknown'
          }`,
        );

        // Convertir BigInt a Number en los resultados
        const processedDailyVisits = Array.isArray(dailyVisitsResult)
          ? dailyVisitsResult.map((item) => ({
              date: item.date,
              // Convertir BigInt a Number
              count:
                typeof item.count === 'bigint'
                  ? Number(item.count)
                  : item.count,
            }))
          : [];

        return {
          totalVisits: filteredTotalVisits,
          uniqueVisitors: uniqueVisitors.length,
          avgDuration,
          visitsBySource: visitsBySource.map((item) => ({
            source: item.source || 'direct',
            count:
              typeof item._count.id === 'bigint'
                ? Number(item._count.id)
                : item._count.id,
          })),
          visitsByCountry: visitsByCountry.map((item) => ({
            country: item.country || 'unknown',
            count:
              typeof item._count.id === 'bigint'
                ? Number(item._count.id)
                : item._count.id,
          })),
          dailyVisits: processedDailyVisits,
        };
      } catch (sqlError) {
        this.logger.error(
          `Error in daily visits query: ${
            sqlError instanceof Error ? sqlError.message : String(sqlError)
          }`,
        );

        // Retornar todo excepto dailyVisits en caso de error SQL
        return {
          totalVisits: filteredTotalVisits,
          uniqueVisitors: uniqueVisitors.length,
          avgDuration,
          visitsBySource: visitsBySource.map((item) => ({
            source: item.source || 'direct',
            count: item._count.id,
          })),
          visitsByCountry: visitsByCountry.map((item) => ({
            country: item.country || 'unknown',
            count: item._count.id,
          })),
          dailyVisits: [],
        };
      }
    } catch (error: unknown) {
      this.logger.error(
        `Error fetching analytics stats: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
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
