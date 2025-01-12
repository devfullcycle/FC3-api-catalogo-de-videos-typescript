import { KafkaHeaders } from '@nestjs/microservices';
import * as kafkaLib from '@confluentinc/kafka-javascript';
import { NO_MESSAGE_HANDLER } from '@nestjs/microservices/constants';
import {
  EachMessagePayload,
  KafkaMessage,
} from '@nestjs/microservices/external/kafka.interface';
import { ConfluentKafkaContext } from './confluent-kafka-context';
import { ReplaySubject } from 'rxjs';
import {
  ConfluentKafkaServer,
  KafkaServerOptions,
} from './confluent-kafka-server';
import AsyncRetryHelper, { AsyncRetryConfig } from 'kafkajs-async-retry';

export type ConfluentKafkaRetriableServerOptions = KafkaServerOptions & {
  asyncRetryConfig: Pick<
    AsyncRetryConfig,
    'retryTopicNaming' | 'retryDelays' | 'maxRetries' | 'maxWaitTime'
  >;
};

export class ConfluentKafkaRetriableServer extends ConfluentKafkaServer {
  private asyncRetryHelper: AsyncRetryHelper;

  constructor(
    protected readonly options: ConfluentKafkaRetriableServerOptions,
  ) {
    super(options);
  }

  public async bindEvents(consumer: kafkaLib.KafkaJS.Consumer) {
    console.log(this.options.asyncRetryConfig);
    this.asyncRetryHelper = new AsyncRetryHelper({
      producer: this.producer,
      groupId: this.groupId,
      retryTopicNaming: this.options.asyncRetryConfig.retryTopicNaming,
      retryDelays: this.options.asyncRetryConfig.retryDelays,
      maxRetries: this.options.asyncRetryConfig.maxRetries,
      maxWaitTime: this.options.asyncRetryConfig.maxWaitTime,
    });

    this.asyncRetryHelper.on('retry', ({ error, topic }) => {
      this.logger.error(
        `Retrying message from topic ${topic} due to error: ${(error as any).message}`,
      );
    });

    this.asyncRetryHelper.on('dead-letter', ({ error, topic }) => {
      this.logger.error(
        `Sending message from topic ${topic} to dead-letter topic due to error: ${(error as any).message}`,
      );
    });

    const registeredPatterns = [...this.messageHandlers.keys()];
    const consumerSubscribeOptions = this.options.subscribe || {};

    if (registeredPatterns.length > 0) {
      const topics = [
        ...registeredPatterns,
        ...this.asyncRetryHelper.retryTopics,
      ];
      console.log(topics);
      await Promise.all(
        topics.map(async (pattern) => {
          await this.admin.createTopics({ topics: [{ topic: pattern }] });
        }),
      );
      await this.consumer.subscribe({
        ...consumerSubscribeOptions,
        topics: topics,
      });
    }

    const consumerRunOptions = Object.assign(this.options.run || {}, {
      eachMessage: this.asyncRetryHelper!.eachMessage(async (payload) => {
        console.log(payload);
        if (payload.previousAttempts > 0) {
          this.logger.log(
            `Retrying message from topic ${payload.originalTopic}`,
          );
        }

        await this.handleMessage(payload);
      }),
    });

    await consumer.run(consumerRunOptions);
  }

  public async handleMessage(payload: EachMessagePayload) {
    const channel = payload.topic;
    const rawMessage = this.parser.parse<KafkaMessage>(
      Object.assign(payload.message, {
        topic: payload.topic,
        partition: payload.partition,
      }),
    );
    const headers = rawMessage.headers as unknown as Record<string, any>;
    const correlationId = headers[KafkaHeaders.CORRELATION_ID];
    const replyTopic = headers[KafkaHeaders.REPLY_TOPIC];
    const replyPartition = headers[KafkaHeaders.REPLY_PARTITION];

    const packet = await this.deserializer.deserialize(rawMessage, { channel });
    const kafkaContext = new ConfluentKafkaContext([
      rawMessage,
      payload.partition,
      payload.topic,
      this.consumer,
      payload.heartbeat,
      this.producer,
    ]);
    const handler = this.getHandlerByPattern(packet.pattern);
    const asyncHeaders = kafkaContext.getMessage().headers?.asyncRetry as any;
    const pattern =
      asyncHeaders && !new RegExp(/-dlq$/).test(packet.pattern)
        ? asyncHeaders.top
        : packet.pattern;
    // if the correlation id or reply topic is not set
    // then this is an event (events could still have correlation id)
    if (handler?.isEventHandler || !correlationId || !replyTopic) {
      return this.handleEvent(pattern, packet, kafkaContext);
    }

    const publish = this.getPublisher(
      replyTopic,
      replyPartition,
      correlationId,
    );

    if (!handler) {
      return publish({
        id: correlationId,
        err: NO_MESSAGE_HANDLER,
      });
    }

    const response$ = this.transformToObservable(
      handler(packet.data, kafkaContext),
    );

    const replayStream$ = new ReplaySubject();
    await this.combineStreamsAndThrowIfRetriable(response$, replayStream$);

    this.send(replayStream$, publish);
  }
}
