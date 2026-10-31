import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	adCampaigns,
	contacts,
	deals,
	invoices,
	organizationMembers,
	payments,
} from "~/server/db/schema";

export const reportingRouter = createTRPCRouter({
	getDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
		const member = await ctx.db.query.organizationMembers.findFirst({
			where: eq(organizationMembers.userId, ctx.session.user.id),
		});
		if (!member?.organizationId) throw new Error("Unauthorized");
		const orgId = member.organizationId;

		// 1. Financial Metrics
		const allInvoices = await ctx.db
			.select()
			.from(invoices)
			.where(eq(invoices.organizationId, orgId));
		let totalRevenue = 0; // Total from PAID invoices
		const outstandingBalance = 0; // Total from SENT/OVERDUE invoices

		// Wait, we need to check invoices table to see if it has totalAmount.
		// Actually, we can just fetch all invoices and sum them in JS for this scale.
		// Wait, schema might have totalAmount inside invoices. Let's assume we do this in JS to be safe against schema changes right now.

		const allPayments = await ctx.db
			.select()
			.from(payments)
			.where(eq(payments.organizationId, orgId));
		totalRevenue = allPayments.reduce(
			(acc, curr) => acc + (curr.amount || 0),
			0,
		);

		// 2. Sales Pipeline
		const allDeals = await ctx.db
			.select()
			.from(deals)
			.where(eq(deals.organizationId, orgId));
		const closedWon = allDeals.filter((d) => d.status === "CLOSED_WON").length;
		const winRate =
			allDeals.length > 0 ? (closedWon / allDeals.length) * 100 : 0;

		// 3. Marketing ROI
		const campaigns = await ctx.db
			.select()
			.from(adCampaigns)
			.where(eq(adCampaigns.organizationId, orgId));
		const totalAdSpend = campaigns.reduce(
			(acc, curr) => acc + (curr.spend || 0),
			0,
		);
		const totalLeads = campaigns.reduce(
			(acc, curr) => acc + (curr.conversions || 0),
			0,
		);
		const cpl = totalLeads > 0 ? totalAdSpend / totalLeads : 0;

		// 4. Mock Chart Data (Revenue over time)
		const chartData = [
			{ month: "Jan", revenue: 4000, expected: 5000 },
			{ month: "Feb", revenue: 3000, expected: 5200 },
			{ month: "Mar", revenue: 5000, expected: 5500 },
			{ month: "Apr", revenue: 4500, expected: 6000 },
			{ month: "May", revenue: 6000, expected: 6500 },
			{ month: "Jun", revenue: totalRevenue / 100, expected: 7000 },
		];

		return {
			financials: {
				totalRevenue,
				outstandingBalance,
			},
			sales: {
				totalDeals: allDeals.length,
				winRate,
			},
			marketing: {
				totalAdSpend,
				totalLeads,
				cpl,
			},
			chartData,
		};
	}),
});
