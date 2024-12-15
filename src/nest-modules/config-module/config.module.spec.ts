import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from './config-module';
import { ConfigService } from '@nestjs/config';
import { overrideConfiguration } from './configuration';

describe('ConfigModule', () => {
  it('should define the variables', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
    }).compile();
    const configService = moduleRef.get(ConfigService);
    expect(configService.get('elastic_search.host')).toBeDefined();
    expect(configService.get('elastic_search.index')).toBeDefined();
  });

  it('should override variables', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            overrideConfiguration({
              elastic_search: {
                host: 'http://localhost:9200',
              },
            }),
          ],
        }),
      ],
    }).compile();
    const configService = moduleRef.get(ConfigService);
    expect(configService.get('elastic_search.host')).toBe(
      'http://localhost:9200',
    );
    expect(configService.get('elastic_search.index')).toBeDefined();
  });
});
