import { IsEmail, IsString, Length, Matches } from 'class-validator'

export class VerifyStudentDto {
  // 山大学号通常为 12 位数字（含入学年份），此处允许 10-12 位以兼容历史学号
  @IsString()
  @Matches(/^\d{10,12}$/, { message: '学号格式不正确' })
  studentId: string

  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string

  @IsString()
  @Length(6, 6, { message: '验证码为 6 位数字' })
  code: string
}
