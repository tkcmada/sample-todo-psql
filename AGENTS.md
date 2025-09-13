# AGENTS

- Run `npm run ci` before committing. This script runs `npm run fmt`, `npm run typecheck`, `npm run lint`, and `npm test -- --run`.
- Do not commit secrets or `.env` files.
- Tests run against an embedded PostgreSQL engine (PGlite).
- CI skips `npm run db:migrate`; run migrations locally when using a real PostgreSQL instance.
