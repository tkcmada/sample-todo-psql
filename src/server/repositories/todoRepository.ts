import { eq, desc, isNull } from 'drizzle-orm';
import { todos, auditLogs, type Todo, type AuditLog, type TodoWithAuditLogs } from '@/server/db/schema';

let dbInstance: any;
async function getDb() {
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

class MemoryTodoRepository implements TodoRepository {
  private todos: Todo[] = [];
  private auditLogs: AuditLog[] = [];
  private todoId = 1;
  private auditId = 1;

  async getAll() {
    return this.todos
      .filter((t) => t.deleted_at === null)
      .map((t) => ({
        ...t,
        auditLogs: this.auditLogs
          .filter((a) => a.todo_id === t.id)
          .sort((a, b) => b.created_at.getTime() - a.created_at.getTime()),
      }));
  }

  async create(input: { title: string; due_date?: string | null }) {
    const newTodo: Todo = {
      id: this.todoId++,
      title: input.title,
      due_date: input.due_date ?? null,
      done_flag: false,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };
    this.todos.push(newTodo);

    this.auditLogs.push({
      id: this.auditId++,
      todo_id: newTodo.id,
      action: 'CREATE',
      old_values: null,
      new_values: JSON.stringify({
        title: newTodo.title,
        due_date: newTodo.due_date,
        done_flag: newTodo.done_flag,
      }),
      created_at: new Date(),
    });

    return newTodo;
  }

  async update(input: { id: number; title?: string; due_date?: string | null }) {
    const todo = this.todos.find((t) => t.id === input.id && t.deleted_at === null);
    if (!todo) throw new Error('Todo not found or has been deleted');

    const oldValues = {
      title: todo.title,
      due_date: todo.due_date,
      done_flag: todo.done_flag,
    };

    if (input.title !== undefined) todo.title = input.title;
    if (input.due_date !== undefined) todo.due_date = input.due_date;
    todo.updated_at = new Date();

    this.auditLogs.push({
      id: this.auditId++,
      todo_id: todo.id,
      action: 'UPDATE',
      old_values: JSON.stringify(oldValues),
      new_values: JSON.stringify({
        title: todo.title,
        due_date: todo.due_date,
        done_flag: todo.done_flag,
      }),
      created_at: new Date(),
    });

    return todo;
  }

  async delete(id: number) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo && todo.deleted_at === null) {
      const oldValues = {
        title: todo.title,
        due_date: todo.due_date,
        done_flag: todo.done_flag,
      };
      todo.deleted_at = new Date();
      this.auditLogs.push({
        id: this.auditId++,
        todo_id: id,
        action: 'DELETE',
        old_values: JSON.stringify(oldValues),
        new_values: null,
        created_at: new Date(),
      });
    }
    return { success: true } as const;
  }

  async toggle(id: number) {
    const todo = this.todos.find((t) => t.id === id && t.deleted_at === null);
    if (!todo) throw new Error('Todo not found or has been deleted');
    const oldDone = todo.done_flag;
    todo.done_flag = !todo.done_flag;
    todo.updated_at = new Date();
    this.auditLogs.push({
      id: this.auditId++,
      todo_id: todo.id,
      action: 'TOGGLE',
      old_values: JSON.stringify({ done_flag: oldDone }),
      new_values: JSON.stringify({ done_flag: todo.done_flag }),
      created_at: new Date(),
    });
    return todo;
  }
}

let repository: TodoRepository | null = null;
export function getTodoRepository(): TodoRepository {
  if (!repository) {
    repository = process.env.USE_LOCAL_DB === 'true'
      ? new MemoryTodoRepository()
      : new PgTodoRepository();
  }
  return repository;
}

export const todoRepository = getTodoRepository();
