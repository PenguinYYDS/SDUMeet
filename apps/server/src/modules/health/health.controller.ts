import { Controller, Get } from '@nestjs/common'

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', version: '0.1.0', uptime: Math.round(process.uptime()) }
  }
}
