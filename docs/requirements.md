# Requirements

- Display TODO list with client-side pagination, sorting, and column filtering.
- A page-size selector above the table allows choosing 3, 10, or 30 items per page (default 30).
- Column filters show all possible values as checkboxes allowing multiple selections.
- Each column filter panel displays a root "全て" checkbox that toggles all candidate values.
- Filters are accessible via icons in the "タイトル", "期限", and "完了" column headers.
- Filtering, sorting, and pagination operate entirely on the client without server calls.
- Filtering, sorting, and pagination state persist in URL query parameters so they remain after creating new items.
- Pages using `useSearchParams` are wrapped in `<Suspense>` to satisfy Next.js requirements.
- CI automatically runs database migrations using `npm run db:migrate` (`drizzle-kit migrate`):
  - Pushes to `main` use `MIGRATION_DATABASE_URL` for production.
  - Other branches and pull requests use `PREVIEW_MIGRATION_DATABASE_URL` for preview environments.
- The CI pipeline runs tests, security scanning, and migrations within a single job to avoid repeated dependency installs.
- Tests execute against an embedded PostgreSQL database (PGlite).
- Unit tests cover components, services, and repositories, and integration tests verify service and repository interaction.
- Run `npm run test:coverage` to check test coverage.
- User management persists user accounts along with associated applications and roles in `users`, `user_apps`, and `user_roles` tables.
