import {
  PaginationOutput,
  PaginationOutputMapper,
} from '../../../../shared/application/pagination-output';
import { IUseCase } from '../../../../shared/application/use-case-interface';
import {
  IVideoRepository,
  VideoSearchParams,
  VideoSearchResult,
} from '../../../domain/video.repository';
import { VideoOutput, VideoOutputMapper } from '../common/video-output';
import { ListVideosInput } from './list-videos.input';

export class ListVideosUseCase
  implements IUseCase<ListVideosInput, ListVideosOutput>
{
  constructor(private videoRepo: IVideoRepository) {}

  async execute(input: ListVideosInput): Promise<ListVideosOutput> {
    const searchParams = VideoSearchParams.create({
      ...input,
      filter: {
        ...input.filter,
        is_published: true,
      },
    });
    const videos = await this.videoRepo
      .ignoreSoftDeleted()
      .search(searchParams);

    return this.toOutput(videos);
  }

  private toOutput(searchResult: VideoSearchResult): ListVideosOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return VideoOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}

export type ListVideosOutput = PaginationOutput<VideoOutput>;
