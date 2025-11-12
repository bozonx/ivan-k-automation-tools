## Agent Rules (alwaysApply)

### Project Context

- Monorepo with multiple independent projects
  - Microservices (Node.js + TypeScript + NestJS)
  - N8n custom nodes
  - Docker containers for specific tools
  - Each project is autonomous and has its own dependencies

### Structure and Practices

- Node.js: version 22
- Package manager: `pnpm`
- Microservices project directories names start with `micro-*`
- Imports: prefer path aliases
- Tests:
  - Unit tests: `\<projectName\>/test/unit/`
  - E2E tests: `\<projectName\>/test/e2e/`
  - setup of unit tests: `\<projectName\>/test/setup/unit.setup.ts`
  - setup of e2e tests: `\<projectName\>/test/setup/e2e.setup.ts`
- Documentation:
  - Guides: `\<projectName\>/docs/`
  - Development stage docs: `\<projectName\>/dev_docs/`
  - Update `\<projectName\>/docs/CHANGELOG.md` for significant changes
  - Keep `\<projectName\>/README.md` up to date (setup/run instructions)
  - README, all the documentation, jsdoc, messages and strings have to be in English
- Environment variables: `.env.production.example` is the source of truth for expected variables
- `.env.example` reflects new/modified environment variables
