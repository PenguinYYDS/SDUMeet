import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter())
  // 端口与 CORS 统一走配置中心，消除与 configuration.ts 的重复解析
  const corsOrigins = config.get<string>('corsOrigins')
  app.enableCors({ origin: corsOrigins === '*' ? true : corsOrigins?.split(',') })
  const port = config.get<number>('port') || 3000
  await app.listen(port)
  console.log('SDUMeet server listening on http://127.0.0.1:' + port)
}

bootstrap()
