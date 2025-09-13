import { eq, desc, isNull } from 'drizzle-orm';
import {
  todos,
  auditLogs,
  type Todo,
  type TodoWithAuditLogs,
} from '@/server/db/schema';
import type * as schema from '@/server/db/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;
async function getDb(): Promise<PostgresJsDatabase<typeof schema>> {
  if (!dbInstance) {
    dbInstance = (await import('@/server/db')).db;
  }
  return dbInstance;
}

export interface TodoRepository {
  getAll(): Promise<TodoWithAuditLogs[]>;
  create(input: { title: string; due_date?: string | null }): Promise<Todo>;
  update(input: { id: number; title?: string; due_date?: string | null }): Promise<Todo>;
  delete(id: number): Promise<{ success: true }>;
  toggle(id: number): Promise<Todo>;
}

class PgTodoRepository implements TodoRepository {
  async getAll() {
    const db = await getDb();
    return await db.query.todos.findMany({
      where: isNull(todos.deleted_at),
      with: {
        auditLogs: {
          orderBy: desc(auditLogs.created_at),
        },
      },
      orderBy: desc(todos.created_at),
    });
  }

  async create(input: { title: string; due_date?: string | null }) {
    const db = await getDb();
    const [newTodo] = await db
      .insert(todos)
      .values({ title: input.title, due_date: input.due_date ?? null })
      .returning();

    await db.insert(auditLogs).values({
      todo_id: newTodo.id,
      action: 'CREATE',
      old_values: null,
      new_values: JSON.stringify({
        title: newTodo.title,
        due_date: newTodo.due_date,
        done_flag: newTodo.done_flag,
      }),
    });

    return newTodo;
  }

  async update(input: { id: number; title?: string; due_date?: string | null }) {
    const db = await getDb();
    const { id, ...data } = input;
    const [existingTodo] = await db.select().from(todos).where(eq(todos.id, id));
    if (!existingTodo || existingTodo.deleted_at) {
      throw new Error('Todo not found or has been deleted');
    }

    const [updatedTodo] = await db
      .update(todos)
      .set({ ...data, updated_at: new Date() })
      .where(eq(todos.id, id))
      .returning();

    await db.insert(auditLogs).values({
      todo_id: updatedTodo.id,
      action: 'UPDATE',
      old_values: JSON.stringify({
        title: existingTodo.title,
        due_date: existingTodo.due_date,
        done_flag: existingTodo.done_flag,
      }),
      new_values: JSON.stringify({
        title: updatedTodo.title,
        due_date: updatedTodo.due_date,
        done_flag: updatedTodo.done_flag,
      }),
    });

    return updatedTodo;
  }

  async delete(id: number) {
    const db = await getDb();
    const [existingTodo] = await db.select().from(todos).where(eq(todos.id, id));
    await db.update(todos).set({ deleted_at: new Date() }).where(eq(todos.id, id));

    if (existingTodo) {
      await db.insert(auditLogs).values({
        todo_id: id,
        action: 'DELETE',
        old_values: JSON.stringify({
          title: existingTodo.title,
          due_date: existingTodo.due_date,
          done_flag: existingTodo.done_flag,
        }),
        new_values: null,
      });
    }

    return { success: true } as const;
  }

  async toggle(id: number) {
    const db = await getDb();
    const [todo] = await db.select().from(todos).where(eq(todos.id, id));
    if (!todo || todo.deleted_at) throw new Error('Todo not found or has been deleted');

    const [updatedTodo] = await db
      .update(todos)
      .set({ done_flag: !todo.done_flag, updated_at: new Date() })
      .where(eq(todos.id, id))
      .returning();

    await db.insert(auditLogs).values({
      todo_id: updatedTodo.id,
      action: 'TOGGLE',
      old_values: JSON.stringify({ done_flag: todo.done_flag }),
      new_values: JSON.stringify({ done_flag: updatedTodo.done_flag }),
    });

    return updatedTodo;
  }
}

let repository: TodoRepository | null = null;
export function getTodoRepository(): TodoRepository {
  if (!repository) {
    repository = new PgTodoRepository();
  }
  return repository;
}

export const todoRepository = getTodoRepository();
