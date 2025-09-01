import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '../../db';
import { todos } from '../../db/schema';
import { createTodoSchema, updateTodoSchema, deleteTodoSchema, toggleTodoSchema } from '../../../lib/validations';
import { eq, desc, isNull } from 'drizzle-orm';

export const todoRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await db.select().from(todos).where(isNull(todos.deleted_at)).orderBy(desc(todos.created_at));
  }),

  create: publicProcedure
    .input(createTodoSchema)
    .mutation(async ({ input }) => {
      const [newTodo] = await db.insert(todos).values({
        title: input.title,
        due_date: input.due_date || null,
      }).returning();
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
      return updatedTodo;
    }),

  delete: publicProcedure
    .input(deleteTodoSchema)
    .mutation(async ({ input }) => {
      await db
        .update(todos)
        .set({ deleted_at: new Date() })
        .where(eq(todos.id, input.id));
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
      return updatedTodo;
    }),
});