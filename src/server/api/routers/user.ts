import { createTRPCRouter, publicProcedure } from '../trpc';
import { userService } from '@/server/services/userService';
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
});