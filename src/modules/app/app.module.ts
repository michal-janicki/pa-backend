import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiKeyMiddleware } from '../../middleware/api-key.middleware';
import { ContentModule } from '../content/content.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, }), ContentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes('*');
  }
}
