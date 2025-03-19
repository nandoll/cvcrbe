import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CvModule } from './cv/cv.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

// Validación de variables de entorno
import * as Joi from 'joi';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true, // Hace que la configuración sea global
      envFilePath: ['.env.local', '.env'], // Archivos de configuración en orden de prioridad
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('1d'),
        CORS_ENABLED: Joi.boolean().default(true),
        CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
      }),
    }),

    // Limitador de peticiones para prevenir ataques de fuerza bruta
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('THROTTLE_TTL', 60), // Tiempo de vida en segundos
        limit: config.get<number>('THROTTLE_LIMIT', 10), // Número de peticiones permitidas en ese tiempo
      }),
    }),

    // Programación de tareas
    ScheduleModule.forRoot(),

    // Servir archivos estáticos (opcional)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api*'],
    }),

    // Módulos de la aplicación
    PrismaModule,
    AuthModule,
    UsersModule,
    CvModule,
    AnalyticsModule,
  ],
  providers: [
    // Guardias globales
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
