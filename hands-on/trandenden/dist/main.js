"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    await app.listen(process.env.PORT ?? 3001);
    console.log(`🚀 Application running on: http://localhost:${process.env.PORT ?? 3001}`);
    console.log(`📚 Swagger documentation: http://localhost:${process.env.PORT ?? 3001}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map