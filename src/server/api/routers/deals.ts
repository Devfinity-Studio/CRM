import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { deals, pipelineStages, pipelines, contacts } from "~/server/db/schema";
import { eq, asc, desc, and } from "drizzle-orm";

export const dealsRouter = createTRPCRouter({
  // Get all pipelines for tenant organization
  getPipelines: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(pipelines).where(eq(pipelines.organizationId, input.organizationId));
    }),

  // Get stages for a pipeline
  getStages: protectedProcedure
    .input(z.object({ pipelineId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.pipelineId, input.pipelineId))
        .orderBy(asc(pipelineStages.orderIndex));
    }),

  // Get deals for a pipeline
  getDeals: protectedProcedure
    .input(z.object({ organizationId: z.string(), pipelineId: z.string() }))
    .query(async ({ ctx, input }) => {
      const allDeals = await ctx.db
        .select({
          deal: deals,
          contact: {
            leadScore: contacts.leadScore,
            qualificationStatus: contacts.qualificationStatus,
          },
        })
        .from(deals)
        .leftJoin(contacts, eq(deals.contactId, contacts.id))
        .where(and(eq(deals.organizationId, input.organizationId), eq(deals.pipelineId, input.pipelineId)))
        .orderBy(asc(deals.orderIndex));

      // Flatten the result so frontend doesn't break
      return allDeals.map(({ deal, contact }) => ({
        ...deal,
        leadScore: contact?.leadScore || 0,
        qualificationStatus: contact?.qualificationStatus || "NONE",
      }));
    }),

  // Move deal to a new stage / update index
  moveDeal: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        targetStageId: z.string(),
        newOrderIndex: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedDeal] = await ctx.db
        .update(deals)
        .set({
          stageId: input.targetStageId,
          orderIndex: input.newOrderIndex,
        })
        .where(eq(deals.id, input.dealId))
        .returning();

      return updatedDeal;
    }),

  // Create new deal
  createDeal: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        pipelineId: z.string(),
        stageId: z.string(),
        title: z.string().min(1),
        value: z.number().default(0),
        contactId: z.string().optional(),
        companyId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newDeal] = await ctx.db.insert(deals).values(input).returning();
      return newDeal;
    }),

  // Get pipeline metrics summary
  getMetricsSummary: protectedProcedure
    .input(z.object({ organizationId: z.string(), pipelineId: z.string() }))
    .query(async ({ ctx, input }) => {
      const allDeals = await ctx.db
        .select()
        .from(deals)
        .where(and(eq(deals.organizationId, input.organizationId), eq(deals.pipelineId, input.pipelineId)));

      const stages = await ctx.db
        .select()
        .from(pipelineStages)
        .where(eq(pipelineStages.pipelineId, input.pipelineId));

      let totalPipelineValue = 0;
      let forecastedRevenue = 0;
      let wonDealsCount = 0;
      let lostDealsCount = 0;
      let openDealsCount = 0;

      for (const deal of allDeals) {
        if (deal.status === "OPEN") {
          totalPipelineValue += deal.value;
          const stage = stages.find((s) => s.id === deal.stageId);
          if (stage) {
            forecastedRevenue += deal.value * (stage.winProbability / 100);
          }
          openDealsCount++;
        } else if (deal.status === "WON") {
          wonDealsCount++;
        } else if (deal.status === "LOST") {
          lostDealsCount++;
        }
      }

      const closedDealsCount = wonDealsCount + lostDealsCount;
      const winRate = closedDealsCount > 0 ? Math.round((wonDealsCount / closedDealsCount) * 100) : 0;

      return {
        totalDeals: allDeals.length,
        openDealsCount,
        wonDealsCount,
        lostDealsCount,
        totalPipelineValue,
        forecastedRevenue: Math.round(forecastedRevenue),
        winRate,
      };
    }),

  updateDealStatus: protectedProcedure
    .input(z.object({ dealId: z.string(), status: z.enum(["OPEN", "WON", "LOST"]) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db
        .update(deals)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(deals.id, input.dealId));
    }),
});
