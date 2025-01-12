import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  BaseRpcContext,
  KafkaContext,
  KafkaRetriableException,
} from '@nestjs/microservices';
import { EntityValidationError } from '../../core/shared/domain/validators/validation.error';
import { KafkaDeadLetterException } from './errors';

@Catch()
export class KafkaConsumeErrorFilter implements ExceptionFilter {
  static readonly NON_RETRIABLE_ERRORS = [
    EntityValidationError,
    UnprocessableEntityException,
    BadRequestException,
  ];

  async catch(exception: Error, host: ArgumentsHost) {
    const ctx: KafkaContext = host.switchToRpc().getContext();

    if (!(ctx instanceof BaseRpcContext)) {
      return;
    }

    const hasNonRetriableError =
      KafkaConsumeErrorFilter.NON_RETRIABLE_ERRORS.some(
        (error) => exception instanceof error,
      );

    if (hasNonRetriableError) {
      throw new KafkaDeadLetterException(exception.message, exception);
    }

    throw new KafkaRetriableException(exception);
  }
}
