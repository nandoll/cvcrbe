import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  INestApplication,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('Prisma connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Prisma disconnected successfully');
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  // Método auxiliar para limpiar la base de datos (útil para pruebas)
  async cleanDatabase() {
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.NODE_ENV === 'development'
    ) {
      const transactions = [];

      // Añade aquí todas las entidades que necesitas limpiar
      if (this.user) transactions.push(this.user.deleteMany());
      // if (this.analytics) transactions.push(this.analytics.deleteMany()); --TODO: Revisar el schema de analytics
      // Añade más modelos según tu esquema

      return this.$transaction(transactions);
    }
  }
}
