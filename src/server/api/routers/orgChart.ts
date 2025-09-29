import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import { team_structure_page } from '@/server/db/schema';
import {
  createTeamStructurePageSchema,
  updateTeamStructurePageSchema,
  deleteTeamStructurePageSchema,
} from '@/lib/validations';

export const orgChartRouter = createTRPCRouter({
  // ユーザー管理
  getAllUsers: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.query.user.findMany();
    }),

  // チーム体制図ページ管理
  getAllPages: publicProcedure
    .query(async ({ ctx }) => {
      try {
        // First try without where clause
        const result = await ctx.db.select().from(team_structure_page);
        console.log('getAllPages result:', result);
        return result.filter(page => page.is_active);
      } catch (error) {
        console.error('getAllPages error:', error);
        throw error;
      }
    }),

  getPageById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.select()
        .from(team_structure_page)
        .where(eq(team_structure_page.id, input.id))
        .limit(1)
        .then(rows => rows[0] || null);
    }),

  createPage: publicProcedure
    .input(createTeamStructurePageSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.insert(team_structure_page)
        .values(input)
        .returning();
    }),

  updatePage: publicProcedure
    .input(updateTeamStructurePageSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return await ctx.db.update(team_structure_page)
        .set({
          ...updateData,
          updated_at: new Date(),
        })
        .where(eq(team_structure_page.id, id))
        .returning();
    }),

  deletePage: publicProcedure
    .input(deleteTeamStructurePageSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.update(team_structure_page)
        .set({
          is_active: false,
          updated_at: new Date(),
        })
        .where(eq(team_structure_page.id, input.id))
        .returning();
    }),

  // チャートデータ保存（ドラッグ&ドロップ、線の追加・削除用）
  saveChartData: publicProcedure
    .input(z.object({
      pageId: z.number(),
      chartData: z.object({
        nodes: z.array(z.any()),
        edges: z.array(z.any()),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.update(team_structure_page)
        .set({
          chart_data: input.chartData,
          updated_at: new Date(),
        })
        .where(eq(team_structure_page.id, input.pageId))
        .returning();
    }),
});