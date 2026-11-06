import { initTRPC, TRPCError } from "@trpc/server";
import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import superjson from "superjson";
import { ZodError } from "zod";
import {
	type FeatureKey,
	checkFeatureAccess,
} from "~/server/api/services/entitlements";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { apiKeys, organizationMembers, organizations } from "~/server/db/schema";

export interface TenantContext {
	id: string;
	name: string;
	slug: string;
	role: string;
	permissions?: string | null;
	isOwner: boolean;
	isAdmin: boolean;
}

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

	let impersonatedOrgId: string | null = null;
	if (session?.user && session.user.systemRole === "SUPER_ADMIN") {
		try {
			const cookieStore = await cookies();
			const impCookie = cookieStore.get("devcrm_impersonate_org")?.value;
			if (impCookie) {
				impersonatedOrgId = impCookie;
				session.user.organizationId = impCookie;
			}
		} catch {
			// cookies() might not be available in non-request contexts
		}
	}

	return {
		db,
		session,
		impersonatedOrgId,
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

/**
 * Standardized tenant context resolver for multi-tenant isolation,
 * Super Admin impersonation, and role resolution.
 */
export async function resolveTenantContext(
	ctx: {
		db: any;
		session: {
			user: {
				id: string;
				systemRole?: string | null;
				organizationId?: string | null;
			};
		};
		headers?: Headers | { get: (name: string) => string | null } | null;
		impersonatedOrgId?: string | null;
	},
	requestedOrgId?: string | null,
): Promise<{
	organizationId: string;
	role: string;
	isOwner: boolean;
	isAdmin: boolean;
}> {
	const user = ctx.session.user;
	const isSuperAdmin = user.systemRole === "SUPER_ADMIN";

	// 1. Determine target org ID from request / session / impersonation
	const headerOrgId = ctx.headers?.get ? ctx.headers.get("x-tenant-id") : null;
	const headerSlug = ctx.headers?.get ? ctx.headers.get("x-tenant-slug") : null;

	let targetOrgId =
		requestedOrgId ||
		ctx.impersonatedOrgId ||
		headerOrgId ||
		user.organizationId ||
		null;

	if (!targetOrgId && headerSlug && ctx.db?.query?.organizations?.findFirst) {
		const orgBySlug = await ctx.db.query.organizations.findFirst({
			where: eq(organizations.slug, headerSlug),
		});
		if (orgBySlug) {
			targetOrgId = orgBySlug.id;
		}
	}

	// 2. Super Admin bypass if target org is defined
	if (isSuperAdmin && targetOrgId) {
		return {
			organizationId: targetOrgId,
			role: "SUPER_ADMIN",
			isOwner: true,
			isAdmin: true,
		};
	}

	// 3. Find tenant membership
	let member: any = null;
	if (targetOrgId && ctx.db?.query?.organizationMembers?.findFirst) {
		member = await ctx.db.query.organizationMembers.findFirst({
			where: and(
				eq(organizationMembers.organizationId, targetOrgId),
				eq(organizationMembers.userId, user.id),
			),
		});
	}

	// Fallback to first membership for user
	if (!member && ctx.db?.query?.organizationMembers?.findFirst) {
		member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, user.id),
		});
	}

	if (!member) {
		if (isSuperAdmin && targetOrgId) {
			return {
				organizationId: targetOrgId,
				role: "SUPER_ADMIN",
				isOwner: true,
				isAdmin: true,
			};
		}
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "No active tenant membership found.",
		});
	}

	const role = member.role || "MEMBER";
	return {
		organizationId: member.organizationId,
		role,
		isOwner: role === "OWNER" || isSuperAdmin,
		isAdmin: role === "OWNER" || role === "ADMIN" || isSuperAdmin,
	};
}

// --- TENANT PROCEDURE WITH AUTOMATIC ISOLATION ---
export const tenantProcedure = protectedProcedure.use(
	async ({ ctx, next }) => {
		const tenantCtx = await resolveTenantContext(ctx as any);

		const org = await ctx.db.query.organizations.findFirst({
			where: eq(organizations.id, tenantCtx.organizationId),
		});

		if (!org) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Tenant organization not found.",
			});
		}

		const tenant: TenantContext = {
			id: org.id,
			name: org.name,
			slug: org.slug,
			role: tenantCtx.role,
			permissions: null,
			isOwner: tenantCtx.isOwner,
			isAdmin: tenantCtx.isAdmin,
		};

		return next({
			ctx: {
				...ctx,
				tenant,
			},
		});
	},
);

// --- TENANT ROLE AUTHORIZATION PROCEDURE ---
export const tenantRoleProcedure = (allowedRoles: string[]) =>
	tenantProcedure.use(({ ctx, next }) => {
		if (ctx.session.user.systemRole === "SUPER_ADMIN") {
			return next();
		}
		if (!allowedRoles.includes(ctx.tenant.role)) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `Access denied. Requires one of roles: ${allowedRoles.join(", ")}.`,
			});
		}
		return next();
	});

// --- ENTITLEMENT ENFORCEMENT PROCEDURE ---
export const entitlementProcedure = (featureKey: FeatureKey) =>
	tenantProcedure.use(async ({ ctx, next }) => {
		if (ctx.session.user.systemRole === "SUPER_ADMIN") {
			return next();
		}
		const hasAccess = await checkFeatureAccess(
			ctx.db,
			ctx.tenant.id,
			featureKey,
		);
		if (!hasAccess) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: `Your active plan does not include the ${featureKey} feature module.`,
			});
		}
		return next();
	});
