import { DeadLetter } from 'kafkajs-async-retry';

export class KafkaDeadLetterException extends DeadLetter {
  cause: Error;
  constructor(error: string, cause: Error) {
    super(error);
    this.cause = cause;
  }
}
