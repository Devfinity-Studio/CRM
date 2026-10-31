import { initTRPC, TRPCError } from "@trpc/server";
import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { apiKeys, organizationMembers } from "~/server/db/schema";

export const createTRPCContext = async (opts: { headers: Headers }) => {
	let session = await auth();

	if (!session) {
		const authHeader = opts.headers.get("authorization");
		const apiKeyHeader = opts.headers.get("x-api-key");
		const rawKey =
			apiKeyHeader ||
			(authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

		if (rawKey) {
			const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
			const key = await db.query.apiKeys.findFirst({
				where: and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)),
				with: { user: true },
			});

			if (key) {
				session = {
					user: {
						id: key.user.id,
						email: key.user.email,
						name: key.user.name,
						systemRole: key.user.systemRole,
						organizationId: key.organizationId,
					} as any,
					expires: "9999-12-31T23:59:59.999Z",
				};
			}
		}
	}

	return {
		db,
		session,
		...opts,
	};
};

const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
	const start = Date.now();
	const result = await next();
	const end = Date.now();
	console.log(`[TRPC] ${path} took ${end - start}ms to execute`);
	return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);

// --- PROTECTED PROCEDURES & AUTHORIZATION MIDDLEWARE ---
export const protectedProcedure = t.procedure
	.use(timingMiddleware)
	.use(({ ctx, next }) => {
		if (!ctx.session || !ctx.session.user) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "You must be logged in to perform this action.",
			});
		}
		return next({
			ctx: {
				session: { ...ctx.session, user: ctx.session.user },
			},
		});
	});

export const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
	if (ctx.session.user.systemRole !== "SUPER_ADMIN") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Super Admin privileges required.",
		});
	}
	return next();
});
