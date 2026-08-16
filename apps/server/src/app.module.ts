import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import configuration from './config/configuration'
import { AuthModule } from './modules/auth/auth.module'
import { ChatModule } from './modules/chat/chat.module'
import { HealthModule } from './modules/health/health.module'
import { MatchingModule } from './modules/matching/matching.module'
import { SurveyModule } from './modules/survey/survey.module'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwtSecret'),
        signOptions: { expiresIn: config.get<string>('jwtExpiresIn') },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('databaseUrl'),
        autoLoadEntities: true,
        // 注意：开发环境方便起见的 synchronize，生产环境必须关闭并改用 migration
        synchronize: config.get<string>('nodeEnv') !== 'production',
        logging: config.get<string>('nodeEnv') === 'development' ? ['error', 'warn'] : false,
      }),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    SurveyModule,
    MatchingModule,
    ChatModule,
  ],
})
export class AppModule {}
