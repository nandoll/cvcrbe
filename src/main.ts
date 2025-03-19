import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Habilitar CORS
  if (configService.get<boolean>('CORS_ENABLED', true)) {
    app.enableCors({
      origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
  }

  // Configuración de seguridad con Helmet
  app.use(helmet());

  // Prefijo global de API
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Configuración de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no esperadas
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no esperadas
      transform: true, // Transforma automáticamente según los DTO
      transformOptions: {
        enableImplicitConversion: true, // Permite conversiones implícitas de tipos
      },
    }),
  );

  // Configuración de Swagger para documentación de API
  const config = new DocumentBuilder()
    .setTitle('CV Web API')
    .setDescription('API para el CV web interactivo de Fernando Antezana')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'jwt',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  // Asegurar que Prisma se cierre correctamente
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Iniciar servidor
  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
