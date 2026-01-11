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
exports.TwoFactorResponse = exports.Verify2FADto = exports.Enable2FADto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class Enable2FADto {
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: true, type: () => String, minLength: 6, maxLength: 6 } };
    }
}
exports.Enable2FADto = Enable2FADto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '6-digit verification code from authenticator app' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    __metadata("design:type", String)
], Enable2FADto.prototype, "code", void 0);
class Verify2FADto {
    static _OPENAPI_METADATA_FACTORY() {
        return { userId: { required: true, type: () => String }, code: { required: true, type: () => String, minLength: 6, maxLength: 6 } };
    }
}
exports.Verify2FADto = Verify2FADto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID from initial login' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], Verify2FADto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '6-digit 2FA code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(6, 6),
    __metadata("design:type", String)
], Verify2FADto.prototype, "code", void 0);
class TwoFactorResponse {
    static _OPENAPI_METADATA_FACTORY() {
        return { qrCode: { required: true, type: () => String }, secret: { required: true, type: () => String } };
    }
}
exports.TwoFactorResponse = TwoFactorResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'QR code data URL for authenticator app' }),
    __metadata("design:type", String)
], TwoFactorResponse.prototype, "qrCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Manual entry secret key' }),
    __metadata("design:type", String)
], TwoFactorResponse.prototype, "secret", void 0);
//# sourceMappingURL=2fa.dto.js.map