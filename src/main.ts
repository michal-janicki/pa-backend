import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    // whitelist: true,
    forbidNonWhitelisted: true,
    skipMissingProperties: false,
    validationError: { target: false },
  }));

  await app.listen(3000);
}
bootstrap();
