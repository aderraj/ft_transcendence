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
exports.FriendRequestEntity = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const user_entity_1 = require("../../users/entities/user.entity");
class FriendRequestEntity {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, createdAt: { required: true, type: () => Date }, status: { required: true, type: () => String }, senderId: { required: true, type: () => String }, receiverId: { required: true, type: () => String }, sender: { required: false, type: () => require("../../users/entities/user.entity").UserEntity }, receiver: { required: false, type: () => require("../../users/entities/user.entity").UserEntity } };
    }
}
exports.FriendRequestEntity = FriendRequestEntity;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FriendRequestEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], FriendRequestEntity.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FriendRequestEntity.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FriendRequestEntity.prototype, "senderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FriendRequestEntity.prototype, "receiverId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: user_entity_1.UserEntity, required: false }),
    __metadata("design:type", user_entity_1.UserEntity)
], FriendRequestEntity.prototype, "sender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: user_entity_1.UserEntity, required: false }),
    __metadata("design:type", user_entity_1.UserEntity)
], FriendRequestEntity.prototype, "receiver", void 0);
//# sourceMappingURL=friend-request.entity.js.map