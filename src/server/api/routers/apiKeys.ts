import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { apiKeys, organizationMembers } from "~/server/db/schema";

export const apiKeysRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		return ctx.db.query.apiKeys.findMany({
			where: and(
				eq(apiKeys.organizationId, member.organizationId),
				isNull(apiKeys.revokedAt),
			),
			orderBy: (keys, { desc }) => [desc(keys.createdAt)],
		});
	}),

	create: protectedProcedure
		.input(z.object({ name: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			// Generate a random key
			const rawKey = `devcrm_${crypto.randomBytes(32).toString("hex")}`;

			// Hash it for storage
			const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

			// Store the hash
			const [newKey] = await ctx.db
				.insert(apiKeys)
				.values({
					organizationId: member.organizationId,
					userId: ctx.session.user.id,
					name: input.name,
					keyHash,
				})
				.returning();

			// Return the raw key just once
			return {
				id: newKey!.id,
				name: newKey!.name,
				rawKey, // IMPORTANT: The client must display this and never see it again
				createdAt: newKey!.createdAt,
			};
		}),

	revoke: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			await ctx.db
				.update(apiKeys)
				.set({ revokedAt: new Date() })
				.where(
					and(
						eq(apiKeys.id, input.id),
						eq(apiKeys.organizationId, member.organizationId),
					),
				);
			return { success: true };
		}),
});
