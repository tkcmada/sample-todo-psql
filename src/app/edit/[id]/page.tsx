'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';
import { ArrowLeft } from 'lucide-react';
import type { TodoWithAuditLogs } from '@/server/db/schema';

interface EditTodoPageProps {
  params: {
    id: string;
  };
}

export default function EditTodoPage({ params }: EditTodoPageProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [doneFlag, setDoneFlag] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [todo, setTodo] = useState<TodoWithAuditLogs | null>(null);
  
  const router = useRouter();
  const todoId = parseInt(params.id);

  // 全TODOを取得してIDで検索（簡易実装）
  const { data: todos } = trpc.todo.getAll.useQuery();
  
  const utils = trpc.useContext();
  const updateTodo = trpc.todo.update.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate();
      router.push('/');
    },
    onError: (error) => {
      console.error('Failed to update todo:', error);
    },
  });

  // TODOデータの読み込み
  useEffect(() => {
    if (todos) {
      const foundTodo = todos.find(t => t.id === todoId);
      if (foundTodo) {
        // tRPCから受け取ったデータのDate型を変換
        const todoWithDateObjects = {
          ...foundTodo,
          created_at: new Date(foundTodo.created_at),
          updated_at: new Date(foundTodo.updated_at),
          deleted_at: foundTodo.deleted_at ? new Date(foundTodo.deleted_at) : null,
          auditLogs: foundTodo.auditLogs.map(log => ({
            ...log,
            created_at: new Date(log.created_at)
          }))
        };
        setTodo(todoWithDateObjects);
        setTitle(foundTodo.title);
        setDueDate(foundTodo.due_date || '');
        setDoneFlag(foundTodo.done_flag);
        setIsLoading(false);
      } else {
        // TODOが見つからない場合は一覧に戻る
        router.push('/');
      }
    }
  }, [todos, todoId, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && todo) {
      updateTodo.mutate({
        id: todo.id,
        title: title.trim(),
        due_date: dueDate || null,
        done_flag: doneFlag,
      });
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <main className="container mx-auto p-4 max-w-2xl">
        <div className="flex justify-center items-center py-8">
          <div className="text-lg">読み込み中...</div>
        </div>
      </main>
    );
  }

  if (!todo) {
    return (
      <main className="container mx-auto p-4 max-w-2xl">
        <div className="flex justify-center items-center py-8">
          <div className="text-lg text-red-500">TODOが見つかりません</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        
        <h1 className="text-3xl font-bold text-center">TODOを編集</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>TODO情報</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                タイトル <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                type="text"
                placeholder="TODOのタイトルを入力..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="dueDate" className="text-sm font-medium">
                期限日
              </label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ステータス</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    checked={!doneFlag}
                    onChange={() => setDoneFlag(false)}
                    className="mr-2"
                  />
                  未完了
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    checked={doneFlag}
                    onChange={() => setDoneFlag(true)}
                    className="mr-2"
                  />
                  完了
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={!title.trim() || updateTodo.isLoading}
                className="flex-1"
              >
                {updateTodo.isLoading ? '更新中...' : 'TODOを更新'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateTodo.isLoading}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}