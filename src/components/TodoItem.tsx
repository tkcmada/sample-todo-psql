'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';
import type { TodoWithAuditLogs } from '@/server/db/schema';
import { Trash2, Edit3, ChevronDown, ChevronRight, History } from 'lucide-react';
import { AuditLogItem } from './AuditLogItem';

interface TodoItemProps {
  todo: TodoWithAuditLogs;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const router = useRouter();
  const utils = trpc.useContext();

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

  const handleToggle = () => {
    toggleTodo.mutate({ id: todo.id });
  };

  const handleDelete = () => {
    deleteTodo.mutate({ id: todo.id });
  };

  const handleEdit = () => {
    router.push(`/edit/${todo.id}`);
  };

  const toggleAuditLogs = () => {
    setShowAuditLogs(!showAuditLogs);
  };

  return (
    <Card className={`mb-2 ${todo.done_flag ? 'opacity-70' : ''}`}>
      <CardContent className="pt-4">
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
              variant="ghost"
              onClick={toggleAuditLogs}
              className="text-gray-500"
            >
              {showAuditLogs ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <History className="h-4 w-4 ml-1" />
              <span className="text-xs ml-1">履歴 ({todo.auditLogs?.length || 0})</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEdit}
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
        
        {/* Audit Logs Section */}
        {showAuditLogs && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-2">
              {todo.auditLogs && todo.auditLogs.length > 0 ? (
                todo.auditLogs.map((auditLog) => (
                  <AuditLogItem key={auditLog.id} auditLog={auditLog} />
                ))
              ) : (
                <div className="text-sm text-gray-500 py-2">
                  履歴がありません
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}