'use client';

import { trpc } from '@/lib/trpc/client';
import { TodoItem } from './TodoItem';

export function TodoList() {
  const { data: todos, isLoading, error } = trpc.todo.getAll.useQuery();

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
      {todos.map((todo) => {
        // tRPCから受け取ったデータのDate型を変換
        const todoWithDateObjects = {
          ...todo,
          created_at: new Date(todo.created_at),
          updated_at: new Date(todo.updated_at),
          deleted_at: todo.deleted_at ? new Date(todo.deleted_at) : null,
          auditLogs: todo.auditLogs.map(log => ({
            ...log,
            created_at: new Date(log.created_at)
          }))
        };
        return <TodoItem key={todo.id} todo={todoWithDateObjects} />;
      })}
    </div>
  );
}