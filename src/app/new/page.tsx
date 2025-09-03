'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';
import { ArrowLeft } from 'lucide-react';

function NewTodoPageContent() {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const utils = trpc.useContext();
  const createTodo = trpc.todo.create.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate();
      const params = searchParams.toString();
      router.push(`/${params ? `?${params}` : ''}`);
    },
    onError: (error) => {
      console.error('Failed to create todo:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      createTodo.mutate({
        title: title.trim(),
        due_date: dueDate || null,
      });
    }
  };

  const handleCancel = () => {
    const params = searchParams.toString();
    router.push(`/${params ? `?${params}` : ''}`);
  };

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

        <h1 className="text-3xl font-bold text-center">新しいTODOを作成</h1>
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

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={!title.trim() || createTodo.isLoading}
                className="flex-1"
              >
                {createTodo.isLoading ? '作成中...' : 'TODOを作成'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={createTodo.isLoading}
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

export default function NewTodoPage() {
  return (
    <Suspense fallback={<div />}> 
      <NewTodoPageContent />
    </Suspense>
  );
}