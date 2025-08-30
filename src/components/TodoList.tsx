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
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}