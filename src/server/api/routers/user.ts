import { createTRPCRouter, publicProcedure } from '../trpc';
import { userService } from '@/server/services/userService';
import { createUserSchema, updateUserSchema, deleteUserSchema } from '@/lib/validations';
import { z } from 'zod';

export const userRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    return await userService.getAll();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await userService.getById(input.id);
    }),

  create: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      return await userService.create(input);
    }),

  update: publicProcedure
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      return await userService.update(input);
    }),

  delete: publicProcedure
    .input(deleteUserSchema)
    .mutation(async ({ input }) => {
      return await userService.delete(input.id);
    }),
});