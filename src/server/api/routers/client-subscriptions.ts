import { addMonths, addYears } from "date-fns";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	clientSubscriptions,
	organizationMembers,
	products,
} from "~/server/db/schema";

export const clientSubscriptionsRouter = createTRPCRouter({
	getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		return ctx.db.query.clientSubscriptions.findMany({
			where: eq(clientSubscriptions.organizationId, member.organizationId),
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
				billingCycle: z.enum(["MONTHLY", "YEARLY"]),
				price: z.number().min(0),
				startDate: z.date(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const nextRenewalDate =
				input.billingCycle === "MONTHLY"
					? addMonths(input.startDate, 1)
					: addYears(input.startDate, 1);

			const [sub] = await ctx.db
				.insert(clientSubscriptions)
				.values({
					organizationId: member.organizationId,
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
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const { id, ...data } = input;

			const [sub] = await ctx.db
				.update(clientSubscriptions)
				.set(data)
				.where(
					and(
						eq(clientSubscriptions.id, id),
						eq(clientSubscriptions.organizationId, member.organizationId),
					),
				)
				.returning();

			if (!sub) throw new Error("Subscription not found");
			return sub;
		}),

	deleteSubscription: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			await ctx.db
				.delete(clientSubscriptions)
				.where(
					and(
						eq(clientSubscriptions.id, input.id),
						eq(clientSubscriptions.organizationId, member.organizationId),
					),
				);

			return { success: true };
		}),
});
