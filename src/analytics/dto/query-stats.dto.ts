import { IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryStatsDto {
  @ApiProperty({
    required: false,
    description: 'Start date for filtering (ISO format)',
    example: '2025-03-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    required: false,
    description: 'End date for filtering (ISO format)',
    example: '2025-03-18',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
