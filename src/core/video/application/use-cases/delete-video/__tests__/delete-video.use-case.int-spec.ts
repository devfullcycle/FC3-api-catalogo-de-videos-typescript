import { DeleteVideoUseCase } from '../delete-video.use-case';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { Video, VideoId } from '../../../../domain/video.aggregate';
import { VideoElasticSearchRepository } from '../../../../infra/db/elastic-search/video-elastic-search';
import { setupElasticsearch } from '../../../../../shared/infra/testing/global-helpers';

describe('DeleteVideoUseCase Integration Tests', () => {
  let useCase: DeleteVideoUseCase;
  let repository: VideoElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new VideoElasticSearchRepository(
      esHelper.esClient,
      esHelper.indexName,
    );
    useCase = new DeleteVideoUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const genreId = new VideoId();
    await expect(() => useCase.execute(genreId.id)).rejects.toThrow(
      new NotFoundError(genreId.id, Video),
    );
  });

  it('should delete a genre', async () => {
    const video = Video.fake().aVideoWithAllMedias().build();
    await repository.insert(video);
    await useCase.execute(video.video_id.id);
    const noEntity = await repository
      .ignoreSoftDeleted()
      .findById(video.video_id);
    expect(noEntity).toBeNull();
  });
});
