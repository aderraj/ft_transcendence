import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const httpsOptions = process.env.USE_HTTPS === 'true' ? {
    key: fs.readFileSync('/app/ssl/key.pem'),
    cert: fs.readFileSync('/app/ssl/cert.pem'),
  } : undefined;

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { httpsOptions });

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

  // Add default origins if none specified
  if (allowedOrigins.length === 0) {
    allowedOrigins.push(
      'http://localhost:3000',
      'https://localhost:3000',
      'http://localhost:5173',
    );
  }

  // Always allow localhost ports for development
  const localhostPorts = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173',
    'https://localhost:3000',
    'https://localhost:3001'
  ];
  localhostPorts.forEach(port => {
    if (!allowedOrigins.includes(port)) {
      allowedOrigins.push(port);
    }
  });

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        // Only log actual origins, not undefined (from curl/Postman/etc)
        if (origin) {
          console.log(`CORS allowed origin: ${origin}`);
        }
        callback(null, true);
      } else {
        console.log(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  console.log('✅ Allowed CORS origins:', allowedOrigins);

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
  console.log(`🚀 Application running on: ${protocol}://localhost:${port}/api`);
  console.log(`📄 Swagger documentation: ${protocol}://localhost:${port}/api/docs`);
}
bootstrap();
