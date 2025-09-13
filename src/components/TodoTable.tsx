'use client';

import { trpc } from '@/lib/trpc/client';
import { DataTable } from '@/components/ui/data-table';
import { columns } from '@/components/todos/columns';

export function TodoTable() {
  const { data: todos, isLoading, error } = trpc.todo.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg">Loading todos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg text-destructive">Error loading todos</div>
      </div>
    );
  }

  if (!todos || todos.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg text-muted-foreground">
          No todos available. Create your first todo!
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable 
        columns={columns} 
        data={todos}
      />
    </div>
  );
}