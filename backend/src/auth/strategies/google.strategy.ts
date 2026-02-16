import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');
    const hasCredentials = !!(clientID?.trim() && clientSecret?.trim());

    super({
      clientID: clientID?.trim() || 'dummy_client_id_google',
      clientSecret: clientSecret?.trim() || 'dummy_client_secret_google',
      callbackURL:
        callbackURL ||
        'http://localhost:3001/api/auth/google/callback',
      scope: ['email', 'profile'],
    });

    this.isEnabled = hasCredentials;

    if (!hasCredentials) {
      console.warn(
        '[GoogleStrategy] ⚠️  Google OAuth credentials not configured - Google authentication will be disabled',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    if (!this.isEnabled) {
      return done(new Error('Google OAuth is not configured'));
    }

    const { id, emails, displayName, photos } = profile;
    
    const user = {
      googleId: id,
      email: emails[0].value,
      displayName: displayName,
      avatar: photos[0]?.value,
    };

    done(null, user);
  }
}
