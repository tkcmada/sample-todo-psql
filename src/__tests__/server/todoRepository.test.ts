import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TodoRepository } from '@/server/repositories/todoRepository';

let repo: TodoRepository;

describe('MemoryTodoRepository', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('USE_LOCAL_DB', 'true');
    ({ todoRepository: repo } = await import('@/server/repositories/todoRepository'));
  });

  it('creates and retrieves todos', async () => {
    await repo.create({ title: 'Test', due_date: null });
    const all = await repo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Test');
    expect(all[0].auditLogs).toHaveLength(1);
  });

  it('updates todo', async () => {
    const created = await repo.create({ title: 'Old', due_date: null });
    const updated = await repo.update({ id: created.id, title: 'New' });
    expect(updated.title).toBe('New');
  });

  it('deletes todo', async () => {
    const created = await repo.create({ title: 'Delete', due_date: null });
    await repo.delete(created.id);
    const all = await repo.getAll();
    expect(all).toHaveLength(0);
  });

  it('toggles done flag', async () => {
    const created = await repo.create({ title: 'Toggle', due_date: null });
    const toggled = await repo.toggle(created.id);
    expect(toggled.done_flag).toBe(true);
  });
});
