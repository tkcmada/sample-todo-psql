# AGENTS

- Run `npm run lint`, `npx tsc --noEmit`, and `npm test -- --run` before committing.
- Do not commit secrets or `.env` files.
- Tests run against an embedded PostgreSQL engine (PGlite).
- CI skips `npm run db:migrate`; run migrations locally when using a real PostgreSQL instance.
