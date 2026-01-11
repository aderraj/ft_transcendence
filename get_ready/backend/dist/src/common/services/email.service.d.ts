import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private transporter;
    constructor(configService: ConfigService);
    sendPasswordResetEmail(email: string, resetToken: string): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=email.service.d.ts.map