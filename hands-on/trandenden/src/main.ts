import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  
  // Global API prefix
  app.setGlobalPrefix('api');
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Transcendence API')
    .setDescription('Backend API for multiplayer Pong game with user management, friends, and chat')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication with JWT and 42 OAuth')
    .addTag('Users', 'User profile management')
    .addTag('Friends', 'Friend requests and friendships')
    .addTag('Chat', 'Real-time chat between friends')
    .addTag('Game', 'Pong game and matchmaking')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Application running on: http://localhost:${process.env.PORT ?? 3001}`);
  console.log(`📚 Swagger documentation: http://localhost:${process.env.PORT ?? 3001}/api`);
}
bootstrap();
