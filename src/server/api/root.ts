import { adminRouter } from "~/server/api/routers/admin";
import { apiKeysRouter } from "~/server/api/routers/apiKeys";
import { authRouter } from "~/server/api/routers/auth";
import { automationsRouter } from "~/server/api/routers/automations";
import { billingRouter } from "~/server/api/routers/billing";
import { clientSubscriptionsRouter } from "~/server/api/routers/client-subscriptions";
import { crmRouter } from "~/server/api/routers/crm";
import { dashboardRouter } from "~/server/api/routers/dashboard";
import { dealsRouter } from "~/server/api/routers/deals";
import { inventoryRouter } from "~/server/api/routers/inventory";
import { marketingRouter } from "~/server/api/routers/marketing";
import { notificationsRouter } from "~/server/api/routers/notifications";
import { onboardingRouter } from "~/server/api/routers/onboarding";
import { publicRouter } from "~/server/api/routers/public";
import { reportingRouter } from "~/server/api/routers/reporting";
import { settingsRouter } from "~/server/api/routers/settings";
import { superadminRouter } from "~/server/api/routers/superadmin";
import { uploadsRouter } from "~/server/api/routers/uploads";
import { webhooksRouter } from "~/server/api/routers/webhooks";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
	admin: adminRouter,
	superadmin: superadminRouter,
	crm: crmRouter,
	deals: dealsRouter,
	billing: billingRouter,
	marketing: marketingRouter,
	auth: authRouter,
	dashboard: dashboardRouter,
	onboarding: onboardingRouter,
	uploads: uploadsRouter,
	settings: settingsRouter,
	public: publicRouter,
	inventory: inventoryRouter,
	clientSubscriptions: clientSubscriptionsRouter,
	automations: automationsRouter,
	notifications: notificationsRouter,
	apiKeys: apiKeysRouter,
	webhooks: webhooksRouter,
	reporting: reportingRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
