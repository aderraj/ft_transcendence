import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; // Added import
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // HTTPS options (if SSL certificates exist)
  const httpsOptions = process.env.USE_HTTPS === 'true' ? {
    key: fs.readFileSync('/app/ssl/key.pem'),
    cert: fs.readFileSync('/app/ssl/cert.pem'),
  } : undefined;

  // Use NestExpressApplication
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { httpsOptions });

  // Serve static assets from uploads/avatars to /uploads/avatar
  app.useStaticAssets(path.join(process.cwd(), 'uploads', 'avatars'), {
    prefix: '/uploads/avatar',
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const useHttps = process.env.USE_HTTPS === 'true';
  const protocol = useHttps ? 'https' : 'http';
  const hostIp = process.env.HOST_IP || 'localhost';

  // Allow multiple origins for development
  const allowedOrigins = [
    frontendUrl,
    `http://${hostIp}:3000`,
    `https://${hostIp}:3000`,
    `https://${hostIp}.nip.io:3000`,
    `https://${hostIp}.nip.io:3001`,
    `https://${hostIp}.nip.io:5173`,
    'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:5173',
    'https://localhost:5173',
    'http://10.14.1.9:5173'
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Debugging logs
  console.log('--- Configuration Check ---');
  console.log(`USE_HTTPS: ${process.env.USE_HTTPS}`);
  console.log(`GOOGLE_CALLBACK_URL: ${process.env.GOOGLE_CALLBACK_URL}`);
  console.log(`Protocol: ${protocol}`);
  console.log('---------------------------');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Transcendence API')
    .setDescription('Multiplayer Pong Game API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('friends', 'Friends system')
    .addTag('chat', 'Chat and messaging')
    .addTag('game', 'Game and matchmaking')
    .addTag('leaderboard', 'Rankings and stats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application running on: ${protocol}://localhost:${port}/api`);
  console.log(`📄 Swagger documentation: ${protocol}://localhost:${port}/api/docs`);
}
bootstrap();
