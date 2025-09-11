'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import type { UserWithAppsAndRoles } from '@/lib/types';
import { trpc } from '@/lib/trpc/client';
import { Button } from './ui/button';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Filter, FilterX, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { ColumnFilterOptions } from './ColumnFilterOptions';

export function UserTable() {
  const { data: users, isLoading, error } = trpc.user.getAll.useQuery();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [sorting, setSorting] = useState<SortingState>(() => {
    const param = searchParams.get('sorting');
    return param ? (JSON.parse(decodeURIComponent(param)) as SortingState) : [];
  });
  const [pagination, setPagination] = useState({
    pageIndex: Number(searchParams.get('page') ?? 0),
    pageSize: Number(searchParams.get('pageSize') ?? 30),
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    const param = searchParams.get('filters');
    return param ? (JSON.parse(decodeURIComponent(param)) as ColumnFiltersState) : [];
  });

  const columns = useMemo<ColumnDef<UserWithAppsAndRoles>[]>(
    () => [
      {
        accessorKey: 'userid',
        header: () => 'User ID',
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          const value = row.getValue(columnId) as number;
          return filterValue.includes(value);
        },
      },
      {
        accessorKey: 'username',
        header: () => 'Username',
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          const value = row.getValue(columnId) as string;
          return filterValue.includes(value);
        },
      },
      {
        accessorKey: 'apps',
        header: () => 'Apps',
        cell: (info) => {
          const apps = info.getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {apps.map((app, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  {app}
                </span>
              ))}
            </div>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'roles',
        header: () => 'Roles',
        cell: (info) => {
          const roles = info.getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {roles.map((role, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
    ],
    [],
  );

  const useridOptions = useMemo(
    () => Array.from(new Set((users ?? []).map((user) => user.userid))),
    [users],
  );
  const usernameOptions = useMemo(
    () => Array.from(new Set((users ?? []).map((user) => user.username))),
    [users],
  );

  const filterOptions: Record<string, any[]> = {
    userid: useridOptions,
    username: usernameOptions,
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (columnFilters.length) {
      params.set('filters', encodeURIComponent(JSON.stringify(columnFilters)));
    }
    if (sorting.length) {
      params.set('sorting', encodeURIComponent(JSON.stringify(sorting)));
    }
    if (pagination.pageIndex) {
      params.set('page', pagination.pageIndex.toString());
    }
    if (pagination.pageSize !== 30) {
      params.set('pageSize', pagination.pageSize.toString());
    }
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}`);
  }, [columnFilters, sorting, pagination, router, pathname]);

  const table = useReactTable<UserWithAppsAndRoles>({
    data: users ?? [],
    columns,
    state: { sorting, pagination, columnFilters },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg text-red-500">Error loading users</div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg text-muted-foreground">
          No users available.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <select
          className="border rounded p-1"
          value={pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {[10, 30, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>
      <table className="min-w-full border">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer border px-2 py-1 text-left"
                >
                  {header.isPlaceholder ? null : (
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() && (
                        header.column.getIsSorted() === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )
                      )}
                      {filterOptions[header.column.id] && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`filter-icon-${header.column.id}`}
                            >
                              {header.column.getFilterValue() ? (
                                <FilterX className="h-4 w-4" />
                              ) : (
                                <Filter className="h-4 w-4" />
                              )}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            data-testid={`filter-panel-${header.column.id}`}
                            align="start"
                            className="w-40 p-2 space-y-1"
                            onOpenAutoFocus={(e: Event) => e.preventDefault()}
                          >
                            <ColumnFilterOptions
                              values={filterOptions[header.column.id]}
                              selected={header.column.getFilterValue() as any[] | undefined}
                              onChange={(val) => header.column.setFilterValue(val)}
                              renderLabel={(value) => String(value)}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-t">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2 py-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between items-center py-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          )}{' '}
          of {table.getFilteredRowModel().rows.length} entries
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}