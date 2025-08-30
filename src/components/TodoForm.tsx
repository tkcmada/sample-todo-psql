'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { trpc } from '@/lib/trpc/client';

export function TodoForm() {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const utils = trpc.useContext();
  const createTodo = trpc.todo.create.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate();
      setTitle('');
      setDueDate('');
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

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="TODO のタイトルを入力..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full"
            />
          </div>
          <Button 
            type="submit" 
            disabled={!title.trim() || createTodo.isLoading}
            className="w-full"
          >
            {createTodo.isLoading ? '追加中...' : 'TODO を追加'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}