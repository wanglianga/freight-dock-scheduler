import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarriersModule } from './carriers/carriers.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ReleasesModule } from './releases/releases.module';
import { SeedModule } from './seed/seed.module';
import { SeedService } from './seed/seed.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'freight_yard',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    CarriersModule,
    AppointmentsModule,
    ReleasesModule,
    SeedModule,
  ],
})
export class AppModule {
  constructor(private readonly seedService: SeedService) {
    setTimeout(() => {
      this.seedService.run().catch((err) => {
        console.error('[Seed] 初始化失败:', err.message);
      });
    }, 3000);
  }
}
