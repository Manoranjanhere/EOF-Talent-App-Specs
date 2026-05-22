import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./database/prisma.module";
import { AuditContextInterceptor } from "./common/interceptors/audit-context.interceptor";
import { RolesGuard } from "./common/guards/roles.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ProfilesModule } from "./modules/profiles/profiles.module";
import { TagsModule } from "./modules/tags/tags.module";
import { AlbumsModule } from "./modules/albums/albums.module";
import { SubscriptionsModule } from "./modules/subscriptions/subscriptions.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { SearchModule } from "./modules/search/search.module";
import { ChatModule } from "./modules/chat/chat.module";
import { ModerationModule } from "./modules/moderation/moderation.module";
import { FeedbackModule } from "./modules/feedback/feedback.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 100
        }
      ]
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    TagsModule,
    AlbumsModule,
    SubscriptionsModule,
    JobsModule,
    SearchModule,
    ChatModule,
    ModerationModule,
    FeedbackModule,
    HealthModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor
    }
  ]
})
export class AppModule {}
