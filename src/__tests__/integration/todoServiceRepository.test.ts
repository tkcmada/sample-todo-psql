import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@/server/db/schema';
import type { TodoService } from '@/server/services/todoService';

let service: TodoService;
let pg: PGlite;
let db: ReturnType<typeof drizzle>;

describe('todoService with Pg repository', () => {
  beforeAll(async () => {
    pg = new PGlite();
    db = drizzle(pg, { schema });
    await pg.exec(`
      CREATE TABLE IF NOT EXISTS "todos" (
        id serial PRIMARY KEY,
        title text NOT NULL,
        due_date date,
        done_flag boolean DEFAULT false NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL,
        deleted_at timestamp
      );
    `);
    await pg.exec(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        id serial PRIMARY KEY,
        todo_id integer NOT NULL REFERENCES todos(id),
        action text NOT NULL,
        old_values text,
        new_values text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
  });

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('@/server/db', () => ({ db }));
    ({ todoService: service } = await import('@/server/services/todoService'));
    await db.delete(schema.auditLogs);
    await db.delete(schema.todos);
  });

  afterAll(async () => {
    await pg.close();
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
