import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Validate session token to ensure single active session
    if (payload.sessionToken) {
      const isValidSession = await this.authService.validateSession(
        payload.sub,
        payload.sessionToken,
      );
      
      if (!isValidSession) {
        throw new UnauthorizedException('Session expired or invalidated. Please login again.');
      }
    }

    return { 
      sub: payload.sub, 
      email: payload.email, 
      username: payload.username,
      sessionToken: payload.sessionToken,
    };
  }
}
