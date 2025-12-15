import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';
import { RequestLoggerInterceptor } from './logger/request-logger.interceptor';
import * as fs from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('/etc/ssl/private/backend.key'),
    cert: fs.readFileSync('/etc/ssl/certs/backend.crt'),
  };

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    httpsOptions,
  });

  // Use custom logger for all NestJS logging
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Log all API requests
  app.useGlobalInterceptors(new RequestLoggerInterceptor(logger));
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.setGlobalPrefix('api');
  
  await app.listen(3000);
  logger.log('Pong Backend running on port 3000', 'Bootstrap');
}

bootstrap();
