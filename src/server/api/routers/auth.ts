import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { organizationMembers, organizations, users } from "~/server/db/schema";

export const authRouter = createTRPCRouter({
	register: publicProcedure
		.input(
			z.object({
				name: z.string().min(2),
				email: z.string().email(),
				phone: z.string().optional(),
				password: z.string().min(6),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user exists
			const normalizedEmail = input.email.trim().toLowerCase();
			const phone = input.phone?.trim() || null;

			const existingUser = await ctx.db.query.users.findFirst({
				where: or(
					eq(users.email, normalizedEmail),
					phone ? eq(users.phone, phone) : undefined,
				),
			});

			if (existingUser) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "A user with this email or phone already exists",
				});
			}

			// Hash password
			const passwordHash = await bcrypt.hash(input.password, 10);
			const userId = crypto.randomUUID();

			await ctx.db.insert(users).values({
				id: userId,
				name: input.name.trim(),
				email: normalizedEmail,
				phone,
				passwordHash,
				systemRole: "USER",
				isActive: true,
				onboardingComplete: false,
				hasSeenWelcome: false,
			});

			return { success: true };
		}),
});
