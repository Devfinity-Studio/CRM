import { subDays } from "date-fns";
import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	companies,
	crmTasks,
	deals,
	invoices,
	organizationMembers,
	organizations,
	clientSubscriptions,
	pipelineStages,
	products,
	users,
} from "~/server/db/schema";
import { calculateMRRAndARR } from "~/server/api/services/subscription-engine";

export const dashboardRouter = createTRPCRouter({
	getLayoutData: protectedProcedure.query(async ({ ctx }) => {
		// 1. Fetch user's organization memberships
		const userMemberships = await ctx.db
			.select({
				organizationId: organizationMembers.organizationId,
				role: organizationMembers.role,
				name: organizations.name,
				logoUrl: organizations.logoUrl,
				slug: organizations.slug,
			})
			.from(organizationMembers)
			.innerJoin(
				organizations,
				eq(organizationMembers.organizationId, organizations.id),
			)
			.where(eq(organizationMembers.userId, ctx.session.user.id));

		const userDb = await ctx.db.query.users.findFirst({
			where: eq(users.id, ctx.session.user.id),
		});

		let impersonatedOrg = null;
		if (ctx.impersonatedOrgId) {
			impersonatedOrg = await ctx.db.query.organizations.findFirst({
				where: eq(organizations.id, ctx.impersonatedOrgId),
			});
		}

		const activeOrgId =
			ctx.impersonatedOrgId ||
			ctx.session.user.organizationId ||
			userMemberships[0]?.organizationId;
		const activeMembership =
			userMemberships.find((m) => m.organizationId === activeOrgId) ||
			userMemberships[0];

		const activeOrganization = impersonatedOrg
			? {
					id: impersonatedOrg.id,
					name: impersonatedOrg.name,
					logoUrl: impersonatedOrg.logoUrl,
					slug: impersonatedOrg.slug,
					role: "SUPER_ADMIN",
				}
			: {
					id: activeMembership?.organizationId || "",
					name: activeMembership?.name || "My Workspace",
					logoUrl: activeMembership?.logoUrl || null,
					slug: activeMembership?.slug || "",
					role: activeMembership?.role || "MEMBER",
				};

		return {
			user: {
				...ctx.session.user,
				name: userDb?.name || ctx.session.user.name,
				email: userDb?.email || ctx.session.user.email,
				image: userDb?.image || ctx.session.user.image,
			},
			activeOrganization,
			impersonatedOrgId: ctx.impersonatedOrgId ?? null,
			impersonatedOrgName: impersonatedOrg?.name ?? null,
			organizations: userMemberships.map((m) => ({
				id: m.organizationId,
				name: m.name,
				logoUrl: m.logoUrl,
				slug: m.slug,
				role: m.role,
			})),
			tenantRole: impersonatedOrg
				? "SUPER_ADMIN"
				: (activeMembership?.role ?? "MEMBER"),
			onboardingComplete: userDb?.onboardingComplete ?? false,
		};
	}),

	getMetrics: protectedProcedure
		.input(
			z
				.object({
					period: z.enum(["month", "quarter", "year", "all"]).default("month"),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const period = input?.period ?? "month";

			const member = await ctx.db.query.organizationMembers.findFirst({
				where: eq(organizationMembers.userId, ctx.session.user.id),
			});
			const organizationId =
				ctx.session.user.organizationId || member?.organizationId;

			if (!organizationId) {
				return {
					totalRevenue: 0,
					revenueTrend: 0,
					activeDealsCount: 0,
					pipelineValue: 0,
					overdueInvoicesCount: 0,
					overdueAmount: 0,
					totalContacts: 0,
					period,
				};
			}

			const now = new Date();
			let startDate: Date | null = null;
			let priorStartDate: Date | null = null;
			let priorEndDate: Date | null = null;

			if (period === "month") {
				startDate = subDays(now, 30);
				priorEndDate = startDate;
				priorStartDate = subDays(startDate, 30);
			} else if (period === "quarter") {
				startDate = subDays(now, 90);
				priorEndDate = startDate;
				priorStartDate = subDays(startDate, 90);
			} else if (period === "year") {
				startDate = subDays(now, 365);
				priorEndDate = startDate;
				priorStartDate = subDays(startDate, 365);
			}

			// 1. Current Period Paid Revenue
			const currentRevenueConditions = [
				eq(invoices.organizationId, organizationId),
				eq(invoices.status, "PAID"),
			];
			if (startDate) {
				currentRevenueConditions.push(gte(invoices.createdAt, startDate));
			}

			const [currentRevenueResult] = await ctx.db
				.select({
					total: sql<number>`cast(coalesce(sum(${invoices.amountPaid}), 0) as integer)`,
				})
				.from(invoices)
				.where(and(...currentRevenueConditions));

			const totalRevenue = currentRevenueResult?.total || 0;

			// 2. Prior Period Paid Revenue for Trend calculation
			let revenueTrend = 0;
			if (priorStartDate && priorEndDate) {
				const [priorRevenueResult] = await ctx.db
					.select({
						total: sql<number>`cast(coalesce(sum(${invoices.amountPaid}), 0) as integer)`,
					})
					.from(invoices)
					.where(
						and(
							eq(invoices.organizationId, organizationId),
							eq(invoices.status, "PAID"),
							gte(invoices.createdAt, priorStartDate),
							lte(invoices.createdAt, priorEndDate),
						),
					);
				const priorTotal = priorRevenueResult?.total || 0;
				if (priorTotal > 0) {
					revenueTrend =
						Math.round(((totalRevenue - priorTotal) / priorTotal) * 1000) / 10;
				} else if (totalRevenue > 0) {
					revenueTrend = 100;
				}
			}

			// 3. Active Deals & Pipeline Value
			const [dealsResult] = await ctx.db
				.select({
					count: sql<number>`cast(count(${deals.id}) as integer)`,
					value: sql<number>`cast(coalesce(sum(${deals.value}), 0) as integer)`,
				})
				.from(deals)
				.where(
					and(
						eq(deals.organizationId, organizationId),
						eq(deals.status, "OPEN"),
					),
				);

			// 4. Overdue Invoices
			const [overdueResult] = await ctx.db
				.select({
					count: sql<number>`cast(count(${invoices.id}) as integer)`,
					amount: sql<number>`cast(coalesce(sum(${invoices.balanceDue}), 0) as integer)`,
				})
				.from(invoices)
				.where(
					and(
						eq(invoices.organizationId, organizationId),
						sql`(${invoices.status} = 'OVERDUE' OR (${invoices.status} = 'SENT' AND ${invoices.dueDate} < ${now}))`,
					),
				);

			// 5. Total Contacts Count
			const [contactsResult] = await ctx.db
				.select({ count: sql<number>`cast(count(${companies.id}) as integer)` })
				.from(companies)
				.where(eq(companies.organizationId, organizationId));

			return {
				totalRevenue,
				revenueTrend,
				activeDealsCount: dealsResult?.count || 0,
				pipelineValue: dealsResult?.value || 0,
				overdueInvoicesCount: overdueResult?.count || 0,
				overdueAmount: overdueResult?.amount || 0,
				totalContacts: contactsResult?.count || 0,
				period,
			};
		}),

	getRecentDeals: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		const organizationId =
			ctx.session.user.organizationId || member?.organizationId;

		if (!organizationId) {
			return [];
		}

		const recentDeals = await ctx.db
			.select({
				id: deals.id,
				title: deals.title,
				value: deals.value,
				status: deals.status,
				createdAt: deals.createdAt,
				updatedAt: deals.updatedAt,
				companyName: companies.name,
				companyLogo: companies.logoUrl,
				stageName: pipelineStages.name,
				stageColor: pipelineStages.color,
				assignedUserName: users.name,
				assignedUserImage: users.image,
			})
			.from(deals)
			.leftJoin(companies, eq(deals.companyId, companies.id))
			.leftJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
			.leftJoin(users, eq(deals.assignedUserId, users.id))
			.where(eq(deals.organizationId, organizationId))
			.orderBy(desc(deals.updatedAt))
			.limit(5);

		return recentDeals;
	}),

	getUpcomingInvoices: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		const organizationId =
			ctx.session.user.organizationId || member?.organizationId;

		if (!organizationId) {
			return [];
		}

		const upcomingInvoices = await ctx.db
			.select({
				id: invoices.id,
				invoiceNumber: invoices.invoiceNumber,
				totalAmount: invoices.totalAmount,
				amountPaid: invoices.amountPaid,
				balanceDue: invoices.balanceDue,
				dueDate: invoices.dueDate,
				status: invoices.status,
				companyName: companies.name,
				companyLogo: companies.logoUrl,
			})
			.from(invoices)
			.leftJoin(companies, eq(invoices.companyId, companies.id))
			.where(
				and(
					eq(invoices.organizationId, organizationId),
					inArray(invoices.status, ["SENT", "OVERDUE"]),
				),
			)
			.orderBy(asc(invoices.dueDate))
			.limit(5);

		return upcomingInvoices;
	}),

	getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		const organizationId =
			ctx.session.user.organizationId || member?.organizationId;

		if (!organizationId) {
			return [];
		}

		const recentTasks = await ctx.db.query.crmTasks.findMany({
			where: eq(crmTasks.organizationId, organizationId),
			orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
			limit: 5,
		});

		return recentTasks;
	}),

	// Executive Telemetry: MRR, ARR, Cash-Flow Run Rate, Pipeline Velocity, and Low-Stock Alerts
	getExecutiveTelemetry: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		const organizationId =
			ctx.impersonatedOrgId ||
			ctx.session.user.organizationId ||
			member?.organizationId;

		if (!organizationId) {
			return {
				mrr: 0,
				arr: 0,
				activeSubscriptionsCount: 0,
				monthlyCashFlowRunRate: 0,
				annualCashFlowRunRate: 0,
				avgDaysToClose: 0,
				lowStockProducts: [],
				overdueInvoices: [],
			};
		}

		// 1. MRR & ARR from active client subscriptions
		const subs = await ctx.db.query.clientSubscriptions.findMany({
			where: eq(clientSubscriptions.organizationId, organizationId),
		});
		const mrrMetrics = calculateMRRAndARR(subs);

		// 2. Cash-Flow 90-day Run Rate
		const ninetyDaysAgo = subDays(new Date(), 90);
		const [cashResult] = await ctx.db
			.select({
				totalCollected: sql<number>`cast(coalesce(sum(${invoices.amountPaid}), 0) as integer)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.organizationId, organizationId),
					gte(invoices.createdAt, ninetyDaysAgo),
				),
			);
		const collected90Days = cashResult?.totalCollected || 0;
		const monthlyCashFlowRunRate = Math.round(collected90Days / 3);

		// 3. Pipeline Conversion Velocity
		const wonDealsList = await ctx.db
			.select({
				createdAt: deals.createdAt,
				updatedAt: deals.updatedAt,
			})
			.from(deals)
			.where(
				and(eq(deals.organizationId, organizationId), eq(deals.status, "WON")),
			)
			.limit(50);

		let avgDaysToClose = 0;
		if (wonDealsList.length > 0) {
			const totalDays = wonDealsList.reduce((acc, d) => {
				const created = new Date(d.createdAt).getTime();
				const updated = new Date(d.updatedAt || d.createdAt).getTime();
				const days = Math.max(1, Math.round((updated - created) / 86400000));
				return acc + days;
			}, 0);
			avgDaysToClose = Math.round(totalDays / wonDealsList.length);
		}

		// 4. Low-Stock Alerts
		const lowStockProducts = await ctx.db
			.select({
				id: products.id,
				name: products.name,
				sku: products.sku,
				stockQuantity: products.stockQuantity,
				reservedQuantity: products.reservedQuantity,
			})
			.from(products)
			.where(
				and(
					eq(products.organizationId, organizationId),
					sql`(${products.stockQuantity} - ${products.reservedQuantity}) <= 5`,
				),
			)
			.limit(10);

		// 5. Overdue Invoices
		const overdueInvoices = await ctx.db
			.select({
				id: invoices.id,
				invoiceNumber: invoices.invoiceNumber,
				balanceDue: invoices.balanceDue,
				dueDate: invoices.dueDate,
			})
			.from(invoices)
			.where(
				and(eq(invoices.organizationId, organizationId), eq(invoices.status, "OVERDUE")),
			)
			.limit(5);

		return {
			mrr: mrrMetrics.mrr,
			arr: mrrMetrics.arr,
			activeSubscriptionsCount: mrrMetrics.activeSubscriptionsCount,
			monthlyCashFlowRunRate,
			annualCashFlowRunRate: monthlyCashFlowRunRate * 12,
			avgDaysToClose,
			lowStockProducts: lowStockProducts.map((p) => ({
				...p,
				availableStock: Math.max(0, p.stockQuantity - p.reservedQuantity),
			})),
			overdueInvoices,
		};
	}),
});
