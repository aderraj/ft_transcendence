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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FortyTwoStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_42_1 = __importDefault(require("passport-42"));
let FortyTwoStrategy = class FortyTwoStrategy extends (0, passport_1.PassportStrategy)(passport_42_1.default, '42') {
    constructor() {
        super({
            clientID: process.env.OAUTH_42_CLIENT_ID,
            clientSecret: process.env.OAUTH_42_CLIENT_SECRET,
            callbackURL: process.env.OAUTH_42_CALLBACK_URL || 'http://localhost:3001/api/auth/42/callback',
            scope: ['public'],
        });
    }
    async validate(accessToken, refreshToken, profile, done) {
        const { id, username, emails, photos } = profile;
        const user = {
            intraId: id,
            username: username,
            email: emails && emails.length > 0 ? emails[0].value : `${username}@student.42.fr`,
            profilePic: photos && photos.length > 0 ? photos[0].value : '/images/default-avatar.png',
        };
        done(null, user);
    }
};
exports.FortyTwoStrategy = FortyTwoStrategy;
exports.FortyTwoStrategy = FortyTwoStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FortyTwoStrategy);
//# sourceMappingURL=fortytwo.strategy.js.map