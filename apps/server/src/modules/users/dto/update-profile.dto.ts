import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator'
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
  photos?: string[]
}
