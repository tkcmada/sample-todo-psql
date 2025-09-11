import { createTRPCRouter } from './trpc';
import { todoRouter } from './routers/todo';
import { userRouter } from './routers/user';

export const appRouter = createTRPCRouter({
  todo: todoRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;