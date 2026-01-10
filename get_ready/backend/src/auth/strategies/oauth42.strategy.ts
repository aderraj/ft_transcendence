import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-42';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OAuth42Strategy extends PassportStrategy(Strategy, '42') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('OAUTH_42_CLIENT_ID'),
      clientSecret: configService.get<string>('OAUTH_42_CLIENT_SECRET'),
      callbackURL: configService.get<string>('OAUTH_42_CALLBACK_URL'),
      scope: ['public'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any,
  ): Promise<any> {
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
