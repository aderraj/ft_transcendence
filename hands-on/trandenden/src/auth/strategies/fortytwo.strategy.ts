import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Strategy from 'passport-42';

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy, '42') {
  constructor() {
    super({
      clientID: process.env.OAUTH_42_CLIENT_ID,
      clientSecret: process.env.OAUTH_42_CLIENT_SECRET,
      callbackURL: process.env.OAUTH_42_CALLBACK_URL || 'http://localhost:3001/api/auth/42/callback',
      scope: ['public'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, username, emails, photos } = profile;
    
    const user = {
      intraId: id,
      username: username,
      email: emails && emails.length > 0 ? emails[0].value : `${username}@student.42.fr`,
      profilePic: photos && photos.length > 0 ? photos[0].value : '/images/default-avatar.png',
    };

    done(null, user);
  }
}
