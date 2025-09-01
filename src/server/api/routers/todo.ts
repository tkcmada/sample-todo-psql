import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '../../db';
import { todos, auditLogs } from '../../db/schema';
import { createTodoSchema, updateTodoSchema, deleteTodoSchema, toggleTodoSchema } from '../../../lib/validations';
import { eq, desc, isNull } from 'drizzle-orm';

// Audit記録用ヘルパー関数
async function createAuditLog(todoId: number, action: string, oldValues?: any, newValues?: any) {
  await db.insert(auditLogs).values({
    todo_id: todoId,
    action,
    old_values: oldValues ? JSON.stringify(oldValues) : null,
    new_values: newValues ? JSON.stringify(newValues) : null,
  });
}

export const todoRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await db.query.todos.findMany({
      where: isNull(todos.deleted_at),
      with: {
        auditLogs: {
          orderBy: desc(auditLogs.created_at),
        },
      },
      orderBy: desc(todos.created_at),
    });
  }),

  create: publicProcedure
    .input(createTodoSchema)
    .mutation(async ({ input }) => {
      const [newTodo] = await db.insert(todos).values({
        title: input.title,
        due_date: input.due_date || null,
      }).returning();
      
      // Audit記録
      await createAuditLog(newTodo.id, 'CREATE', null, {
        title: newTodo.title,
        due_date: newTodo.due_date,
        done_flag: newTodo.done_flag,
      });
      
      return newTodo;
    }),

  update: publicProcedure
    .input(updateTodoSchema)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      
      // 削除済みレコードへの操作を防ぐ
      const [existingTodo] = await db.select().from(todos).where(eq(todos.id, id));
      if (!existingTodo || existingTodo.deleted_at) {
        throw new Error('Todo not found or has been deleted');
      }
      
      const [updatedTodo] = await db
        .update(todos)
        .set({ ...updateData, updated_at: new Date() })
        .where(eq(todos.id, id))
        .returning();
      
      // Audit記録
      await createAuditLog(updatedTodo.id, 'UPDATE', {
        title: existingTodo.title,
        due_date: existingTodo.due_date,
        done_flag: existingTodo.done_flag,
      }, {
        title: updatedTodo.title,
        due_date: updatedTodo.due_date,
        done_flag: updatedTodo.done_flag,
      });
      
      return updatedTodo;
    }),

  delete: publicProcedure
    .input(deleteTodoSchema)
    .mutation(async ({ input }) => {
      // 削除前の状態を取得
      const [existingTodo] = await db.select().from(todos).where(eq(todos.id, input.id));
      
      await db
        .update(todos)
        .set({ deleted_at: new Date() })
        .where(eq(todos.id, input.id));
      
      // Audit記録
      if (existingTodo) {
        await createAuditLog(input.id, 'DELETE', {
          title: existingTodo.title,
          due_date: existingTodo.due_date,
          done_flag: existingTodo.done_flag,
        }, null);
      }
      
      return { success: true };
    }),

  toggle: publicProcedure
    .input(toggleTodoSchema)
    .mutation(async ({ input }) => {
      const [todo] = await db.select().from(todos).where(eq(todos.id, input.id));
      if (!todo || todo.deleted_at) throw new Error('Todo not found or has been deleted');
      
      const [updatedTodo] = await db
        .update(todos)
        .set({ 
          done_flag: !todo.done_flag,
          updated_at: new Date() 
        })
        .where(eq(todos.id, input.id))
        .returning();
      
      // Audit記録
      await createAuditLog(updatedTodo.id, 'TOGGLE', {
        done_flag: todo.done_flag,
      }, {
        done_flag: updatedTodo.done_flag,
      });
      
      return updatedTodo;
    }),
});