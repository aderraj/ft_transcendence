"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuth42Strategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_42_1 = require("passport-42");
const config_1 = require("@nestjs/config");
let OAuth42Strategy = class OAuth42Strategy extends (0, passport_1.PassportStrategy)(passport_42_1.Strategy, '42') {
    constructor(configService) {
        super({
            clientID: configService.get('OAUTH_42_CLIENT_ID'),
            clientSecret: configService.get('OAUTH_42_CLIENT_SECRET'),
            callbackURL: configService.get('OAUTH_42_CALLBACK_URL'),
            scope: ['public'],
        });
        this.configService = configService;
    }
    async validate(accessToken, refreshToken, profile, done) {
        const { id, username, emails, displayName, photos } = profile;
        const user = {
            intraId: id,
            email: emails && emails.length > 0 ? emails[0].value : null,
            username: username,
            displayName: displayName,
            avatar: photos && photos.length > 0 ? photos[0].value : null,
        };
        done(null, user);
    }
};
exports.OAuth42Strategy = OAuth42Strategy;
exports.OAuth42Strategy = OAuth42Strategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OAuth42Strategy);
//# sourceMappingURL=oauth42.strategy.js.map