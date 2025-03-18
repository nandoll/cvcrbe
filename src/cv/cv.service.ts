// src/cv/cv.service.ts
// Servicio para datos del CV

import { Injectable, NotFoundException } from '@nestjs/common';
import { CVDataDto } from './dto/cv-data.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CvService {
  private cvData: Record<string, CVDataDto> = {};

  constructor() {
    // Cargar datos del CV en memoria (en producción podría venir de base de datos)
    this.loadCVData();
  }

  private loadCVData() {
    try {
      const locales = ['es', 'en'];

      for (const locale of locales) {
        const filePath = path.join(process.cwd(), 'data', `cv-${locale}.json`);

        if (fs.existsSync(filePath)) {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          this.cvData[locale] = JSON.parse(fileContent);
        } else {
          // Si el archivo no existe, crear datos de ejemplo
          this.cvData[locale] = this.getDefaultCVData(locale);

          // Crear directorio si no existe
          const dir = path.join(process.cwd(), 'data');
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          // Guardar datos de ejemplo
          fs.writeFileSync(
            filePath,
            JSON.stringify(this.cvData[locale], null, 2),
            'utf8',
          );
        }
      }

      console.log('CV data loaded successfully');
    } catch (error) {
      console.error('Error loading CV data:', error);
      // Cargar datos por defecto en caso de error
      this.cvData['es'] = this.getDefaultCVData('es');
      this.cvData['en'] = this.getDefaultCVData('en');
    }
  }

  getCVData(locale: string): CVDataDto {
    // Usar español como fallback si el idioma solicitado no existe
    if (!this.cvData[locale]) {
      return this.cvData['es'] || this.getDefaultCVData('es');
    }
    return this.cvData[locale];
  }

  async updateCVData(locale: string, data: CVDataDto): Promise<CVDataDto> {
    if (!['es', 'en'].includes(locale)) {
      throw new NotFoundException(`Locale ${locale} not supported`);
    }

    // Actualizar datos en memoria
    this.cvData[locale] = data;

    try {
      // Guardar en archivo
      const filePath = path.join(process.cwd(), 'data', `cv-${locale}.json`);
      const dir = path.join(process.cwd(), 'data');

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

      return data;
    } catch (error) {
      console.error(`Error saving CV data for locale ${locale}:`, error);
      throw new Error(`Failed to save CV data for locale ${locale}`);
    }
  }

  private getDefaultCVData(locale: string): CVDataDto {
    const isSpanish = locale === 'es';

    return {
      name: 'Fernando Antezana',
      title: isSpanish
        ? 'Desarrollador Frontend Senior'
        : 'Senior Frontend Developer',
      summary: isSpanish
        ? 'Desarrollador Frontend con más de 5 años de experiencia en el desarrollo de aplicaciones web modernas. Especializado en React y Angular, con sólidos conocimientos en TypeScript, testing y arquitecturas frontend escalables.'
        : 'Frontend Developer with over 5 years of experience in modern web application development. Specialized in React and Angular, with solid knowledge in TypeScript, testing, and scalable frontend architectures.',
      contact: {
        phone: '901133695',
        email: 'fantezana@outlook.com',
      },
      skills: [
        {
          name: 'React',
          level: 5,
          category: 'frontend',
        },
        {
          name: 'Angular',
          level: 4,
          category: 'frontend',
        },
        {
          name: 'TypeScript',
          level: 5,
          category: 'frontend',
        },
        {
          name: 'Node.js',
          level: 3,
          category: 'backend',
        },
        {
          name: 'AWS',
          level: 3,
          category: 'devops',
        },
        {
          name: 'Git',
          level: 4,
          category: 'tools',
        },
      ],
      experiences: [
        {
          company: 'NTT DATA Europe & LATAM',
          position: isSpanish ? 'Lead Engineer' : 'Lead Engineer',
          startDate: '2021-01',
          endDate: 'Present',
          location: isSpanish ? 'Remoto' : 'Remote',
          remote: true,
          responsibilities: isSpanish
            ? [
                'Desarrollo de funcionalidades para proyectos de gestión de inventario utilizando React, GraphQL y Node.js.',
                'Realización de code reviews y gestión de despliegues en AWS y Azure.',
                'Liderazgo de equipo de 5 desarrolladores frontend, utilizando metodologías ágiles.',
              ]
            : [
                'Development of features for inventory management projects using React, GraphQL and Node.js.',
                'Code reviews and deployment management in AWS and Azure.',
                'Leadership of a team of 5 frontend developers, using agile methodologies.',
              ],
        },
        {
          company: 'Inetum',
          position: isSpanish ? 'Desarrollador Frontend' : 'Frontend Developer',
          startDate: '2018-10',
          endDate: '2021-01',
          location: isSpanish ? 'Lima, Perú' : 'Lima, Peru',
          remote: false,
          responsibilities: isSpanish
            ? [
                'Contribución en la creación y actualización del portal comercial para Belcorp-retail.',
                'Diseño de herramientas digitales para Pacífico Seguros, incluyendo pruebas y revisiones de código.',
                'Participación activa en equipos ágiles y gestión de control de versiones con Git.',
              ]
            : [
                'Contribution to the creation and updating of the commercial portal for Belcorp-retail.',
                'Design of digital tools for Pacífico Seguros, including testing and code reviews.',
                'Active participation in agile teams and version control management with Git.',
              ],
        },
      ],
      education: [
        {
          institution: 'Universidad de Ciencias Aplicadas - UPC',
          degree: isSpanish ? 'Ingeniería de Sistemas' : 'Systems Engineering',
          field: isSpanish ? 'Ingeniería de Software' : 'Software Engineering',
          startDate: '2020-11',
          endDate: 'Present',
        },
        {
          institution: 'CIBERTEC',
          degree: isSpanish ? 'Diplomado' : 'Diploma',
          field: isSpanish
            ? 'Gestión e Innovación de las TI'
            : 'IT Management and Innovation',
          startDate: '2011-03',
          endDate: '2011-07',
        },
      ],
      languages: [
        {
          name: isSpanish ? 'Español' : 'Spanish',
          level: isSpanish ? 'Nativo' : 'Native',
        },
        {
          name: isSpanish ? 'Inglés' : 'English',
          level: isSpanish ? 'Profesional' : 'Professional',
        },
      ],
      softSkills: isSpanish
        ? [
            'Trabajo en equipo',
            'Habilidades analíticas',
            'Liderazgo',
            'Orientación a resultados',
            'Visión estratégica de negocio',
          ]
        : [
            'Teamwork',
            'Analytical skills',
            'Leadership',
            'Results-oriented',
            'Strategic business vision',
          ],
    };
  }
}
