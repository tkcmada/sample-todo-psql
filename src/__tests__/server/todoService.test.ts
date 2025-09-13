import { describe, it, expect, vi, beforeEach } from 'vitest';
import { todoService } from '@/server/services/todoService';
import { todoRepository } from '@/server/repositories/todoRepository';

vi.mock('@/server/repositories/todoRepository', () => ({
  todoRepository: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggle: vi.fn(),
  },
}));

describe('todoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates getAll to repository', async () => {
    (todoRepository.getAll as any).mockResolvedValue([{ id: 1 }]);
    const result = await todoService.getAll();
    expect(todoRepository.getAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1 }]);
  });

  it('delegates create to repository', async () => {
    const input = { title: 'Test', due_date: null };
    const created = { id: 1, ...input, done_flag: false };
    (todoRepository.create as any).mockResolvedValue(created);
    const result = await todoService.create(input);
    expect(todoRepository.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(created);
  });

  it('delegates update to repository', async () => {
    const input = { id: 1, title: 'Updated', due_date: null };
    (todoRepository.update as any).mockResolvedValue(input);
    const result = await todoService.update(input);
    expect(todoRepository.update).toHaveBeenCalledWith(input);
    expect(result).toEqual(input);
  });

  it('delegates delete to repository', async () => {
    (todoRepository.delete as any).mockResolvedValue({ success: true });
    const result = await todoService.delete(1);
    expect(todoRepository.delete).toHaveBeenCalledWith(1);
    expect(result).toEqual({ success: true });
  });

  it('delegates toggle to repository', async () => {
    const toggled = { id: 1, done_flag: true };
    (todoRepository.toggle as any).mockResolvedValue(toggled);
    const result = await todoService.toggle(1);
    expect(todoRepository.toggle).toHaveBeenCalledWith(1);
    expect(result).toEqual(toggled);
  });
});
