import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { svix } from "~/lib/svix";
import {
	createTRPCRouter,
	protectedProcedure,
	resolveTenantContext,
} from "~/server/api/trpc";
import { organizations } from "~/server/db/schema";

export const webhooksRouter = createTRPCRouter({
	getAppPortalUrl: protectedProcedure.query(async ({ ctx }) => {
		const tenant = await resolveTenantContext(ctx);

		if (!tenant.isAdmin) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Requires Organization Admin or Owner privileges",
			});
		}

		const orgId = tenant.organizationId;

		// 1. Get the organization to check if it has a svixAppId
		const org = await ctx.db.query.organizations.findFirst({
			where: eq(organizations.id, orgId),
		});

		if (!org) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Organization not found",
			});
		}

		let svixAppId = org.svixAppId;

		// 2. If it doesn't have one, create an App in Svix and save the ID
		if (!svixAppId) {
			const app = await svix.application.create({
				name: `Org: ${org.name} (${org.id})`,
				uid: org.id,
			});

			svixAppId = app.id;

			await ctx.db
				.update(organizations)
				.set({ svixAppId })
				.where(eq(organizations.id, orgId));
		}

		// 3. Generate a magic link to the App Portal for this specific app
		const dashboardAccess = await svix.authentication.appPortalAccess(
			svixAppId,
			{},
		);

		return {
			url: dashboardAccess.url,
		};
	}),
});
