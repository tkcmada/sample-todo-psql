import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@/server/db/schema';
import type { TodoRepository } from '@/server/repositories/todoRepository';

let repo: TodoRepository;
let pg: PGlite;
let db: ReturnType<typeof drizzle>;

describe('PgTodoRepository with PGlite', () => {
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
    ({ todoRepository: repo } = await import('@/server/repositories/todoRepository'));
    await db.delete(schema.audit_log);
    await db.delete(schema.todo);
  });

  afterAll(async () => {
    await pg.close();
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
