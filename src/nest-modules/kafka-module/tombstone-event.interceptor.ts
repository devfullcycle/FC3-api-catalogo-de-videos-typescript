import {
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { EMPTY, Observable, of } from 'rxjs';

export class TombstoneEventInterceptor implements NestInterceptor {
  private logger = new Logger(TombstoneEventInterceptor.name);
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const kafkaMessage = context.switchToRpc().getData();

    if (kafkaMessage?.value === null) {
      this.logger.log(
        `[INFO] [${TombstoneEventInterceptor.name}] - Discarding tombstone event`,
      );
      return of(EMPTY);
    }

    return next.handle();
  }
}
