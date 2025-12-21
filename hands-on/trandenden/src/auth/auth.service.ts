import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}

   login(dto: AuthDto) {
        return 'User Logged In';
    }

    register(dto: AuthDto) {

        return 'User Registered';
    }
}
