import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { organizationMembers, products } from "~/server/db/schema";

export const inventoryRouter = createTRPCRouter({
	getProducts: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");

		return ctx.db.query.products.findMany({
			where: eq(products.organizationId, member.organizationId),
			orderBy: (products, { desc }) => [desc(products.createdAt)],
		});
	}),

	createProduct: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				sku: z.string().optional(),
				type: z.enum(["PRODUCT", "SERVICE"]),
				description: z.string().optional(),
				unitPrice: z.number().min(0),
				unit: z.string().optional(),
				stockQuantity: z.number().min(0).default(0),
				isPublic: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const [product] = await ctx.db
				.insert(products)
				.values({
					organizationId: member.organizationId,
					...input,
				})
				.returning();

			return product;
		}),

	updateProduct: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1),
				sku: z.string().optional(),
				type: z.enum(["PRODUCT", "SERVICE"]),
				description: z.string().optional(),
				unitPrice: z.number().min(0),
				unit: z.string().optional(),
				stockQuantity: z.number().min(0),
				isPublic: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			const { id, ...data } = input;

			const [product] = await ctx.db
				.update(products)
				.set(data)
				.where(
					and(
						eq(products.id, id),
						eq(products.organizationId, member.organizationId),
					),
				)
				.returning();

			if (!product) throw new Error("Product not found");
			return product;
		}),

	deleteProduct: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			if (!member?.organizationId) throw new Error("Unauthorized");

			await ctx.db
				.delete(products)
				.where(
					and(
						eq(products.id, input.id),
						eq(products.organizationId, member.organizationId),
					),
				);

			return { success: true };
		}),
});
