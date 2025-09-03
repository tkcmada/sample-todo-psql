# Design

## Table Filtering
- Uses TanStack Table `columnFilters` state with a custom filter function that matches rows when the cell value exists in the selected list.
- Unique values for each column are derived from loaded TODO data.
- A reusable filter-options component shows a root "全て" checkbox and individual value checkboxes.
- Filter options appear in popovers triggered by header icons for each column.

## Pagination and Sorting
- TanStack Table's client-side pagination and sorting are retained.
- Filters operate in conjunction with pagination and sorting.

## CI Database Migrations
- After tests and security scans succeed, a `migrate` job runs.
- The job selects the database URL based on the branch:
  - `main` uses `MIGRATION_DATABASE_URL` for production.
  - Other branches use `PREVIEW_MIGRATION_DATABASE_URL` for preview environments.
  - `npm run db:migrate` applies the latest migrations with `drizzle-kit migrate` to the selected database.
