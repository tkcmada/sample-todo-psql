import { todoRepository } from '@/server/repositories/todoRepository';

export const todoService = {
  getAll: async () => todoRepository.getAll(),
  create: async (input: { title: string; due_date?: string | null }) =>
    todoRepository.create(input),
  update: async (input: { id: number; title?: string; due_date?: string | null }) =>
    todoRepository.update(input),
  delete: async (id: number) => todoRepository.delete(id),
  toggle: async (id: number) => todoRepository.toggle(id),
};

export type TodoService = typeof todoService;
