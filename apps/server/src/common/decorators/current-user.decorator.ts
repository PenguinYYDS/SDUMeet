import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { JwtPayload } from '../guards/jwt-auth.guard'

export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest()
    const user = req.user as JwtPayload | undefined
    return field ? user?.[field] : user
  },
)
