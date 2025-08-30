'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { trpc } from '@/lib/trpc/client';
import type { Todo } from '@/server/db/schema';
import { Trash2, Edit3, Check, X } from 'lucide-react';

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDueDate, setEditDueDate] = useState(
    todo.due_date ? todo.due_date.toString() : ''
  );

  const utils = trpc.useContext();

  const updateTodo = trpc.todo.update.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate();
      setIsEditing(false);
    },
  });

  const deleteTodo = trpc.todo.delete.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate();
    },
  });

  const toggleTodo = trpc.todo.toggle.useMutation({
    onSuccess: () => {
      utils.todo.getAll.invalidate();
    },
  });

  const handleUpdate = () => {
    if (editTitle.trim()) {
      updateTodo.mutate({
        id: todo.id,
        title: editTitle.trim(),
        due_date: editDueDate || null,
      });
    }
  };

  const handleToggle = () => {
    toggleTodo.mutate({ id: todo.id });
  };

  const handleDelete = () => {
    deleteTodo.mutate({ id: todo.id });
  };

  return (
    <Card className={`mb-2 ${todo.done_flag ? 'opacity-70' : ''}`}>
      <CardContent className="pt-4">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full"
            />
            <Input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={!editTitle.trim() || updateTodo.isLoading}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(todo.title);
                  setEditDueDate(todo.due_date ? todo.due_date.toString() : '');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant={todo.done_flag ? 'default' : 'outline'}
                  onClick={handleToggle}
                  disabled={toggleTodo.isLoading}
                >
                  {todo.done_flag ? '完了' : '未完了'}
                </Button>
                <div>
                  <h3
                    className={`font-medium ${
                      todo.done_flag ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {todo.title}
                  </h3>
                  {todo.due_date && (
                    <p className="text-sm text-muted-foreground">
                      期限: {todo.due_date.toString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteTodo.isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}