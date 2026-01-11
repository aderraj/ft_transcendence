"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendsModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const friends_service_1 = require("./friends.service");
const friends_controller_1 = require("./friends.controller");
const friends_gateway_1 = require("./friends.gateway");
const prisma_module_1 = require("../prisma/prisma.module");
let FriendsModule = class FriendsModule {
};
exports.FriendsModule = FriendsModule;
exports.FriendsModule = FriendsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: { expiresIn: '7d' },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [friends_controller_1.FriendsController],
        providers: [friends_service_1.FriendsService, friends_gateway_1.FriendsGateway],
        exports: [friends_service_1.FriendsService],
    })
], FriendsModule);
//# sourceMappingURL=friends.module.js.map