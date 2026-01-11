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
exports.PaginatedUsersResult = exports.UserEntity = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
class UserEntity {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, email: { required: true, type: () => String }, username: { required: true, type: () => String }, displayName: { required: true, type: () => String, nullable: true }, avatar: { required: true, type: () => String, nullable: true }, isOnline: { required: true, type: () => Boolean }, lastSeen: { required: true, type: () => Date }, level: { required: true, type: () => Number }, experience: { required: true, type: () => Number }, wins: { required: true, type: () => Number }, losses: { required: true, type: () => Number } };
    }
}
exports.UserEntity = UserEntity;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    __metadata("design:type", String)
], UserEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com' }),
    __metadata("design:type", String)
], UserEntity.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john_doe' }),
    __metadata("design:type", String)
], UserEntity.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe', nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "displayName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://host:port/uploads/avatars/avatar.jpg', nullable: true }),
    __metadata("design:type", String)
], UserEntity.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], UserEntity.prototype, "isOnline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-01-01T00:00:00.000Z' }),
    __metadata("design:type", Date)
], UserEntity.prototype, "lastSeen", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], UserEntity.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    __metadata("design:type", Number)
], UserEntity.prototype, "experience", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], UserEntity.prototype, "wins", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], UserEntity.prototype, "losses", void 0);
class PaginatedUsersResult {
    static _OPENAPI_METADATA_FACTORY() {
        return { users: { required: true, type: () => [require("./user.entity").UserEntity] }, total: { required: true, type: () => Number }, take: { required: true, type: () => Number }, skip: { required: true, type: () => Number } };
    }
}
exports.PaginatedUsersResult = PaginatedUsersResult;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [UserEntity] }),
    __metadata("design:type", Array)
], PaginatedUsersResult.prototype, "users", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaginatedUsersResult.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaginatedUsersResult.prototype, "take", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaginatedUsersResult.prototype, "skip", void 0);
//# sourceMappingURL=user.entity.js.map