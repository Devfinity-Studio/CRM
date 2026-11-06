import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { adCampaigns, crmTasks, notifications, organizationMembers } from "~/server/db/schema";

async function verifyOrgMembership(ctx: any, organizationId: string) {
	if (ctx.session?.user?.systemRole === "SUPER_ADMIN") return true;
	if (ctx.session?.user?.organizationId === organizationId) return true;
	if (ctx.db?.query?.organizationMembers?.findFirst) {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: and(
				eq(organizationMembers.organizationId, organizationId),
				eq(organizationMembers.userId, ctx.session.user.id),
			),
		});
		if (!member) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You do not have access to this organization.",
			});
		}
	}
	return true;
}

export const marketingRouter = createTRPCRouter({
	// Get all ad campaigns
	getCampaigns: protectedProcedure
		.input(z.object({ organizationId: z.string() }))
		.query(async ({ ctx, input }) => {
			await verifyOrgMembership(ctx, input.organizationId);
			const campaigns = await ctx.db
				.select()
				.from(adCampaigns)
				.where(eq(adCampaigns.organizationId, input.organizationId))
				.orderBy(desc(adCampaigns.createdAt));

			return campaigns.map((c) => {
				const cpl =
					c.conversions > 0
						? (c.spend / c.conversions / 100).toFixed(2)
						: "0.00";
				return {
					...c,
					cpl,
				};
			});
		}),

	createCampaign: protectedProcedure
		.input(
			z.object({
				organizationId: z.string(),
				name: z.string().min(1),
				platform: z.string().min(1),
				spend: z.number().default(0),
				clicks: z.number().default(0),
				impressions: z.number().default(0),
				conversions: z.number().default(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await verifyOrgMembership(ctx, input.organizationId);
			const [campaign] = await ctx.db
				.insert(adCampaigns)
				.values(input)
				.returning();
			return campaign;
		}),

	// Get tasks
	getTasks: protectedProcedure
		.input(z.object({ organizationId: z.string() }))
		.query(async ({ ctx, input }) => {
			await verifyOrgMembership(ctx, input.organizationId);
			return ctx.db
				.select()
				.from(crmTasks)
				.where(eq(crmTasks.organizationId, input.organizationId))
				.orderBy(desc(crmTasks.dueDate));
		}),

	createTask: protectedProcedure
		.input(
			z.object({
				organizationId: z.string(),
				contactId: z.string().optional(),
				dealId: z.string().optional(),
				title: z.string().min(1),
				description: z.string().optional(),
				dueDate: z.date(),
				priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await verifyOrgMembership(ctx, input.organizationId);
			const [task] = await ctx.db
				.insert(crmTasks)
				.values({
					...input,
					assignedUserId: ctx.session.user.id,
				})
				.returning();
			return task;
		}),

	// Toggle task status
	toggleTaskStatus: protectedProcedure
		.input(
			z.object({
				taskId: z.string(),
				status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const task = await ctx.db.query.crmTasks.findFirst({
				where: eq(crmTasks.id, input.taskId),
			});
			if (!task) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
			}
			await verifyOrgMembership(ctx, task.organizationId);

			const [updated] = await ctx.db
				.update(crmTasks)
				.set({ status: input.status })
				.where(eq(crmTasks.id, input.taskId))
				.returning();
			return updated;
		}),
});
