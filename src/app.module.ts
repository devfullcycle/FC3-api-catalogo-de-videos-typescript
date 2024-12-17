import { Module } from '@nestjs/common';
import { CategoriesModule } from './nest-modules/categories-module/categories.module';
import { CastMembersModule } from './nest-modules/cast-members-module/cast-members.module';
import { GenresModule } from './nest-modules/genres-module/genres.module';
import { VideosModule } from './nest-modules/videos-modules/videos.module';
import { ConfigModule } from './nest-modules/config-module/config-module';
import { ElasticSearchModule } from './nest-modules/elastic-search-module/elastic-search-module';
import { KafkaModule } from './nest-modules/kafka-module/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ElasticSearchModule,
    KafkaModule,
    CategoriesModule.forRoot(),
    CastMembersModule.forRoot(),
    GenresModule.forRoot(),
    VideosModule,
  ],
})
export class AppModule {}
