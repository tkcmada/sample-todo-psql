# Design

## Table Filtering
- Uses TanStack Table `columnFilters` state with a custom filter function that matches rows when the cell value exists in the selected list.
- Unique values for each column are derived from loaded TODO data.
- Checkboxes are rendered for each unique value with "全選択" and "全解除" buttons to quickly toggle all options.
- Filter panels are displayed above the table for visibility.

## Pagination and Sorting
- TanStack Table's client-side pagination and sorting are retained.
- Filters operate in conjunction with pagination and sorting.

## CI Database Migrations
- After tests and security scans succeed, a `migrate` job runs.
- The job selects the database URL based on the branch:
  - `main` uses `MIGRATION_DATABASE_URL` for production.
  - Other branches use `PREVIEW_MIGRATION_DATABASE_URL` for preview environments.
- `npm run db:migrate` applies the latest migrations to the selected database.
