import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;
          this.logger.logApiRequest(
            method,
            url,
            response.statusCode,
            duration,
            request.user?.id,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.logApiRequest(
            method,
            url,
            error.status || 500,
            duration,
            request.user?.id,
          );
        },
      }),
    );
  }
}
