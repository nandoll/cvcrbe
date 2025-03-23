// backend/src/cv/cv.controller.ts
import { Controller, Get, Param, Put, Body, UseGuards } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiTags,
  ApiParam,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { CvService } from './cv.service';
import { CVDataDto } from './dto/cv-data.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('cv')
@Controller('cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Public()
  @Get(':lang')
  @ApiParam({ name: 'lang', enum: ['es', 'en'] })
  @ApiOperation({ summary: 'Get CV data by language' })
  getCVData(@Param('lang') lang: string) {
    return this.cvService.getCVData(lang);
  }

  @Put(':lang')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiParam({ name: 'lang', enum: ['es', 'en'] })
  @ApiOperation({ summary: 'Update CV data by language' })
  updateCVData(@Param('lang') lang: string, @Body() cvData: CVDataDto) {
    return this.cvService.updateCVData(lang, cvData);
  }
}
