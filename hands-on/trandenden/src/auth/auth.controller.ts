import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto } from "./dto";



@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    register(@Body() dto: AuthDto) {
        this.authService.register(dto);
    }

    @Post('login')
    login(@Body() dto: AuthDto) {
        this.authService.login(dto);
        return 'User logged in';
    }

}