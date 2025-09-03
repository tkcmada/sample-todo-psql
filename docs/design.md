# Design

## Table Filtering
- Uses TanStack Table `columnFilters` state with a custom filter function that matches rows when the cell value exists in the selected list.
- Unique values for each column are derived from loaded TODO data.
- A reusable filter-options component shows a root "全て" checkbox and individual value checkboxes.
- Filter options appear in popovers triggered by header icons for each column.
- Filter, sorting, and pagination state sync to URL query parameters so views persist across navigation.

## Pagination and Sorting
- A page-size selector (3/10/30, default 30) sits above the table and controls pagination.
- Column headers toggle sort order and display ascending or descending icons.
- Filters operate in conjunction with pagination and sorting.

## CI Pipeline
- A single job handles linting, type checking, tests, security scan, build, and database migrations.
- Migrations select the database URL based on the branch:
  - `main` uses `MIGRATION_DATABASE_URL` for production.
  - Other branches use `PREVIEW_MIGRATION_DATABASE_URL` for preview environments.
  - `npm run db:migrate` applies the latest migrations with `drizzle-kit migrate` to the selected database.
  - Tests run against an in-memory database (`USE_LOCAL_DB=true`) to keep CI isolated from PostgreSQL while migrations target the appropriate environment.
