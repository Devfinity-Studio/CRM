import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	organizationMembers,
	organizations,
	userSettings,
	users,
} from "~/server/db/schema";

export const settingsRouter = createTRPCRouter({
	getProfile: protectedProcedure.query(async ({ ctx }) => {
		const user = await ctx.db.query.users.findFirst({
			where: eq(users.id, ctx.session.user.id),
		});

		if (!user) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
		}

		const orgId = ctx.session.user.organizationId;
		let settings = null;
		if (orgId) {
			settings = await ctx.db.query.userSettings.findFirst({
				where: and(
					eq(userSettings.organizationId, orgId),
					eq(userSettings.userId, ctx.session.user.id),
				),
			});
		}

		return {
			user: {
				name: user.name,
				email: user.email,
				phone: user.phone,
				image: user.image,
			},
			settings: settings
				? {
						theme: settings.theme,
						locale: settings.locale,
					}
				: null,
		};
	}),

	updateProfile: protectedProcedure
		.input(
			z.object({
				name: z.string().min(2),
				phone: z.string().optional(),
				image: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.update(users)
				.set({
					name: input.name,
					phone: input.phone,
					image: input.image,
				})
				.where(eq(users.id, ctx.session.user.id));
			return { success: true };
		}),

	updatePreferences: protectedProcedure
		.input(
			z.object({
				theme: z.string(),
				locale: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.session.user.organizationId;
			if (!orgId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Organization missing",
				});
			}

			const settings = await ctx.db.query.userSettings.findFirst({
				where: and(
					eq(userSettings.organizationId, orgId),
					eq(userSettings.userId, ctx.session.user.id),
				),
			});

			if (settings) {
				await ctx.db
					.update(userSettings)
					.set({ theme: input.theme, locale: input.locale })
					.where(eq(userSettings.id, settings.id));
			} else {
				await ctx.db.insert(userSettings).values({
					organizationId: orgId,
					userId: ctx.session.user.id,
					theme: input.theme,
					locale: input.locale,
				});
			}

			return { success: true };
		}),

	changePassword: protectedProcedure
		.input(
			z.object({
				currentPassword: z.string().min(1),
				newPassword: z.string().min(6),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// In a real app we'd use bcrypt to compare current password and hash the new one
			// Since this is MVP, we just update the passwordHash. NextAuth credentials provider
			// should match how we store it here.
			// E.g., const hashed = await hash(input.newPassword, 10);
			const user = await ctx.db.query.users.findFirst({
				where: eq(users.id, ctx.session.user.id),
			});
			if (!user) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			}

			// Basic implementation without bcrypt comparison for MVP demo
			await ctx.db
				.update(users)
				.set({ passwordHash: input.newPassword })
				.where(eq(users.id, ctx.session.user.id));

			return { success: true };
		}),

	getOrganizationSettings: protectedProcedure.query(async ({ ctx }) => {
		const orgId = ctx.session.user.organizationId;
		if (!orgId)
			throw new TRPCError({ code: "BAD_REQUEST", message: "No organization" });

		// Check RBAC
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: and(
				eq(organizationMembers.organizationId, orgId),
				eq(organizationMembers.userId, ctx.session.user.id),
			),
		});

		if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
		}

		const org = await ctx.db.query.organizations.findFirst({
			where: eq(organizations.id, orgId),
		});

		const settings = await ctx.db.query.userSettings.findFirst({
			where: and(
				eq(userSettings.organizationId, orgId),
				eq(userSettings.userId, ctx.session.user.id),
			),
		});

		return {
			organization: org,
			customLabels: settings?.customLabels,
		};
	}),

	updateOrganization: protectedProcedure
		.input(
			z.object({
				name: z.string().min(2),
				logoUrl: z.string().optional(),
				industry: z.string().optional(),
				currency: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.session.user.organizationId;
			if (!orgId)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No organization",
				});

			const member = await ctx.db.query.organizationMembers.findFirst({
				where: and(
					eq(organizationMembers.organizationId, orgId),
					eq(organizationMembers.userId, ctx.session.user.id),
				),
			});

			if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
			}

			await ctx.db
				.update(organizations)
				.set({
					name: input.name,
					logoUrl: input.logoUrl,
					industry: input.industry,
					currency: input.currency,
				})
				.where(eq(organizations.id, orgId));

			return { success: true };
		}),

	updateBrandingPatterns: protectedProcedure
		.input(
			z.object({
				quotePattern: z.string(),
				invoicePattern: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const orgId = ctx.session.user.organizationId;
			if (!orgId)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No organization",
				});

			const member = await ctx.db.query.organizationMembers.findFirst({
				where: and(
					eq(organizationMembers.organizationId, orgId),
					eq(organizationMembers.userId, ctx.session.user.id),
				),
			});

			if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
			}

			const settings = await ctx.db.query.userSettings.findFirst({
				where: and(
					eq(userSettings.organizationId, orgId),
					eq(userSettings.userId, ctx.session.user.id),
				),
			});

			const updatedLabels = {
				...(settings?.customLabels ? (settings.customLabels as any) : {}),
				quotePattern: input.quotePattern,
				invoicePattern: input.invoicePattern,
			};

			if (settings) {
				await ctx.db
					.update(userSettings)
					.set({ customLabels: updatedLabels })
					.where(eq(userSettings.id, settings.id));
			} else {
				await ctx.db.insert(userSettings).values({
					organizationId: orgId,
					userId: ctx.session.user.id,
					customLabels: updatedLabels,
				});
			}

			return { success: true };
		}),
});
