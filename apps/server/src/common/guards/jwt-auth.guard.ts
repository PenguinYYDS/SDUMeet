import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

export interface JwtPayload {
  sub: string
  role: string
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const auth: string = req.headers.authorization || ''
    if (!auth.startsWith('Bearer ')) throw new UnauthorizedException('请先登录')
    try {
      req.user = await this.jwt.verifyAsync<JwtPayload>(auth.slice(7))
      return true
    } catch {
      throw new UnauthorizedException('登录已过期，请重新登录')
    }
  }
}
