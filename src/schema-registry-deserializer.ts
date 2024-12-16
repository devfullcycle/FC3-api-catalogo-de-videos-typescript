import { IncomingRequest, IncomingEvent } from '@nestjs/microservices';
import { KafkaRequestDeserializer } from '@nestjs/microservices/deserializers/kafka-request.deserializer';
import {
  AvroDeserializer,
  SchemaRegistryClient,
  SerdeType,
} from '@confluentinc/schemaregistry';

export class SchemaRegistryDeserializer extends KafkaRequestDeserializer {
  constructor(protected schemaRegistry: SchemaRegistryClient) {
    super();
  }

  deserialize(
    value: any, ///mesage (key, value)
    options?: Record<string, any>, //{channel} (topic)
  ): IncomingRequest | IncomingEvent {
    if (!options) {
      return {
        pattern: undefined, //topic
        data: undefined, //message deserialize
      };
    }
    try {
      const magicByte = value.value[0];
      if (magicByte === 0x00) {
        //avro - serialize and deserialize
        const deserializer = new AvroDeserializer(
          this.schemaRegistry,
          SerdeType.VALUE, //serialization deserialization
          {},
        );
        return {
          pattern: options?.channel,
          data: deserializer.deserialize(options?.channel, value.value) as any,
        };
      }
    } catch (error) {}

    return super.deserialize(value, options);
  }
}
