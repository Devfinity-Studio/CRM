import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	resolveTenantContext,
} from "~/server/api/trpc";
import { products } from "~/server/db/schema";

export const inventoryRouter = createTRPCRouter({
	getProducts: protectedProcedure.query(async ({ ctx }) => {
		const tenant = await resolveTenantContext(ctx);

		return ctx.db.query.products.findMany({
			where: eq(products.organizationId, tenant.organizationId),
			orderBy: (prods, { desc }) => [desc(prods.createdAt)],
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
			const tenant = await resolveTenantContext(ctx);

			const [product] = await ctx.db
				.insert(products)
				.values({
					organizationId: tenant.organizationId,
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
			const tenant = await resolveTenantContext(ctx);
			const { id, ...data } = input;

			const [product] = await ctx.db
				.update(products)
				.set(data)
				.where(
					and(
						eq(products.id, id),
						eq(products.organizationId, tenant.organizationId),
					),
				)
				.returning();

			if (!product) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Product not found",
				});
			}
			return product;
		}),

	deleteProduct: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const tenant = await resolveTenantContext(ctx);

			await ctx.db
				.delete(products)
				.where(
					and(
						eq(products.id, input.id),
						eq(products.organizationId, tenant.organizationId),
					),
				);

			return { success: true };
		}),
});
