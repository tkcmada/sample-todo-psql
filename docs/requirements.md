# Requirements

- Display TODO list with client-side pagination, sorting, and column filtering.
- Column filters show all possible values as checkboxes allowing multiple selections.
- Provide "全選択" (check all) and "全解除" (uncheck all) controls for each column filter.
- Filters are rendered above the table for quick access.
- Filtering, sorting, and pagination operate entirely on the client without server calls.
- CI automatically runs database migrations using `npm run db:migrate` (`drizzle-kit migrate`):
  - Pushes to `main` use `MIGRATION_DATABASE_URL` for production.
  - Other branches and pull requests use `PREVIEW_MIGRATION_DATABASE_URL` for preview environments.
