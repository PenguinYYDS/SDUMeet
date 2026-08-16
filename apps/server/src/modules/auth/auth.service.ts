import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { randomInt } from 'node:crypto'
import { Repository } from 'typeorm'
import { UserRole, VerifyStatus } from '@sdumeet/shared'
import { User } from '../users/user.entity'
import { VerifyStudentDto } from './dto/verify-student.dto'

interface PendingCode {
  code: string
  expiresAt: number
  attempts: number
}

const CODE_TTL_MS = 5 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const DAILY_SEND_LIMIT = 10
const MAX_ATTEMPTS = 5

// 降级认证方案（未对接校园统一身份认证前）：
// 校验学号格式 + 山大邮箱域名，发送验证码（开发环境打印到控制台），验证通过即发 JWT。
// TODO: 生产环境接入 CAS/OAuth 与真实邮件/短信服务，验证码改存 Redis。
@Injectable()
export class AuthService {
  private readonly pendingCodes = new Map<string, PendingCode>()
  private readonly lastSentAt = new Map<string, number>()
  private readonly dailySent = new Map<string, { day: string; count: number }>()

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  private localDay(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())
  }

  private issueCode(studentId: string): string {
    // 密码学安全随机数，替代可预测的 Math.random
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    this.pendingCodes.set(studentId, { code, expiresAt: Date.now() + CODE_TTL_MS, attempts: 0 })
    return code
  }

  // 清理过期验证码与陈旧的发送时间戳，防止长期运行内存膨胀
  private sweepExpired(): void {
    const now = Date.now()
    for (const [id, pending] of this.pendingCodes) {
      if (pending.expiresAt <= now) this.pendingCodes.delete(id)
    }
    for (const [id, at] of this.lastSentAt) {
      if (now - at > 24 * 60 * 60 * 1000) this.lastSentAt.delete(id)
    }
  }

  private isValidSduEmail(email: string): boolean {
    return (
      email.toLowerCase().endsWith('@sdu.edu.cn') ||
      email.toLowerCase().endsWith('@mail.sdu.edu.cn')
    )
  }

  private defaultNickname(studentId: string): string {
    return '山大同学' + studentId.slice(-4)
  }

  async verifyStudent(dto: VerifyStudentDto) {
    if (!this.isValidSduEmail(dto.email)) {
      throw new UnauthorizedException('请使用山东大学校园邮箱（@sdu.edu.cn）完成验证')
    }
    const pending = this.pendingCodes.get(dto.studentId)
    if (!pending || pending.expiresAt <= Date.now()) {
      throw new UnauthorizedException('验证码错误或已过期')
    }
    pending.attempts++
    if (pending.code !== dto.code) {
      if (pending.attempts >= MAX_ATTEMPTS) {
        // 防暴力破解：错误次数超限后验证码直接作废，需重新发送
        this.pendingCodes.delete(dto.studentId)
      }
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

    const now = Date.now()
    const last = this.lastSentAt.get(studentId)
    if (last && now - last < RESEND_COOLDOWN_MS) {
      throw new HttpException('发送太频繁，请 1 分钟后再试', HttpStatus.TOO_MANY_REQUESTS)
    }
    const day = this.localDay()
    const sent = this.dailySent.get(studentId)
    if (sent && sent.day === day && sent.count >= DAILY_SEND_LIMIT) {
      throw new HttpException('今日发送次数已达上限，请明天再试', HttpStatus.TOO_MANY_REQUESTS)
    }

    this.sweepExpired()
    this.lastSentAt.set(studentId, now)
    this.dailySent.set(studentId, { day, count: (sent && sent.day === day ? sent.count : 0) + 1 })
    const code = this.issueCode(studentId)
    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev) console.log('[dev-only] 验证码 ' + studentId + ' -> ' + code)
    // TODO: 生产环境通过 SMTP/短信发送
    return { sent: true, devCode: isDev ? code : undefined }
  }
}
