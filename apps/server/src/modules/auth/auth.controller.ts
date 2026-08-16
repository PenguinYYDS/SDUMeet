import { Body, Controller, Post } from '@nestjs/common'
import { VerifyStudentDto } from './dto/verify-student.dto'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('request-code')
  requestCode(@Body() body: { studentId: string; email: string }) {
    return this.auth.requestCode(body.studentId, body.email)
  }

  @Post('verify')
  verify(@Body() dto: VerifyStudentDto) {
    return this.auth.verifyStudent(dto)
  }
}
