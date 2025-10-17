## Agent Rules (alwaysApply)

### Project Context

- Monorepo with multiple independent projects
  - Microservices (Node.js + TypeScript + NestJS)
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
- Environment variables: `.env.production.example` is the source of truth for expected variables
- `.env.example` reflects new/modified environment variables

### TypeScript Standards

- Prefer interfaces over types for object shapes
- Use object parameters for functions with 3+ arguments
- Use named exports over default exports

### Agent Expectations

- Follow the above standards across all projects in the repository
- Prefer targeted code edits over full rewrites if you not asked to refactor
- When adding or changing functionality:
  - Update tests and documentation in their respective directories
  - Record significant changes in the project's `CHANGELOG.md`
