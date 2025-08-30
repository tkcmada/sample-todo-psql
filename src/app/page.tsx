'use client';

import { TodoForm } from '@/components/TodoForm';
import { TodoList } from '@/components/TodoList';

export default function Home() {
  return (
    <main className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Simple TODO List</h1>
      <TodoForm />
      <TodoList />
    </main>
  );
}