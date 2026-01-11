import Strategy from 'passport-42';
declare const FortyTwoStrategy_base: new (...args: any[]) => Strategy;
export declare class FortyTwoStrategy extends FortyTwoStrategy_base {
    constructor();
    validate(accessToken: string, refreshToken: string, profile: any, done: (err: any, user: any, info?: any) => void): Promise<any>;
}
export {};
