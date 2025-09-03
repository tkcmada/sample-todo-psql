import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCallerFactory } from '@trpc/server';
import { todoRouter } from '@/server/api/routers/todo';
import { todoService } from '@/server/services/todoService';

vi.mock('@/server/services/todoService', () => ({
  todoService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggle: vi.fn(),
  },
}));

describe('Todo Router', () => {
  const createCaller = createCallerFactory();
  const caller = createCaller(todoRouter)({ req: {} as any });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return todos', async () => {
    const todos = [{ id: 1 }];
    (todoService.getAll as any).mockResolvedValue(todos);
    const result = await caller.getAll();
    expect(todoService.getAll).toHaveBeenCalled();
    expect(result).toEqual(todos);
  });

  it('should create todo', async () => {
    const input = { title: 'Test', due_date: null };
    const newTodo = { id: 1, ...input };
    (todoService.create as any).mockResolvedValue(newTodo);
    const result = await caller.create(input);
    expect(todoService.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(newTodo);
  });

  it('should update todo', async () => {
    const input = { id: 1, title: 'Updated', due_date: null };
    const updated = { ...input };
    (todoService.update as any).mockResolvedValue(updated);
    const result = await caller.update(input);
    expect(todoService.update).toHaveBeenCalledWith(input);
    expect(result).toEqual(updated);
  });

  it('should delete todo', async () => {
    (todoService.delete as any).mockResolvedValue({ success: true });
    const result = await caller.delete({ id: 1 });
    expect(todoService.delete).toHaveBeenCalledWith(1);
    expect(result).toEqual({ success: true });
  });

  it('should toggle todo', async () => {
    const toggled = { id: 1, done_flag: true };
    (todoService.toggle as any).mockResolvedValue(toggled);
    const result = await caller.toggle({ id: 1 });
    expect(todoService.toggle).toHaveBeenCalledWith(1);
    expect(result).toEqual(toggled);
  });
});
