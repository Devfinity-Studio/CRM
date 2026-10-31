import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
	automationLogs,
	automationRules,
	communications,
	notifications,
	organizationMembers,
} from "@/server/db/schema";

export const automationsRouter = createTRPCRouter({
	getRules: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		return ctx.db.query.automationRules.findMany({
			where: eq(automationRules.organizationId, member.organizationId),
			orderBy: [desc(automationRules.createdAt)],
		});
	}),

	createRule: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				triggerType: z.enum([
					"INVOICE_DUE",
					"SUBSCRIPTION_RENEWAL",
					"DEAL_STALLED",
					"QUOTE_SENT",
				]),
				daysOffset: z.number(),
				actionType: z.enum([
					"CREATE_NOTIFICATION",
					"CREATE_TASK",
					"SEND_EMAIL",
					"INTERNAL_ALERT",
				]),
				actionPayload: z.any().optional().default({}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const [newRule] = await ctx.db
				.insert(automationRules)
				.values({
					organizationId: member.organizationId,
					name: input.name,
					triggerType: input.triggerType,
					daysOffset: input.daysOffset,
					actionType: input.actionType,
					actionPayload: input.actionPayload,
				})
				.returning();
			return newRule;
		}),

	deleteRule: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			await ctx.db
				.delete(automationRules)
				.where(
					and(
						eq(automationRules.id, input.id),
						eq(automationRules.organizationId, member.organizationId),
					),
				);
			return { success: true };
		}),

	getCommunications: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		return ctx.db.query.communications.findMany({
			where: eq(communications.organizationId, member.organizationId),
			orderBy: [desc(communications.sentAt)],
			with: {
				company: true,
			},
		});
	}),
});
