import { createTRPCRouter, publicProcedure } from '../trpc';
import { todoService } from '@/server/services/todoService';
import { createTodoSchema, updateTodoSchema, deleteTodoSchema, toggleTodoSchema } from '@/lib/validations';

export const todoRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await todoService.getAll();
  }),

  create: publicProcedure
    .input(createTodoSchema)
    .mutation(async ({ input }) => {
      return await todoService.create(input);
    }),

  update: publicProcedure
    .input(updateTodoSchema)
    .mutation(async ({ input }) => {
      return await todoService.update(input);
    }),

  delete: publicProcedure
    .input(deleteTodoSchema)
    .mutation(async ({ input }) => {
      return await todoService.delete(input.id);
    }),

  toggle: publicProcedure
    .input(toggleTodoSchema)
    .mutation(async ({ input }) => {
      return await todoService.toggle(input.id);
    }),
});
