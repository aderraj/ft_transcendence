import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // HTTPS is optional - when behind reverse proxy (WAF), SSL termination happens there
  let httpsOptions = undefined;
  if (process.env.USE_HTTPS === 'true') {
    try {
      httpsOptions = {
        key: fs.readFileSync('/app/ssl/key.pem'),
        cert: fs.readFileSync('/app/ssl/cert.pem'),
      };
      ;
    } catch (err) {
      console.warn('⚠️  SSL certificates not found, falling back to HTTP');
    }
  } else {
    ;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { httpsOptions });

  // Trust proxy headers from reverse proxy (WAF)
  app.set('trust proxy', true);

  // Serve avatar files BEFORE setting global prefix - this is outside the /api prefix
  app.useStaticAssets(path.join(process.cwd(), 'uploads', 'avatars'), {
    prefix: '/uploads/avatars',
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS Configuration - Parse allowed origins from environment variable
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsEnv
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

  // Add default origins if none specified (allow reverse proxy origins)
  if (allowedOrigins.length === 0) {
    allowedOrigins.push(
      'https://localhost',
      'http://localhost',
    );
  }

  // Always allow common development origins
  const defaultOrigins = [
    'https://localhost',
    'http://localhost',
    'http://frontend:80',  // Internal frontend container
  ];
  defaultOrigins.forEach(origin => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        // Only log actual origins, not undefined (from curl/Postman/etc)
        if (origin) {
          ;
        }
        callback(null, true);
      } else {
        // Log blocked origin but don't throw - just reject silently
        // This prevents flooding logs with exception stack traces
        console.warn(`CORS blocked origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
  });

  ;

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Transcendence API')
    .setDescription('Multiplayer Pong Game API with user management, friends, chat, and game matchmaking')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication - Login, Register, OAuth, 2FA')
    .addTag('users', 'User management - Profile, avatar, settings')
    .addTag('friends', 'Friends system - Requests, online status')
    .addTag('chat', 'Real-time messaging between friends')
    .addTag('leaderboard', 'Rankings and game statistics')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  const protocol = process.env.USE_HTTPS === 'true' ? 'https' : 'http';
  await app.listen(port);
  ;
  ;
}
bootstrap();
