import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	companies,
	contacts,
	deals,
	pipelineStages,
	pipelines,
	users,
} from "~/server/db/schema";

export const dealsRouter = createTRPCRouter({
	// Get all pipelines for tenant organization
	getPipelines: protectedProcedure
		.input(z.object({ organizationId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db
				.select()
				.from(pipelines)
				.where(eq(pipelines.organizationId, input.organizationId));
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

	// Get deals for a pipeline with enriched company, contact, and user rep details
	getDeals: protectedProcedure
		.input(z.object({ organizationId: z.string(), pipelineId: z.string() }))
		.query(async ({ ctx, input }) => {
			const allDeals = await ctx.db
				.select({
					deal: deals,
					contact: {
						firstName: contacts.firstName,
						lastName: contacts.lastName,
						leadScore: contacts.leadScore,
						qualificationStatus: contacts.qualificationStatus,
					},
					company: {
						id: companies.id,
						name: companies.name,
						logoUrl: companies.logoUrl,
					},
					assignedUser: {
						id: users.id,
						name: users.name,
						image: users.image,
					},
				})
				.from(deals)
				.leftJoin(contacts, eq(deals.contactId, contacts.id))
				.leftJoin(companies, eq(deals.companyId, companies.id))
				.leftJoin(users, eq(deals.assignedUserId, users.id))
				.where(
					and(
						eq(deals.organizationId, input.organizationId),
						eq(deals.pipelineId, input.pipelineId),
					),
				)
				.orderBy(asc(deals.orderIndex));

			return allDeals.map(({ deal, contact, company, assignedUser }) => ({
				...deal,
				leadScore: contact?.leadScore || 0,
				qualificationStatus: contact?.qualificationStatus || "NONE",
				contactName: contact
					? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
					: null,
				companyName: company?.name || null,
				companyLogo: company?.logoUrl || null,
				assignedUserName: assignedUser?.name || null,
				assignedUserImage: assignedUser?.image || null,
			}));
		}),

	// Get detailed deal by ID for DealSheet preview
	getDeal: protectedProcedure
		.input(z.object({ dealId: z.string() }))
		.query(async ({ ctx, input }) => {
			const [result] = await ctx.db
				.select({
					deal: deals,
					contact: contacts,
					company: companies,
					assignedUser: {
						id: users.id,
						name: users.name,
						image: users.image,
						email: users.email,
					},
					stage: pipelineStages,
					pipeline: pipelines,
				})
				.from(deals)
				.leftJoin(contacts, eq(deals.contactId, contacts.id))
				.leftJoin(companies, eq(deals.companyId, companies.id))
				.leftJoin(users, eq(deals.assignedUserId, users.id))
				.leftJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
				.leftJoin(pipelines, eq(deals.pipelineId, pipelines.id))
				.where(
					and(
						eq(deals.id, input.dealId),
						eq(deals.organizationId, ctx.session.user.organizationId),
					),
				);

			if (!result) return null;
			return {
				...result.deal,
				contact: result.contact,
				company: result.company,
				assignedUser: result.assignedUser,
				stage: result.stage,
				pipeline: result.pipeline,
			};
		}),

	// Move deal to a new stage / update index
	moveDeal: protectedProcedure
		.input(
			z.object({
				dealId: z.string(),
				targetStageId: z.string(),
				newOrderIndex: z.number().default(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [updatedDeal] = await ctx.db
				.update(deals)
				.set({
					stageId: input.targetStageId,
					orderIndex: input.newOrderIndex,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(deals.id, input.dealId),
						eq(deals.organizationId, ctx.session.user.organizationId),
					),
				)
				.returning();

			return updatedDeal;
		}),

	// Alias for moveDeal satisfying REQ-42-03
	updateDealStage: protectedProcedure
		.input(
			z.object({
				dealId: z.string(),
				targetStageId: z.string(),
				newOrderIndex: z.number().optional().default(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const [updatedDeal] = await ctx.db
				.update(deals)
				.set({
					stageId: input.targetStageId,
					orderIndex: input.newOrderIndex,
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(deals.id, input.dealId),
						eq(deals.organizationId, ctx.session.user.organizationId),
					),
				)
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
				expectedCloseDate: z.date().optional(),
			}),
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
				.where(
					and(
						eq(deals.organizationId, input.organizationId),
						eq(deals.pipelineId, input.pipelineId),
					),
				);

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
			const winRate =
				closedDealsCount > 0
					? Math.round((wonDealsCount / closedDealsCount) * 100)
					: 0;

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
		.input(
			z.object({ dealId: z.string(), status: z.enum(["OPEN", "WON", "LOST"]) }),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db
				.update(deals)
				.set({ status: input.status, updatedAt: new Date() })
				.where(
					and(
						eq(deals.id, input.dealId),
						eq(deals.organizationId, ctx.session.user.organizationId),
					),
				);
		}),
});
