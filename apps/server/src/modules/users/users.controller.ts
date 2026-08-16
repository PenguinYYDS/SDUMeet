import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { UsersService } from './users.service'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  getMe(@CurrentUser('sub') userId: string) {
    return this.users.getSummary(userId)
  }

  @Put('me/profile')
  updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto)
  }

  @Delete('me')
  deleteAccount(@CurrentUser('sub') userId: string) {
    return this.users.deleteAccount(userId)
  }
}
