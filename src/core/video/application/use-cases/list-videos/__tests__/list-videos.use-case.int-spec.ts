import { ListVideosUseCase } from '../list-videos.use-case';

import { VideoElasticSearchRepository } from '../../../../infra/db/elastic-search/video-elastic-search';
import { setupElasticsearch } from '../../../../../shared/infra/testing/global-helpers';
import { Video } from '../../../../domain/video.aggregate';
import { VideoSearchResult } from '../../../../domain/video.repository';
import { VideoOutputMapper } from '../../common/video-output';

describe('ListVideosUseCase Integration Tests', () => {
  let useCase: ListVideosUseCase;
  let videoRepo: VideoElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    videoRepo = new VideoElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new ListVideosUseCase(videoRepo);
  });

  test('toOutput method', () => {
    let result = new VideoSearchResult({
      items: [],
      total: 1,
      current_page: 1,
      per_page: 2,
    });
    let output = useCase['toOutput'](result);
    expect(output).toStrictEqual({
      items: [],
      total: 1,
      current_page: 1,
      per_page: 2,
      last_page: 1,
    });

    const videos = Video.fake()
      .theVideosWithAllMedias(3)
      .withTitle((index) => `title${index}`)
      .withCreatedAt((index) => new Date(2021, 1, index))
      .build();

    result = new VideoSearchResult({
      items: videos,
      total: 3,
      current_page: 1,
      per_page: 2,
    });
    output = useCase['toOutput'](result);
    expect(output).toStrictEqual({
      items: videos.map((i) => VideoOutputMapper.toOutput(i)),
      total: 3,
      current_page: 1,
      per_page: 2,
      last_page: 2,
    });
  });

  it('should return output sorted by created_at when input param is empty', async () => {
    const videos = Video.fake()
      .theVideosWithAllMedias(3)
      .withTitle((index) => `title${index}`)
      .withCreatedAt((index) => new Date(2021, 1, index))
      .build();
    await videoRepo.bulkInsert(videos);

    const output = await useCase.execute({});

    expect(output.items.map((i) => i.title)).toEqual([
      'title2',
      'title1',
      'title0',
    ]);
  });

  it('should return output filter by categories_id, genres_id and cast_members_id', async () => {
    const videos = Video.fake()
      .theVideosWithAllMedias(3)
      .withTitle((index) => `title${index}`)
      .withCreatedAt((index) => new Date(2021, 1, index))
      .build();
    await videoRepo.bulkInsert(videos);

    const output = await useCase.execute({
      filter: {
        categories_id: [
          videos[0].categories.values().next().value.category_id.id,
        ],
        genres_id: [videos[0].genres.values().next().value.genre_id.id],
        cast_members_id: [
          videos[0].cast_members.values().next().value.cast_member_id.id,
        ],
      },
    });

    expect(output.items.map((i) => i.title)).toEqual(['title0']);
  });

  it('should return output filter using fuzzy search', async () => {
    const video = Video.fake()
      .aVideoWithAllMedias()
      .withTitle('batman')
      .withCreatedAt((index) => new Date(2021, 1, index))
      .build();
    await videoRepo.insert(video);

    const output = await useCase.execute({
      filter: {
        title_or_description: 'fatiman',
      },
    });
    expect(output.items.map((i) => i.title)).toEqual(['batman']);
  });
});
