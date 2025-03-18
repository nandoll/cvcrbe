// src/analytics/dto/create-visit.dto.ts
import { IsString, IsOptional, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVisitDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty()
  @IsISO8601()
  timestamp: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  referrer?: string;
}
