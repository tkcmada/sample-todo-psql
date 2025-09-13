# Design

## Table Filtering

- Uses TanStack Table `columnFilters` state with a custom filter function that matches rows when the cell value exists in the selected list.
- Unique values for each column are derived from loaded TODO data.
- A reusable filter-options component shows a root "全て" checkbox and individual value checkboxes.
- Filter options appear in popovers triggered by header icons for each column.
- Filter, sorting, and pagination state sync to URL query parameters so views persist across navigation.
- Pages that read URL query parameters wrap client components in `<Suspense>` to comply with `useSearchParams` requirements.

## Pagination and Sorting

- A page-size selector (3/10/30, default 30) sits above the table and controls pagination.
- Column headers toggle sort order and display ascending or descending icons.
- Filters operate in conjunction with pagination and sorting.

## User Management

- `users` stores basic account details (name, email, timestamps).
- `user_apps` links each user to accessible applications.
- `user_roles` records role names associated with a user.

## CI Pipeline

- A single job handles linting, type checking, tests, security scan, build, and database migrations.
- Migrations select the database URL based on the branch:
  - `main` uses `MIGRATION_DATABASE_URL` for production.
  - Other branches use `PREVIEW_MIGRATION_DATABASE_URL` for preview environments.
  - `npm run db:migrate` applies the latest migrations with `drizzle-kit migrate` to the selected database.
  - Tests run against an embedded PostgreSQL engine (PGlite) to keep CI isolated from external databases.
- Run `npm run ci` locally before committing to ensure formatting, type checks, linting, and tests all pass.
- Before pushing to a remote branch, fetch and merge the latest `origin/main` to prevent conflicts.
- Feature branches fetch the latest Vercel preview deployment using `VERCEL_TOKEN` and run end-to-end tests against that preview, while `main` uses `VERCEL_PRODUCTION_URL` after merges to test the production deployment.

## Testing

- Unit tests verify components, services, and repositories.
- Integration tests exercise the todo service with the in-memory repository.
- End-to-end tests use Playwright to confirm UI behavior; install browsers with `npx playwright install --with-deps` and run `npm run test:e2e`. Set `E2E_BASE_URL` to point tests at a deployed instance instead of starting the dev server.
- Run `npm run test:coverage` to inspect coverage.
