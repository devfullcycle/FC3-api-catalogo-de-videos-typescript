import { IUseCase } from '../../../../shared/application/use-case-interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Video, VideoId } from '../../../domain/video.aggregate';
import { IVideoRepository } from '../../../domain/video.repository';

export class DeleteVideoUseCase implements IUseCase<string, void> {
  constructor(private videoRepository: IVideoRepository) {}

  async execute(id: string): Promise<void> {
    const video = await this.videoRepository.findById(new VideoId(id));

    if (!video) {
      throw new NotFoundError(id, Video);
    }

    video.markAsDeleted();

    await this.videoRepository.update(video);
  }
}
