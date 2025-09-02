import { createTRPCRouter, publicProcedure } from '../trpc';
import { todoRepository } from '@/server/repositories/todoRepository';
import { createTodoSchema, updateTodoSchema, deleteTodoSchema, toggleTodoSchema } from '@/lib/validations';

export const todoRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await todoRepository.getAll();
  }),

  create: publicProcedure
    .input(createTodoSchema)
    .mutation(async ({ input }) => {
      return await todoRepository.create(input);
    }),

  update: publicProcedure
    .input(updateTodoSchema)
    .mutation(async ({ input }) => {
      return await todoRepository.update(input);
    }),

  delete: publicProcedure
    .input(deleteTodoSchema)
    .mutation(async ({ input }) => {
      return await todoRepository.delete(input.id);
    }),

  toggle: publicProcedure
    .input(toggleTodoSchema)
    .mutation(async ({ input }) => {
      return await todoRepository.toggle(input.id);
    }),
});
