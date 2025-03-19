// src/analytics/dto/create-visit.dto.ts
import { IsString, IsOptional, IsISO8601, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVisitDto {
  @ApiProperty({
    required: false,
    description: 'Source of the visit (e.g., qr-12345, linkedin)',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({
    description: 'Timestamp of the visit',
    example: '2025-03-18T14:30:00Z',
  })
  @IsISO8601()
  timestamp: string;

  @ApiProperty({ required: false, description: 'User agent of the visitor' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({
    required: false,
    description: 'Language of the visitor',
    example: 'es-ES',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ required: false, description: 'Referrer URL' })
  @IsUrl({ require_tld: false }, { each: false })
  @IsOptional()
  referrer?: string;
}
