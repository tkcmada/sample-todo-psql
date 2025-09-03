'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TodoList } from '@/components/TodoList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCreateNew = () => {
    const params = searchParams.toString();
    router.push(`/new${params ? `?${params}` : ''}`);
  };

  return (
    <main className="container mx-auto p-4 max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Simple TODO List</h1>
        <Button
          onClick={handleCreateNew}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          新規作成
        </Button>
      </div>
      
      <TodoList />
      
      {/* 右下の固定ボタン */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={handleCreateNew}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </main>
  );
}