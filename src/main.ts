import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AUTH_ORIGIN } from './auth/auth.config.js';
import { AuthOriginMiddleware } from './auth/auth-origin.middleware.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: AUTH_ORIGIN,
    credentials: true,
  });
  app.use(cookieParser());
  const originMiddleware = new AuthOriginMiddleware();
  app.use(originMiddleware.use.bind(originMiddleware));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 5000);
}
await bootstrap();
