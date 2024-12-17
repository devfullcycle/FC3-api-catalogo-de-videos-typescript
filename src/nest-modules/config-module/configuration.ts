import { Configuration } from './config-module';

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export const configuration = (
  overrideValues?: RecursivePartial<Configuration>,
) => ({
  elastic_search: {
    host:
      overrideValues?.elastic_search?.host || process.env.ELASTIC_SEARCH_HOST,
    index:
      overrideValues?.elastic_search?.index || process.env.ELASTIC_SEARCH_INDEX,
  },
  kafka: {
    connect_prefix:
      overrideValues?.kafka?.connect_prefix || process.env.KAFKA_CONNECT_PREFIX,
    brokers: overrideValues?.kafka?.brokers || process.env.KAFKA_BROKERS,
  },
});

export const overrideConfiguration = (
  overrideValues?: RecursivePartial<Configuration>,
) => {
  return () => configuration(overrideValues);
};
