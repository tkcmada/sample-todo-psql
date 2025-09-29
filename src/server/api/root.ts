import { createTRPCRouter } from './trpc';
import { todoRouter } from './routers/todo';
import { userRouter } from './routers/user';
import { orgChartRouter } from './routers/orgChart';

export const appRouter = createTRPCRouter({
  todo: todoRouter,
  user: userRouter,
  orgChart: orgChartRouter,
});

export type AppRouter = typeof appRouter;