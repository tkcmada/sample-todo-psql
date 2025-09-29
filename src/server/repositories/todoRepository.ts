import { eq, desc, isNull } from 'drizzle-orm';
import { todo, audit_log } from '@/server/db/schema';
import type { Todo } from '@/lib/types-generated';
import type { TodoWithAuditLogs } from '@/lib/types-composite';
import type { TodoDB, TodoWithAuditLogsDB, serializeTodo, serializeTodoWithAuditLogs } from '@/lib/types-db';
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
  async getAll(): Promise<TodoWithAuditLogs[]> {
    const db = await getDb();
    const todoFromDb = await db.query.todo.findMany({
      where: isNull(todo.deleted_at),
      with: {
        audit_log: {
          orderBy: desc(audit_log.created_at),
        },
      },
      orderBy: desc(todo.created_at),
    });

    // Convert database results to API types
    return todoFromDb.map(todo => ({
      id: todo.id,
      title: todo.title,
      due_date: todo.due_date,
      done_flag: todo.done_flag,
      created_at: todo.created_at.toISOString(),
      updated_at: todo.updated_at.toISOString(),
      deleted_at: todo.deleted_at?.toISOString() ?? null,
      auditLogs: todo.audit_log.map(auditLog => ({
        id: auditLog.id,
        todo_id: auditLog.todo_id,
        action: auditLog.action,
        old_values: auditLog.old_values,
        new_values: auditLog.new_values,
        created_at: auditLog.created_at.toISOString(),
      })),
    }));
  }

  async create(input: { title: string; due_date?: string | null }): Promise<Todo> {
    const db = await getDb();
    const [newTodo] = await db
      .insert(todo)
      .values({ title: input.title, due_date: input.due_date ?? null })
      .returning();

    await db.insert(audit_log).values({
      todo_id: newTodo.id,
      action: 'CREATE',
      old_values: null,
      new_values: JSON.stringify({
        title: newTodo.title,
        due_date: newTodo.due_date,
        done_flag: newTodo.done_flag,
      }),
    });

    // Convert to API type
    return {
      id: newTodo.id,
      title: newTodo.title,
      due_date: newTodo.due_date,
      done_flag: newTodo.done_flag,
      created_at: newTodo.created_at.toISOString(),
      updated_at: newTodo.updated_at.toISOString(),
      deleted_at: newTodo.deleted_at?.toISOString() ?? null,
    };
  }

  async update(input: { id: number; title?: string; due_date?: string | null }): Promise<Todo> {
    const db = await getDb();
    const { id, ...data } = input;
    const [existingTodo] = await db.select().from(todo).where(eq(todo.id, id));
    if (!existingTodo || existingTodo.deleted_at) {
      throw new Error('Todo not found or has been deleted');
    }

    const [updatedTodo] = await db
      .update(todo)
      .set({ ...data, updated_at: new Date() })
      .where(eq(todo.id, id))
      .returning();

    await db.insert(audit_log).values({
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

    // Convert to API type
    return {
      id: updatedTodo.id,
      title: updatedTodo.title,
      due_date: updatedTodo.due_date,
      done_flag: updatedTodo.done_flag,
      created_at: updatedTodo.created_at.toISOString(),
      updated_at: updatedTodo.updated_at.toISOString(),
      deleted_at: updatedTodo.deleted_at?.toISOString() ?? null,
    };
  }

  async delete(id: number) {
    const db = await getDb();
    const [existingTodo] = await db.select().from(todo).where(eq(todo.id, id));
    await db.update(todo).set({ deleted_at: new Date() }).where(eq(todo.id, id));

    if (existingTodo) {
      await db.insert(audit_log).values({
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

  async toggle(id: number): Promise<Todo> {
    const db = await getDb();
    const [todoRecord] = await db.select().from(todo).where(eq(todo.id, id));
    if (!todoRecord || todoRecord.deleted_at) throw new Error('Todo not found or has been deleted');

    const [updatedTodo] = await db
      .update(todo)
      .set({ done_flag: !todoRecord.done_flag, updated_at: new Date() })
      .where(eq(todo.id, id))
      .returning();

    await db.insert(audit_log).values({
      todo_id: updatedTodo.id,
      action: 'TOGGLE',
      old_values: JSON.stringify({ done_flag: todoRecord.done_flag }),
      new_values: JSON.stringify({ done_flag: updatedTodo.done_flag }),
    });

    // Convert to API type
    return {
      id: updatedTodo.id,
      title: updatedTodo.title,
      due_date: updatedTodo.due_date,
      done_flag: updatedTodo.done_flag,
      created_at: updatedTodo.created_at.toISOString(),
      updated_at: updatedTodo.updated_at.toISOString(),
      deleted_at: updatedTodo.deleted_at?.toISOString() ?? null,
    };
  }
}

let repository: TodoRepository;
export function getTodoRepository(): TodoRepository {
  if (!repository) {
    repository = new PgTodoRepository();
  }
  return repository;
}

export const todoRepository = getTodoRepository();
