import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { setupElasticsearch } from '../../../../../shared/infra/testing/global-helpers';
import { Video, VideoId } from '../../../../domain/video.aggregate';
import { VideoElasticSearchRepository } from '../../../../infra/db/elastic-search/video-elastic-search';
import { GetVideoUseCase } from '../get-video.use-case';

describe('GetVideoUseCase Integration Tests', () => {
  let useCase: GetVideoUseCase;
  let repository: VideoElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new VideoElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new GetVideoUseCase(repository);
  });

  it('should throws error when aggregate not found', async () => {
    const videoId = new VideoId();
    await expect(() => useCase.execute({ id: videoId.id })).rejects.toThrow(
      new NotFoundError(videoId.id, Video),
    );

    const video = Video.fake().aVideoWithAllMedias().build();
    video.markAsDeleted();
    await repository.insert(video);

    await expect(() =>
      useCase.execute({ id: video.video_id.id }),
    ).rejects.toThrow(new NotFoundError(video.video_id.id, Video));
  });

  it('should return a video', async () => {
    const video = Video.fake().aVideoWithAllMedias().build();
    await repository.insert(video);
    const output = await useCase.execute({ id: video.video_id.id });

    expect(output.title).toEqual(video.title);
  });
});
