# AGENTS

- Run `npm run lint`, `npx tsc --noEmit`, and `npm test -- --run` before committing.
- Do not commit secrets or `.env` files.
- Set `USE_LOCAL_DB=true` to run with the in-memory repository instead of PostgreSQL.
- CI skips `npm run db:migrate` and runs with the in-memory database; run migrations locally when using PostgreSQL.
