# Backend API

Backend API built with Nest.js.

## Technologies

- Nest.js
- TypeScript
- PostgreSQL
- TypeORM
- JWT Authentication
- Swagger for API documentation

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run start:dev

# Build for production
npm run build

# Run production build
npm run start:prod

# Run tests
npm run test
```

## Project Structure

- `/src/modules` - Feature modules
- `/src/common` - Common utilities, middleware, filters, etc.
- `/src/config` - Configuration files
- `/src/database` - Database related files (migrations, seeders)
- `/src/main.ts` - Application entry point

## API Documentation

Swagger documentation is available at `/api/docs` when running the application.

## Branching Strategy

- `main` - Production code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bugfix branches
- `release/*` - Release branches

## Versioning

This project follows Semantic Versioning (SemVer).
