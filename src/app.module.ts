import { Module } from '@nestjs/common';
import { CategoriesModule } from './nest-modules/categories-module/categories.module';
import { CastMembersModule } from './nest-modules/cast-members-module/cast-members.module';
import { GenresModule } from './nest-modules/genres-module/genres.module';
import { VideosModule } from './nest-modules/videos-modules/videos.module';

@Module({
  imports: [
    CategoriesModule.forRoot(),
    CastMembersModule.forRoot(),
    GenresModule.forRoot(),
    VideosModule,
  ],
})
export class AppModule {}
