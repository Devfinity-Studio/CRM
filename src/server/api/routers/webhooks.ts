import { eq } from "drizzle-orm";
import { svix } from "~/lib/svix";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { organizationMembers, organizations } from "~/server/db/schema";

export const webhooksRouter = createTRPCRouter({
	getAppPortalUrl: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});

		if (!member?.organizationId) {
			throw new Error("Organization not found");
		}

		const orgId = member.organizationId;

		// 1. Get the organization to check if it has a svixAppId
		const org = await ctx.db.query.organizations.findFirst({
			where: eq(organizations.id, orgId),
		});

		if (!org) {
			throw new Error("Organization not found");
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
			{
				// We can pass options here if needed, but defaults are usually fine
			},
		);

		return {
			url: dashboardAccess.url,
		};
	}),
});
