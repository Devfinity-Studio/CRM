import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
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
			const user = await ctx.db.query.users.findFirst({
				where: eq(users.id, ctx.session.user.id),
			});
			if (!user || !user.passwordHash) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found or credentials not initialized" });
			}

			const isCurrentValid = await bcrypt.compare(
				input.currentPassword,
				user.passwordHash,
			);
			if (!isCurrentValid) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Current password does not match",
				});
			}

			const passwordHash = await bcrypt.hash(input.newPassword, 10);

			await ctx.db
				.update(users)
				.set({ passwordHash })
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
	getMembers: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		const orgId = ctx.session.user.organizationId || member?.organizationId;
		if (!orgId) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "No organization found",
			});
		}

		const members = await ctx.db
			.select({
				id: organizationMembers.id,
				userId: organizationMembers.userId,
				role: organizationMembers.role,
				createdAt: organizationMembers.createdAt,
				userName: users.name,
				userEmail: users.email,
				userImage: users.image,
			})
			.from(organizationMembers)
			.innerJoin(users, eq(organizationMembers.userId, users.id))
			.where(eq(organizationMembers.organizationId, orgId));

		return members;
	}),

	inviteMember: protectedProcedure
		.input(
			z.object({
				email: z.string().email(),
				role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			const orgId = ctx.session.user.organizationId || member?.organizationId;
			if (!orgId)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No organization",
				});

			if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only Owners and Admins can invite members",
				});
			}

			// Check if user already exists
			let targetUser = await ctx.db.query.users.findFirst({
				where: eq(users.email, input.email),
			});

			if (!targetUser) {
				const [newUser] = await ctx.db
					.insert(users)
					.values({
						email: input.email,
						name: input.email.split("@")[0] || "Invited User",
						systemRole: "USER",
						organizationId: orgId,
					})
					.returning();
				targetUser = newUser;
			}

			if (!targetUser) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create user",
				});
			}

			// Check if already member
			const existingMember = await ctx.db.query.organizationMembers.findFirst({
				where: and(
					eq(organizationMembers.organizationId, orgId),
					eq(organizationMembers.userId, targetUser.id),
				),
			});

			if (existingMember) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "User is already a member of this workspace",
				});
			}

			const [newMember] = await ctx.db
				.insert(organizationMembers)
				.values({
					organizationId: orgId,
					userId: targetUser.id,
					role: input.role,
				})
				.returning();

			return newMember;
		}),

	updateMemberRole: protectedProcedure
		.input(
			z.object({
				memberId: z.string(),
				role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const callerMember = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			const orgId =
				ctx.session.user.organizationId || callerMember?.organizationId;
			if (!orgId)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No organization",
				});

			if (
				!callerMember ||
				(callerMember.role !== "OWNER" && callerMember.role !== "ADMIN")
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only Owners and Admins can update roles",
				});
			}

			const targetMember = await ctx.db.query.organizationMembers.findFirst({
				where: and(
					eq(organizationMembers.id, input.memberId),
					eq(organizationMembers.organizationId, orgId),
				),
			});

			if (!targetMember) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Member not found in this organization",
				});
			}

			if (targetMember.role === "OWNER" && input.role !== "OWNER") {
				const owners = await ctx.db.query.organizationMembers.findMany({
					where: and(
						eq(organizationMembers.organizationId, orgId),
						eq(organizationMembers.role, "OWNER"),
					),
				});
				if (owners.length <= 1) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Organization must have at least one OWNER",
					});
				}
			}

			await ctx.db
				.update(organizationMembers)
				.set({ role: input.role })
				.where(eq(organizationMembers.id, input.memberId));

			return { success: true };
		}),

	removeMember: protectedProcedure
		.input(z.object({ memberId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const callerMember = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			const orgId =
				ctx.session.user.organizationId || callerMember?.organizationId;
			if (!orgId)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No organization",
				});

			if (
				!callerMember ||
				(callerMember.role !== "OWNER" && callerMember.role !== "ADMIN")
			) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Only Owners and Admins can remove members",
				});
			}

			const targetMember = await ctx.db.query.organizationMembers.findFirst({
				where: and(
					eq(organizationMembers.id, input.memberId),
					eq(organizationMembers.organizationId, orgId),
				),
			});

			if (!targetMember) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
			}

			if (targetMember.role === "OWNER") {
				const owners = await ctx.db.query.organizationMembers.findMany({
					where: and(
						eq(organizationMembers.organizationId, orgId),
						eq(organizationMembers.role, "OWNER"),
					),
				});
				if (owners.length <= 1) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Cannot remove the only workspace OWNER",
					});
				}
			}

			await ctx.db
				.delete(organizationMembers)
				.where(eq(organizationMembers.id, input.memberId));

			return { success: true };
		}),
});
