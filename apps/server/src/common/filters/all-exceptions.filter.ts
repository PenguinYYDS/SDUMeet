import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { ApiResponse } from '@sdumeet/shared'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const message =
      exception instanceof HttpException
        ? this.extractMessage(exception)
        : '服务器开小差了，请稍后再试'
    if (status >= 500) console.error(exception)
    const body: ApiResponse<null> = { code: status, message, data: null }
    response.status(status).json(body)
  }

  private extractMessage(exception: HttpException): string {
    const res = exception.getResponse()
    if (typeof res === 'string') return res
    if (typeof res === 'object' && res !== null) {
      const msg = (res as Record<string, unknown>).message
      if (Array.isArray(msg)) return msg.join('；')
      if (typeof msg === 'string') return msg
    }
    return exception.message
  }
}
