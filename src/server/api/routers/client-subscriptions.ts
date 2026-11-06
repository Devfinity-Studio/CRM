import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
	computeNextRenewalDate,
	processSubscriptionRenewals,
} from "~/server/api/services/subscription-engine";
import {
	createTRPCRouter,
	protectedProcedure,
	resolveTenantContext,
} from "~/server/api/trpc";
import {
	clientSubscriptions,
	companies,
	products,
} from "~/server/db/schema";

export const clientSubscriptionsRouter = createTRPCRouter({
	getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
		const tenant = await resolveTenantContext(ctx);

		return ctx.db.query.clientSubscriptions.findMany({
			where: eq(clientSubscriptions.organizationId, tenant.organizationId),
			with: {
				company: true,
				product: true,
			},
			orderBy: (subs, { asc }) => [asc(subs.nextRenewalDate)],
		});
	}),

	createSubscription: protectedProcedure
		.input(
			z.object({
				companyId: z.string(),
				productId: z.string(),
				billingCycle: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
				price: z.number().min(0),
				startDate: z.date(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);

			// Multi-tenant security check: ensure company and product belong to tenant organization
			const targetCompany = await ctx.db.query.companies?.findFirst({
				where: and(
					eq(companies.id, input.companyId),
					eq(companies.organizationId, tenant.organizationId),
				),
			});
			if (ctx.db.query.companies && !targetCompany) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Company not found in active organization",
				});
			}

			const targetProduct = await ctx.db.query.products?.findFirst({
				where: and(
					eq(products.id, input.productId),
					eq(products.organizationId, tenant.organizationId),
				),
			});
			if (ctx.db.query.products && !targetProduct) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found in active organization",
				});
			}

			const nextRenewalDate = computeNextRenewalDate(
				input.startDate,
				input.billingCycle,
			);

			const [sub] = await ctx.db
				.insert(clientSubscriptions)
				.values({
					organizationId: tenant.organizationId,
					companyId: input.companyId,
					productId: input.productId,
					status: "ACTIVE",
					billingCycle: input.billingCycle,
					price: input.price,
					startDate: input.startDate,
					nextRenewalDate: nextRenewalDate,
				})
				.returning();

			return sub;
		}),

	updateSubscription: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(["ACTIVE", "CANCELLED", "EXPIRED"]),
				price: z.number().min(0),
				nextRenewalDate: z.date(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);
			const { id, ...data } = input;

			const [sub] = await ctx.db
				.update(clientSubscriptions)
				.set(data)
				.where(
					and(
						eq(clientSubscriptions.id, id),
						eq(clientSubscriptions.organizationId, tenant.organizationId),
					),
				)
				.returning();

			if (!sub) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Subscription not found",
				});
			}
			return sub;
		}),

	deleteSubscription: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);

			await ctx.db
				.delete(clientSubscriptions)
				.where(
					and(
						eq(clientSubscriptions.id, input.id),
						eq(clientSubscriptions.organizationId, tenant.organizationId),
					),
				);

			return { success: true };
		}),

	triggerRenewals: protectedProcedure.mutation(async ({ ctx }) => {
		const tenant = await resolveTenantContext(ctx);
		return processSubscriptionRenewals(ctx.db, tenant.organizationId);
	}),
});
