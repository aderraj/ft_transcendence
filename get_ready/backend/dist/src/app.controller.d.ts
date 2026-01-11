import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHealth(): {
        status: string;
        message: string;
    };
}
//# sourceMappingURL=app.controller.d.ts.map