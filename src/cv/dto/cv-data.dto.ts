// src/cv/dto/cv-data.dto.ts
import { ApiProperty } from '@nestjs/swagger';

class ContactInfoDto {
  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;
}

class SkillDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Skill level from 1 to 5' })
  level: number;

  @ApiProperty({ enum: ['frontend', 'backend', 'devops', 'tools'] })
  category: 'frontend' | 'backend' | 'devops' | 'tools';
}

class ExperienceDto {
  @ApiProperty()
  company: string;

  @ApiProperty()
  position: string;

  @ApiProperty({ description: 'Start date in ISO format or YYYY-MM format' })
  startDate: string;

  @ApiProperty({
    description: 'End date in ISO format, YYYY-MM format, or "Present"',
  })
  endDate: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  remote: boolean;

  @ApiProperty({ type: [String] })
  responsibilities: string[];
}

class EducationDto {
  @ApiProperty()
  institution: string;

  @ApiProperty()
  degree: string;

  @ApiProperty()
  field: string;

  @ApiProperty({ description: 'Start date in ISO format or YYYY-MM format' })
  startDate: string;

  @ApiProperty({
    description: 'End date in ISO format, YYYY-MM format, or "Present"',
  })
  endDate: string;
}

class LanguageDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  level: string;
}

export class CVDataDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  summary: string;

  @ApiProperty({ type: ContactInfoDto })
  contact: ContactInfoDto;

  @ApiProperty({ type: [SkillDto] })
  skills: SkillDto[];

  @ApiProperty({ type: [ExperienceDto] })
  experiences: ExperienceDto[];

  @ApiProperty({ type: [EducationDto] })
  education: EducationDto[];

  @ApiProperty({ type: [LanguageDto] })
  languages: LanguageDto[];

  @ApiProperty({ type: [String] })
  softSkills: string[];
}
