import {
  ArrayMaxSize,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator'
import { CampusCode, DistancePreference, Gender, Orientation } from '@sdumeet/shared'

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 20)
  nickname?: string

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender

  @IsOptional()
  @IsEnum(Orientation)
  orientation?: Orientation

  @IsOptional()
  @IsEnum(CampusCode)
  campus?: CampusCode

  @IsOptional()
  @IsString()
  @Length(1, 50)
  department?: string

  @IsOptional()
  @IsInt()
  @Min(2010)
  @Max(2100)
  grade?: number

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '生日格式应为 YYYY-MM-DD' })
  birthday?: string

  @IsOptional()
  @IsString()
  @Length(1, 16)
  mbti?: string

  @IsOptional()
  @IsString()
  @Length(0, 300)
  bio?: string

  @IsOptional()
  @IsString({ each: true })
  @ArrayMaxSize(20, { message: '兴趣标签最多 20 个' })
  interests?: string[]

  @IsOptional()
  @IsBoolean()
  smoke?: boolean

  @IsOptional()
  @IsBoolean()
  acceptSmoker?: boolean

  @IsOptional()
  @IsEnum(DistancePreference)
  distancePreference?: DistancePreference

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(99)
  minAge?: number

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(99)
  maxAge?: number

  @IsOptional()
  @IsString({ each: true })
  @ArrayMaxSize(9, { message: '照片最多 9 张' })
  photos?: string[]
}
