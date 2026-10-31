import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { notifications, organizationMembers } from "~/server/db/schema";

export const notificationsRouter = createTRPCRouter({
	getNotifications: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		return ctx.db.query.notifications.findMany({
			where: and(
				eq(notifications.organizationId, member.organizationId),
				eq(notifications.userId, ctx.session.user.id),
			),
			orderBy: (nots, { desc }) => [desc(nots.createdAt)],
			limit: 50,
		});
	}),

	markAsRead: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			await ctx.db
				.update(notifications)
				.set({ isRead: true })
				.where(
					and(
						eq(notifications.id, input.id),
						eq(notifications.userId, ctx.session.user.id),
						eq(notifications.organizationId, member.organizationId),
					),
				);

			return { success: true };
		}),

	markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		await ctx.db
			.update(notifications)
			.set({ isRead: true })
			.where(
				and(
					eq(notifications.userId, ctx.session.user.id),
					eq(notifications.organizationId, member.organizationId),
					eq(notifications.isRead, false),
				),
			);

		return { success: true };
	}),
});
