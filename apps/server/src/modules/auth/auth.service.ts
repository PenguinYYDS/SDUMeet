import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserRole, VerifyStatus } from '@sdumeet/shared'
import { User } from '../users/user.entity'
import { VerifyStudentDto } from './dto/verify-student.dto'

interface PendingCode {
  code: string
  expiresAt: number
}

// 降级认证方案（未对接校园统一身份认证前）：
// 校验学号格式 + 山大邮箱域名，发送验证码（开发环境打印到控制台），验证通过即发 JWT。
// TODO: 生产环境接入 CAS/OAuth 与真实邮件/短信服务，验证码改存 Redis。
@Injectable()
export class AuthService {
  private readonly pendingCodes = new Map<string, PendingCode>()

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  private issueCode(studentId: string): string {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    this.pendingCodes.set(studentId, { code, expiresAt: Date.now() + 5 * 60 * 1000 })
    return code
  }

  private isValidSduEmail(email: string): boolean {
    return email.toLowerCase().endsWith('@sdu.edu.cn') || email.toLowerCase().endsWith('@mail.sdu.edu.cn')
  }

  private defaultNickname(studentId: string): string {
    return '山大同学' + studentId.slice(-4)
  }

  async verifyStudent(dto: VerifyStudentDto) {
    if (!this.isValidSduEmail(dto.email)) {
      throw new UnauthorizedException('请使用山东大学校园邮箱（@sdu.edu.cn）完成验证')
    }
    const pending = this.pendingCodes.get(dto.studentId)
    if (!pending || pending.expiresAt < Date.now() || pending.code !== dto.code) {
      throw new UnauthorizedException('验证码错误或已过期')
    }
    this.pendingCodes.delete(dto.studentId)

    let user = await this.users.findOne({ where: { studentId: dto.studentId } })
    if (!user) {
      user = this.users.create({
        studentId: dto.studentId,
        email: dto.email,
        nickname: this.defaultNickname(dto.studentId),
        verifyStatus: VerifyStatus.VERIFIED,
        role: UserRole.USER,
      })
    } else {
      user.verifyStatus = VerifyStatus.VERIFIED
      user.isActive = true
    }
    await this.users.save(user)

    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role })
    return { accessToken, expiresIn: 60 * 60 * 24 * 7 }
  }

  // 小程序端调用：请求发送验证码（开发环境返回验证码方便调试，生产环境只返回发送结果）
  async requestCode(studentId: string, email: string) {
    if (!/^\d{10,12}$/.test(studentId)) throw new UnauthorizedException('学号格式不正确')
    if (!this.isValidSduEmail(email)) throw new UnauthorizedException('请使用山东大学校园邮箱')
    const code = this.issueCode(studentId)
    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev) console.log('[dev-only] 验证码 ' + studentId + ' -> ' + code)
    // TODO: 生产环境通过 SMTP/短信发送，并加发送频率限制
    return { sent: true, devCode: isDev ? code : undefined }
  }
}
