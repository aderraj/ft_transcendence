import { Profile } from 'passport-42';
import { ConfigService } from '@nestjs/config';
declare const OAuth42Strategy_base: new (...args: any[]) => any;
export declare class OAuth42Strategy extends OAuth42Strategy_base {
    private configService;
    constructor(configService: ConfigService);
    validate(accessToken: string, refreshToken: string, profile: Profile, done: any): Promise<any>;
}
export {};
//# sourceMappingURL=oauth42.strategy.d.ts.map