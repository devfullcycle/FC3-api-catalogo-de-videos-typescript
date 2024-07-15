import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  ElasticsearchContainer,
  StartedElasticsearchContainer,
} from '@testcontainers/elasticsearch';
import crypto from 'crypto';
import { esMapping } from '../db/elastic-search/es-mapping';

global.fail = (message) => {
  throw new Error(message);
};

export function setupElasticsearch() {
  let _esClient: ElasticsearchService;
  let _startedContainer: StartedElasticsearchContainer;
  let _indexName: string;

  beforeAll(async () => {
    const esContainer = new ElasticsearchContainer('elasticsearch:7.17.7');

    _startedContainer = await esContainer.start();
  }, 120000);

  beforeEach(async () => {
    _indexName = 'test_es_' + crypto.randomInt(0, 1000000);
    _esClient = new ElasticsearchService({
      node: _startedContainer.getHttpUrl(),
    });
    await _esClient.indices.create({
      index: _indexName,
      body: {
        mappings: esMapping,
      },
    });
  });

  afterEach(async () => {
    await _esClient.indices.delete({
      index: _indexName,
    });
  });

  afterAll(async () => {
    await _startedContainer.stop();
  });

  return {
    get esClient() {
      return _esClient;
    },
    get indexName() {
      return _indexName;
    },
    get container() {
      return _startedContainer;
    },
    get esUrl() {
      return _startedContainer.getHttpUrl();
    },
  };
}
