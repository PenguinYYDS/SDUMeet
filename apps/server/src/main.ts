import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter())
  app.enableCors({ origin: process.env.CORS_ORIGINS === '*' ? true : process.env.CORS_ORIGINS?.split(',') })
  const port = parseInt(process.env.PORT || '3000', 10)
  await app.listen(port)
  console.log('SDUMeet server listening on http://127.0.0.1:' + port)
}

bootstrap()
