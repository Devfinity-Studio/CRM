import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	companies,
	contacts,
	dealProducts,
	deals,
	pipelineStages,
	pipelines,
	products,
	users,
} from "~/server/db/schema";
import { syncDealInventoryHolds } from "~/server/api/services/deal-inventory";

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

	// Get all deals for a specific client company
	getDealsByCompanyId: protectedProcedure
		.input(z.object({ companyId: z.string() }))
		.query(async ({ ctx, input }) => {
			const allCompanyDeals = await ctx.db
				.select({
					deal: deals,
					stage: pipelineStages,
					pipeline: pipelines,
				})
				.from(deals)
				.leftJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
				.leftJoin(pipelines, eq(deals.pipelineId, pipelines.id))
				.where(
					and(
						eq(deals.companyId, input.companyId),
						eq(deals.organizationId, ctx.session.user.organizationId),
					),
				)
				.orderBy(desc(deals.createdAt));

			return allCompanyDeals.map(({ deal, stage, pipeline }) => ({
				...deal,
				stageName: stage?.name || "Unknown Stage",
				stageColor: stage?.color || "#6366f1",
				pipelineName: pipeline?.name || "Default Pipeline",
			}));
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

			if (updatedDeal) {
				await syncDealInventoryHolds(ctx.db, ctx.session.user.organizationId);
			}
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

			if (updatedDeal) {
				await syncDealInventoryHolds(ctx.db, ctx.session.user.organizationId);
			}
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
			const [updated] = await ctx.db
				.update(deals)
				.set({ status: input.status, updatedAt: new Date() })
				.where(
					and(
						eq(deals.id, input.dealId),
						eq(deals.organizationId, ctx.session.user.organizationId),
					),
				)
				.returning();

			await syncDealInventoryHolds(ctx.db, ctx.session.user.organizationId);
			return updated;
		}),

	// Get SKU line items attached to a deal
	getDealProducts: protectedProcedure
		.input(z.object({ dealId: z.string() }))
		.query(async ({ ctx, input }) => {
			const items = await ctx.db
				.select({
					id: dealProducts.id,
					dealId: dealProducts.dealId,
					productId: dealProducts.productId,
					quantity: dealProducts.quantity,
					unitPrice: dealProducts.unitPrice,
					createdAt: dealProducts.createdAt,
					productName: products.name,
					sku: products.sku,
					stockQuantity: products.stockQuantity,
					reservedQuantity: products.reservedQuantity,
				})
				.from(dealProducts)
				.innerJoin(products, eq(dealProducts.productId, products.id))
				.where(
					and(
						eq(dealProducts.dealId, input.dealId),
						eq(dealProducts.organizationId, ctx.session.user.organizationId),
					),
				);

			return items.map((i) => ({
				...i,
				availableStock: Math.max(0, i.stockQuantity - i.reservedQuantity),
			}));
		}),

	// Set SKU line items for a deal and update soft inventory holds
	setDealProducts: protectedProcedure
		.input(
			z.object({
				dealId: z.string(),
				items: z.array(
					z.object({
						productId: z.string(),
						quantity: z.number().min(1),
						unitPrice: z.number().min(0),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.session.user.organizationId;
			const deal = await ctx.db.query.deals.findFirst({
				where: and(eq(deals.id, input.dealId), eq(deals.organizationId, orgId)),
			});
			if (!deal) throw new Error("Deal not found");

			await ctx.db
				.delete(dealProducts)
				.where(eq(dealProducts.dealId, input.dealId));

			if (input.items.length > 0) {
				await ctx.db.insert(dealProducts).values(
					input.items.map((it) => ({
						organizationId: orgId,
						dealId: input.dealId,
						productId: it.productId,
						quantity: it.quantity,
						unitPrice: it.unitPrice,
					})),
				);
			}

			const totalValue = input.items.reduce(
				(sum, it) => sum + it.quantity * it.unitPrice,
				0,
			);
			await ctx.db
				.update(deals)
				.set({ value: totalValue, updatedAt: new Date() })
				.where(eq(deals.id, input.dealId));

			await syncDealInventoryHolds(
				ctx.db,
				orgId,
				input.items.map((it) => it.productId),
			);

			return { success: true, totalValue };
		}),
});
