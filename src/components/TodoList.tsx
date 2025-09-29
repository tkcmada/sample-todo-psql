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
import { trpc } from '@/lib/trpc/client';
import type { TodoWithAuditLogs } from '@/lib/types-composite';
import { Button } from './ui/button';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Filter, FilterX, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { ColumnFilterOptions } from './ColumnFilterOptions';

export function TodoList() {
  const { data: todos, isLoading, error } = trpc.todo.getAll.useQuery();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const utils = trpc.useContext();

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

  const deleteTodo = trpc.todo.delete.useMutation({
    onSuccess: () => utils.todo.getAll.invalidate(),
  });

  const toggleTodo = trpc.todo.toggle.useMutation({
    onSuccess: () => utils.todo.getAll.invalidate(),
  });

  const columns = useMemo<ColumnDef<TodoWithAuditLogs>[]>(
    () => [
      {
        accessorKey: 'title',
        header: () => 'タイトル',
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return filterValue.includes(row.getValue(columnId));
        },
      },
      {
        accessorKey: 'due_date',
        header: () => '期限',
        cell: (info) => info.getValue<string | null>() ?? '-',
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return filterValue.includes(row.getValue(columnId));
        },
      },
      {
        accessorKey: 'done_flag',
        header: () => '完了',
        cell: (info) => (info.getValue<boolean>() ? '完了' : '未完了'),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          return filterValue.includes(row.getValue(columnId));
        },
      },
      {
        id: 'actions',
        header: () => '操作',
        enableSorting: false,
        cell: ({ row }) => {
          const todo = row.original;
          return (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={todo.done_flag ? 'default' : 'outline'}
                onClick={() => toggleTodo.mutate({ id: todo.id })}
                disabled={toggleTodo.isLoading}
              >
                {todo.done_flag ? '完了' : '未完了'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/edit/${todo.id}`)}
              >
                編集
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteTodo.mutate({ id: todo.id })}
                disabled={deleteTodo.isLoading}
              >
                削除
              </Button>
            </div>
          );
        },
      },
    ],
    [deleteTodo, toggleTodo, router],
  );

  const titleOptions = useMemo(
    () => Array.from(new Set((todos ?? []).map((t) => t.title))),
    [todos],
  );
  const dueDateOptions = useMemo(
    () => Array.from(new Set((todos ?? []).map((t) => t.due_date))),
    [todos],
  );

  const filterOptions: Record<string, any[]> = {
    title: titleOptions,
    due_date: dueDateOptions,
    done_flag: [true, false],
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

  const table = useReactTable<TodoWithAuditLogs>({
    data: todos ?? [],
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
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg text-red-500">エラーが発生しました</div>
      </div>
    );
  }

  if (!todos || todos.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg text-muted-foreground">
          TODO がありません。新しい TODO を追加してください。
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
          {[3, 10, 30].map((size) => (
            <option key={size} value={size}>
              {size}
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
                              renderLabel={(value) => {
                                if (header.column.id === 'due_date') return value ?? '-';
                                if (header.column.id === 'done_flag')
                                  return value ? '完了' : '未完了';
                                return value as any;
                              }}
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
            <tr key={row.id} data-testid={`todo-row-${row.original.id}`} className="border-t">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2 py-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end gap-2 py-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          前
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          次
        </Button>
      </div>
    </div>
  );
}
