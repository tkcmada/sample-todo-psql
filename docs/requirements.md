# Requirements

- Display TODO list with client-side pagination, sorting, and column filtering.
- Column filters show all possible values as checkboxes allowing multiple selections.
- Each column filter panel displays a root "全て" checkbox that toggles all candidate values.
- Filters are accessible via icons in the "タイトル", "期限", and "完了" column headers.
- Filtering, sorting, and pagination operate entirely on the client without server calls.
- CI automatically runs database migrations using `npm run db:migrate` (`drizzle-kit migrate`):
  - Pushes to `main` use `MIGRATION_DATABASE_URL` for production.
  - Other branches and pull requests use `PREVIEW_MIGRATION_DATABASE_URL` for preview environments.
- The CI pipeline runs tests, security scanning, and migrations within a single job to avoid repeated dependency installs.
- Tests execute against an in-memory database (`USE_LOCAL_DB=true`) while migrations target the appropriate branch-specific database URLs.
