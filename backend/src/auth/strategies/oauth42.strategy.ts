import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-42';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OAuth42Strategy extends PassportStrategy(Strategy, '42') {
  private isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('OAUTH_42_CLIENT_ID');
    const clientSecret = configService.get<string>('OAUTH_42_CLIENT_SECRET');
    const callbackURL = configService.get<string>('OAUTH_42_CALLBACK_URL');
    const hasCredentials = !!(clientID?.trim() && clientSecret?.trim());

    super({
      clientID: hasCredentials ? clientID : 'dummy_client_id_42',
      clientSecret: hasCredentials ? clientSecret : 'dummy_client_secret_42',
      callbackURL: callbackURL || 'http://localhost:3001/api/auth/42/callback',
      scope: ['public'],
    });

    this.isEnabled = hasCredentials;

    if (!hasCredentials) {
      console.warn(
        '[OAuth42Strategy] ⚠️  42 OAuth credentials not configured - OAuth 42 authentication will be disabled',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any,
  ): Promise<any> {
    if (!this.isEnabled) {
      return done(new Error('42 OAuth is not configured'));
    }

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
}
