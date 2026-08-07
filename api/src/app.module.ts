import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ProductsModule } from './products/products.module';
import { MockupModule } from './mockup/mockup.module';
import { MockupsModule } from './mockups/mockups.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { BatchModule } from './batch/batch.module';
import { AuthModule } from './auth/auth.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'admin', 'dist'),
      exclude: ['/api/{*path}'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
    }),
    ProductsModule,
    MockupModule,
    MockupsModule,
    SettingsModule,
    UsersModule,
    BatchModule,
    AuthModule,
    StoreModule,
  ],
})
export class AppModule {}
