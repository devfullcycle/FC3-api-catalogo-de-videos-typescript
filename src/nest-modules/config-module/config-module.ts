import { DynamicModule } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigModuleOptions,
} from '@nestjs/config';
import { join } from 'path';
import * as Joi from 'joi';
import { configuration } from './configuration';

//@ts-expect-error - VALID
const joiJson = Joi.extend((joi) => {
  return {
    type: 'object',
    base: joi.object(),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    coerce(value, _schema) {
      if (value[0] !== '{' && !/^\s*\{/.test(value)) {
        return;
      }

      try {
        return { value: JSON.parse(value) };
      } catch (err) {
        console.log(err);
      }
    },
  };
});

type ELASTIC_SEARCH_ENV_SCHEMA_TYPE = {
  ELASTIC_SEARCH_HOST: string;
  ELASTIC_SEARCH_INDEX: string;
};

export const CONFIG_ELASTIC_SEARCH_ENV_SCHEMA: Joi.StrictSchemaMap<ELASTIC_SEARCH_ENV_SCHEMA_TYPE> =
  {
    ELASTIC_SEARCH_HOST: Joi.string().required(),
    ELASTIC_SEARCH_INDEX: Joi.string().required(),
  };

type KAFKA_ENV_SCHEMA_TYPE = {
  KAFKA_CONNECT_PREFIX: string;
  KAFKA_BROKERS: string;
};

export const CONFIG_KAFKA_ENV_SCHEMA: Joi.StrictSchemaMap<KAFKA_ENV_SCHEMA_TYPE> =
  {
    KAFKA_CONNECT_PREFIX: Joi.string().required(),
    KAFKA_BROKERS: Joi.string().required(),
  };

export type Configuration = {
  elastic_search: {
    host: string;
    index: string;
  };
  kafka: {
    connect_prefix: string;
    brokers: string;
  };
};

export class ConfigModule extends NestConfigModule {
  static async forRoot(
    options: ConfigModuleOptions = {},
  ): Promise<DynamicModule> {
    const { envFilePath, ...otherOptions } = options;

    return super.forRoot({
      isGlobal: true,
      envFilePath: [
        ...(Array.isArray(envFilePath) ? envFilePath! : [envFilePath!]),
        join(__dirname, `../../../envs/.env.${process.env.NODE_ENV}`),
        join(__dirname, '../../../envs/.env'),
        // join(process.cwd(), `/envs/.env.${process.env.NODE_ENV}`),
        // join(process.cwd(), '/envs/.env'),
      ],
      load: [configuration],
      validationSchema: joiJson.object({
        ...CONFIG_ELASTIC_SEARCH_ENV_SCHEMA,
        ...CONFIG_KAFKA_ENV_SCHEMA,
      }),
      ...otherOptions,
    });
  }
}
