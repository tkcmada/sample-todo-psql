import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TodoService } from '@/server/services/todoService';

let service: TodoService;

describe('todoService with memory repository', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('USE_LOCAL_DB', 'true');
    ({ todoService: service } = await import('@/server/services/todoService'));
  });

  it('creates and fetches todos', async () => {
    const created = await service.create({ title: 'Integration', due_date: null });
    const all = await service.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(created.id);
  });

  it('toggles todo status', async () => {
    const created = await service.create({ title: 'Toggle', due_date: null });
    await service.toggle(created.id);
    const all = await service.getAll();
    expect(all[0].done_flag).toBe(true);
  });
});
