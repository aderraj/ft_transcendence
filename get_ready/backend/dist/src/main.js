"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const fs = require("fs");
const path = require("path");
async function bootstrap() {
    const httpsOptions = process.env.USE_HTTPS === 'true' ? {
        key: fs.readFileSync('/app/ssl/key.pem'),
        cert: fs.readFileSync('/app/ssl/cert.pem'),
    } : undefined;
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { httpsOptions });
    app.useStaticAssets(path.join(process.cwd(), 'uploads', 'avatars'), {
        prefix: '/uploads/avatars',
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || '';
    const allowedOrigins = allowedOriginsEnv
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0);
    if (allowedOrigins.length === 0) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const hostIp = process.env.HOST_IP || 'localhost';
        allowedOrigins.push(frontendUrl, `http://${hostIp}:3000`, `https://${hostIp}:3000`, 'http://localhost:3000', 'https://localhost:3000');
    }
    if (!allowedOrigins.includes('http://10.14.5.32:3000')) {
        allowedOrigins.push('http://10.14.5.32:3000');
    }
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                console.warn(`CORS blocked origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    });
    console.log('✅ Allowed CORS origins:', allowedOrigins);
    const config = new swagger_1.DocumentBuilder()
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT || 3000;
    const protocol = process.env.USE_HTTPS === 'true' ? 'https' : 'http';
    await app.listen(port);
    console.log(`🚀 Application running on: ${protocol}://localhost:${port}/api`);
    console.log(`📄 Swagger documentation: ${protocol}://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map