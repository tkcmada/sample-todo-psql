'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { trpc } from '@/lib/trpc/client';
import type { TodoWithAuditLogsSerialized } from '@/server/db/schema';
import { Button } from './ui/button';

export function TodoList() {
  const { data: todos, isLoading, error } = trpc.todo.getAll.useQuery();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });

  const router = useRouter();
  const utils = trpc.useContext();

  const deleteTodo = trpc.todo.delete.useMutation({
    onSuccess: () => utils.todo.getAll.invalidate(),
  });

  const toggleTodo = trpc.todo.toggle.useMutation({
    onSuccess: () => utils.todo.getAll.invalidate(),
  });

  const columns = useMemo<ColumnDef<TodoWithAuditLogsSerialized>[]>(
    () => [
      {
        accessorKey: 'title',
        header: () => 'タイトル',
      },
      {
        accessorKey: 'due_date',
        header: () => '期限',
        cell: (info) => info.getValue<string | null>() ?? '-',
      },
      {
        accessorKey: 'done_flag',
        header: () => '状態',
        cell: (info) => (info.getValue<boolean>() ? '完了' : '未完了'),
      },
      {
        id: 'actions',
        header: () => '操作',
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

  const table = useReactTable<TodoWithAuditLogsSerialized>({
    data: todos ?? [],
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
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
