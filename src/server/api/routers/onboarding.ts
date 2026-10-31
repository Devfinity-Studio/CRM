import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { organizationMembers, organizations, users } from "~/server/db/schema";

export const onboardingRouter = createTRPCRouter({
	getStatus: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.query.users.findFirst({
			where: eq(users.id, ctx.session.user.id),
		});
		return {
			onboardingComplete: user?.onboardingComplete ?? false,
			hasSeenWelcome: user?.hasSeenWelcome ?? false,
		};
	}),

	markWelcomeSeen: protectedProcedure.mutation(async ({ ctx }) => {
		await ctx.db
			.update(users)
			.set({ hasSeenWelcome: true })
			.where(eq(users.id, ctx.session.user.id));
		return { success: true };
	}),

	getSetupProgress: protectedProcedure.query(async ({ ctx }) => {
		// Get user and member org
		const user = await ctx.db.query.users.findFirst({
			where: eq(users.id, ctx.session.user.id),
		});
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});

		let hasProducts = false;
		let hasLeads = false;

		if (member?.organizationId) {
			// Check if they have created any products
			const productsList = await ctx.db.query.products.findMany({
				where: eq(products.organizationId, member.organizationId),
				limit: 1,
			});
			hasProducts = productsList.length > 0;

			// Check if they have created any leads
			const leadsList = await ctx.db.query.crmLeads.findMany({
				where: eq(crmLeads.organizationId, member.organizationId),
				limit: 1,
			});
			hasLeads = leadsList.length > 0;
		}

		const hasProfile = !!(user?.name && user?.phone);

		return {
			hasSeenWelcome: user?.hasSeenWelcome ?? false,
			steps: {
				profile: hasProfile,
				products: hasProducts,
				leads: hasLeads,
			},
			isFullyComplete: hasProfile && hasProducts && hasLeads,
		};
	}),

	completeOnboarding: protectedProcedure
		.input(
			z.object({
				name: z.string().min(1),
				displayName: z.string().optional(),
				teamSize: z.string().min(1),
				website: z.string().optional(),
				phone: z.string().min(1),
				countryCode: z.string().min(1),
				country: z.string().min(1),
				currency: z.string().min(1),
				hasGst: z.boolean(),
				gstin: z.string().optional(),
				businessPan: z.string().optional(),
				useCases: z.array(z.string()),
				businessType: z.string().min(1),
				addressStreet: z.string().min(1),
				addressCity: z.string().min(1),
				addressState: z.string().min(1),
				addressPincode: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const slug =
				input.name.toLowerCase().replace(/[^a-z0-9]/g, "-") +
				"-" +
				Date.now().toString().slice(-4);

			const [org] = await ctx.db
				.insert(organizations)
				.values({
					name: input.name,
					slug,
					displayName: input.displayName,
					teamSize: input.teamSize,
					website: input.website,
					phone: input.phone,
					countryCode: input.countryCode,
					phoneVerified: true, // Mocked for now
					country: input.country,
					currency: input.currency,
					hasGst: input.hasGst,
					gstin: input.gstin,
					businessPan: input.businessPan,
					useCases: JSON.stringify(input.useCases),
					businessType: input.businessType,
					addressStreet: input.addressStreet,
					addressCity: input.addressCity,
					addressState: input.addressState,
					addressPincode: input.addressPincode,
				})
				.returning();

			if (!org) {
				throw new Error("Failed to create organization");
			}

			const orgId = org.id;

			// Link user to organization
			await ctx.db.insert(organizationMembers).values({
				organizationId: orgId,
				userId: ctx.session.user.id,
				role: "OWNER",
			});

			// Mark user as onboarded
			await ctx.db
				.update(users)
				.set({ onboardingComplete: true })
				.where(eq(users.id, ctx.session.user.id));

			return { success: true, organizationId: orgId };
		}),
});
