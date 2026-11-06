import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, resolveTenantContext } from "~/server/api/trpc";
import { apiKeys } from "~/server/db/schema";

export const apiKeysRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		const tenant = await resolveTenantContext(ctx);

		return ctx.db.query.apiKeys.findMany({
			where: and(
				eq(apiKeys.organizationId, tenant.organizationId),
				isNull(apiKeys.revokedAt),
			),
			orderBy: (keys, { desc }) => [desc(keys.createdAt)],
		});
	}),

	create: protectedProcedure
		.input(z.object({ name: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);

			if (!tenant.isAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Requires Organization Admin or Owner privileges",
				});
			}

			// Generate a random key
			const rawKey = `devcrm_${crypto.randomBytes(32).toString("hex")}`;

			// Hash it for storage
			const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

			// Store the hash
			const [newKey] = await ctx.db
				.insert(apiKeys)
				.values({
					organizationId: tenant.organizationId,
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
			const tenant = await resolveTenantContext(ctx);

			if (!tenant.isAdmin) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Requires Organization Admin or Owner privileges",
				});
			}

			await ctx.db
				.update(apiKeys)
				.set({ revokedAt: new Date() })
				.where(
					and(
						eq(apiKeys.id, input.id),
						eq(apiKeys.organizationId, tenant.organizationId),
					),
				);
			return { success: true };
		}),
});
