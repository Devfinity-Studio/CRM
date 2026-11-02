"use client";

import {
	ArrowUpRight,
	Building2,
	CheckCircle2,
	ChevronRight,
	Clock,
	Compass,
	FileCheck2,
	Package,
	Plus,
	Receipt,
	Sparkles,
	TrendingDown,
	TrendingUp,
	Video,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { DealSheet } from "~/components/deals/deal-sheet";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useTour } from "~/hooks/use-tour";
import { api } from "~/trpc/react";
import { SetupChecklist } from "./_components/SetupChecklist";
import { WelcomeModal } from "./_components/WelcomeModal";

type PeriodType = "month" | "quarter" | "year" | "all";

export default function DashboardPage() {
	const [period, setPeriod] = useState<PeriodType>("month");
	const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
	const [dealSheetOpen, setDealSheetOpen] = useState(false);
	const [selectedDealTitle, setSelectedDealTitle] = useState("");

	const { data: layoutData } = api.dashboard.getLayoutData.useQuery();
	const { data: metrics, isLoading: metricsLoading } =
		api.dashboard.getMetrics.useQuery({ period });
	const { data: recentDeals, isLoading: dealsLoading } =
		api.dashboard.getRecentDeals.useQuery();
	const { data: upcomingInvoices, isLoading: invoicesLoading } =
		api.dashboard.getUpcomingInvoices.useQuery();
	const { data: telemetry } = api.dashboard.getExecutiveTelemetry.useQuery();

	const dashboardTourSteps = [
		{
			element: "#tour-checklist",
			popover: {
				title: "Setup Checklist",
				description:
					"Follow these setup steps to configure your CRM environment.",
				side: "bottom",
			},
		},
		{
			element: "#tour-kpi-grid",
			popover: {
				title: "Telemetry & KPI Cards",
				description:
					"View real-time revenue, deal momentum, and collection metrics.",
				side: "bottom",
			},
		},
		{
			element: "#tour-deals-table",
			popover: {
				title: "Recent Deals Overview",
				description:
					"Click any deal row to inspect the activity timeline and deal details in slide-out view.",
				side: "top",
			},
		},
	];

	const { startTour, forceStartTour } = useTour(
		dashboardTourSteps,
		"dashboard",
	);

	React.useEffect(() => {
		const t = setTimeout(() => startTour(), 600);
		return () => clearTimeout(t);
	}, [startTour]);

	const formatCurrency = (cents: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			maximumFractionDigits: 0,
		}).format(cents / 100);
	};

	const handleRowClick = (deal: { id: string; title: string }) => {
		setSelectedDealId(deal.id);
		setSelectedDealTitle(deal.title);
		setDealSheetOpen(true);
	};

	const userName = layoutData?.user?.name || "Alex";

	return (
		<DashboardLayout>
			<div className="mx-auto flex max-w-[1600px] flex-col gap-6 pb-10">
				<WelcomeModal onStartTour={() => setTimeout(() => forceStartTour(), 300)} />

				<div id="tour-checklist">
					<SetupChecklist />
				</div>

				{/* Greeting Banner & Filter Bar Glassmorphic Area */}
				<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					<div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="flex flex-col gap-1">
							<div className="flex items-center gap-2">
								<span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
									Q2 Velocity Stage
								</span>
								<span className="text-muted-foreground text-xs">
									• Live Workspace Telemetry
								</span>
							</div>
							<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Good morning, {userName}
							</h1>
							<p className="text-muted-foreground text-sm">
								Here is your sales performance telemetry and deal momentum
								overview.
							</p>
						</div>

						{/* Quick Context & Time Range Filter Pills */}
						<div className="flex flex-wrap items-center gap-2">
							<div className="flex items-center rounded-xl border border-border/80 bg-background/70 p-1 shadow-2xs">
								{(
									[
										{ id: "month", label: "This Month" },
										{ id: "quarter", label: "This Quarter" },
										{ id: "year", label: "This Year" },
										{ id: "all", label: "All Time" },
									] as const
								).map((p) => (
									<button
										className={`rounded-lg px-3 py-1 font-medium text-xs transition-all ${
											period === p.id
												? "bg-primary font-semibold text-white shadow-xs"
												: "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
										}`}
										key={p.id}
										onClick={() => setPeriod(p.id)}
										type="button"
									>
										{p.label}
									</button>
								))}
							</div>

							<Button
								className="gap-1.5 rounded-xl border-border/80 bg-background/60 text-muted-foreground text-xs hover:text-foreground"
								onClick={forceStartTour}
								size="sm"
								variant="outline"
							>
								<Compass className="h-3.5 w-3.5" />
								<span>Tour</span>
							</Button>
						</div>
					</div>

					{/* Subtle Ambient Mesh Glow */}
					<div className="pointer-events-none absolute -top-16 -right-16 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
				</section>

				{/* Executive Telemetry Strip */}
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div className="rounded-xl border border-border/70 bg-card/60 p-3.5 shadow-xs">
						<span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
							<TrendingUp className="h-3.5 w-3.5" /> Live MRR
						</span>
						<div className="mt-1 text-xl font-bold font-mono text-foreground">
							{formatCurrency(telemetry?.mrr ?? 0)}
						</div>
						<div className="text-[11px] text-muted-foreground mt-0.5">
							ARR: {formatCurrency(telemetry?.arr ?? 0)}
						</div>
					</div>

					<div className="rounded-xl border border-border/70 bg-card/60 p-3.5 shadow-xs">
						<span className="text-xs font-medium text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
							<Receipt className="h-3.5 w-3.5" /> 90-Day Cash Flow
						</span>
						<div className="mt-1 text-xl font-bold font-mono text-foreground">
							{formatCurrency(telemetry?.monthlyCashFlowRunRate ?? 0)}
						</div>
						<div className="text-[11px] text-muted-foreground mt-0.5">
							Monthly run rate
						</div>
					</div>

					<div className="rounded-xl border border-border/70 bg-card/60 p-3.5 shadow-xs">
						<span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
							<Clock className="h-3.5 w-3.5" /> Sales Velocity
						</span>
						<div className="mt-1 text-xl font-bold font-mono text-foreground">
							{telemetry?.avgDaysToClose ?? 0} days
						</div>
						<div className="text-[11px] text-muted-foreground mt-0.5">
							Avg time to close deals
						</div>
					</div>

					<div className="rounded-xl border border-border/70 bg-card/60 p-3.5 shadow-xs">
						<span className="text-xs font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
							<CheckCircle2 className="h-3.5 w-3.5" /> Recurring Accounts
						</span>
						<div className="mt-1 text-xl font-bold font-mono text-foreground">
							{telemetry?.activeSubscriptionsCount ?? 0} active
						</div>
						<div className="text-[11px] text-muted-foreground mt-0.5">
							Client subscriptions
						</div>
					</div>
				</div>

				{telemetry?.lowStockProducts && telemetry.lowStockProducts.length > 0 && (
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 shadow-xs">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
								<Package className="h-5 w-5" />
							</div>
							<div>
								<div className="font-semibold text-sm text-foreground">
									Warehouse Inventory Alert: {telemetry.lowStockProducts.length} Product(s) Low on Stock
								</div>
								<div className="text-xs text-muted-foreground">
									{telemetry.lowStockProducts.map((p) => `${p.name} (${p.availableStock} available)`).join(", ")}
								</div>
							</div>
						</div>
						<Button asChild size="sm" variant="outline" className="border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400 shrink-0">
							<Link href="/inventory/products">Manage Inventory</Link>
						</Button>
					</div>
				)}

				{/* 4 Glassmorphic KPI Cards Grid */}
				<section
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4"
					id="tour-kpi-grid"
				>
					{/* Metric 1: Total Revenue */}
					<div className="group flex flex-col justify-between rounded-2xl border border-border/70 bg-card/75 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
						<div className="flex items-start justify-between">
							<div className="flex flex-col">
								<span className="font-medium text-muted-foreground text-xs">
									Total Revenue
								</span>
								<span className="mt-1 font-bold font-mono text-2xl text-foreground tracking-tight">
									{metricsLoading
										? "..."
										: formatCurrency(metrics?.totalRevenue ?? 0)}
								</span>
							</div>
							<div className="rounded-xl bg-primary/10 p-2.5 text-primary">
								<Receipt className="h-5 w-5" />
							</div>
						</div>
						<div className="mt-4 flex items-center justify-between border-border/60 border-t pt-3">
							<span
								className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-xs ${
									(metrics?.revenueTrend ?? 0) >= 0
										? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
										: "bg-destructive/10 text-destructive"
								}`}
							>
								{(metrics?.revenueTrend ?? 0) >= 0 ? (
									<TrendingUp className="h-3.5 w-3.5" />
								) : (
									<TrendingDown className="h-3.5 w-3.5" />
								)}
								{(metrics?.revenueTrend ?? 0) > 0 ? "+" : ""}
								{metrics?.revenueTrend ?? 0}%
							</span>
							<span className="text-muted-foreground text-xs">
								vs previous period
							</span>
						</div>
					</div>

					{/* Metric 2: Active Deals */}
					<div className="group flex flex-col justify-between rounded-2xl border border-border/70 bg-card/75 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
						<div className="flex items-start justify-between">
							<div className="flex flex-col">
								<span className="font-medium text-muted-foreground text-xs">
									Active Deals
								</span>
								<span className="mt-1 font-bold font-mono text-2xl text-foreground tracking-tight">
									{metricsLoading ? "..." : (metrics?.activeDealsCount ?? 0)}
								</span>
							</div>
							<div className="rounded-xl bg-secondary/20 p-2.5 text-secondary-foreground">
								<Building2 className="h-5 w-5" />
							</div>
						</div>
						<div className="mt-4 flex items-center gap-2 border-border/60 border-t pt-3">
							<div className="h-2 w-full overflow-hidden rounded-full bg-accent">
								<div
									className="h-2 rounded-full bg-primary transition-all duration-500"
									style={{
										width: `${Math.min(100, Math.max(10, (metrics?.activeDealsCount ?? 0) * 12))}%`,
									}}
								/>
							</div>
							<span className="whitespace-nowrap font-mono text-foreground text-xs">
								Active flow
							</span>
						</div>
					</div>

					{/* Metric 3: Pipeline Value */}
					<div className="group flex flex-col justify-between rounded-2xl border border-border/70 bg-card/75 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
						<div className="flex items-start justify-between">
							<div className="flex flex-col">
								<span className="font-medium text-muted-foreground text-xs">
									Pipeline Value
								</span>
								<span className="mt-1 font-bold font-mono text-2xl text-foreground tracking-tight">
									{metricsLoading
										? "..."
										: formatCurrency(metrics?.pipelineValue ?? 0)}
								</span>
							</div>
							<div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-400">
								<Sparkles className="h-5 w-5" />
							</div>
						</div>
						<div className="mt-4 flex items-center justify-between border-border/60 border-t pt-3">
							<span className="inline-flex items-center gap-1 font-medium text-primary text-xs">
								<CheckCircle2 className="h-3.5 w-3.5" />
								Qualified pipeline
							</span>
							<span className="text-muted-foreground text-xs">
								High confidence
							</span>
						</div>
					</div>

					{/* Metric 4: Collections & Overdue */}
					<div className="group flex flex-col justify-between rounded-2xl border border-border/70 bg-card/75 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
						<div className="flex items-start justify-between">
							<div className="flex flex-col">
								<span className="font-medium text-muted-foreground text-xs">
									Overdue Balance
								</span>
								<span className="mt-1 font-bold font-mono text-2xl text-foreground tracking-tight">
									{metricsLoading
										? "..."
										: formatCurrency(metrics?.overdueAmount ?? 0)}
								</span>
							</div>
							<div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
								<Clock className="h-5 w-5" />
							</div>
						</div>
						<div className="mt-4 flex items-center justify-between border-border/60 border-t pt-3">
							<span className="font-medium text-foreground text-xs">
								{metrics?.overdueInvoicesCount ?? 0} invoices pending
							</span>
							<Badge className="text-[10px]" variant="outline">
								{(metrics?.overdueInvoicesCount ?? 0) === 0
									? "Healthy"
									: "Attention"}
							</Badge>
						</div>
					</div>
				</section>

				{/* Asymmetric 2-Column CRM Workspace Section */}
				<section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
					{/* Left Column: Recent Deals & Pipeline Summary (8 Cols) */}
					<div
						className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md lg:col-span-7 xl:col-span-8"
						id="tour-deals-table"
					>
						<div>
							<div className="mb-4 flex items-center justify-between border-border/60 border-b pb-4">
								<div className="flex items-center gap-3">
									<h2 className="font-bold text-foreground text-lg tracking-tight">
										Recent Deals &amp; Pipeline
									</h2>
									<span className="rounded-full bg-accent px-2 py-0.5 font-mono text-muted-foreground text-xs">
										{recentDeals?.length ?? 0} Active
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Link
										className="inline-flex items-center gap-1 font-semibold text-primary text-xs transition-colors hover:text-primary/80"
										href="/deals"
									>
										<span>View all pipeline</span>
										<ChevronRight className="h-3.5 w-3.5" />
									</Link>
								</div>
							</div>

							{/* Deal Rows */}
							<div className="space-y-2.5">
								{dealsLoading ? (
									<div className="py-8 text-center text-muted-foreground text-sm">
										Loading pipeline telemetry...
									</div>
								) : recentDeals && recentDeals.length > 0 ? (
									recentDeals.map((deal) => (
										<button
											className="group flex w-full flex-col justify-between gap-3 rounded-xl border border-border/70 bg-background/50 p-3.5 text-left transition-all duration-150 hover:border-primary/40 hover:bg-card hover:shadow-xs sm:flex-row sm:items-center"
											key={deal.id}
											onClick={() => handleRowClick(deal)}
											type="button"
										>
											<div className="flex items-center gap-3">
												<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 font-bold font-mono text-primary text-xs">
													{deal.title.slice(0, 2).toUpperCase()}
												</div>
												<div className="flex flex-col truncate">
													<h4 className="truncate font-semibold text-foreground text-sm transition-colors group-hover:text-primary">
														{deal.title}
													</h4>
													<p className="truncate text-muted-foreground text-xs">
														{deal.companyName || "Direct Prospect"} • Lead:{" "}
														{deal.assignedUserName || "Team"}
													</p>
												</div>
											</div>

											<div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
												<span
													className="rounded-full px-2.5 py-0.5 font-medium text-xs"
													style={{
														backgroundColor: `${deal.stageColor || "#6366f1"}15`,
														color: deal.stageColor || "#6366f1",
													}}
												>
													{deal.stageName || "Prospect"}
												</span>
												<span className="font-bold font-mono text-foreground text-sm">
													{formatCurrency(deal.value)}
												</span>
												<ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
											</div>
										</button>
									))
								) : (
									<div className="py-8 text-center text-muted-foreground text-sm">
										No active deals in pipeline yet.
									</div>
								)}
							</div>
						</div>

						<div className="mt-4 flex items-center justify-between border-border/60 border-t pt-3 text-muted-foreground text-xs">
							<span>
								Click any deal row to open details &amp; activity timeline
							</span>
							<Link
								className="font-medium font-mono text-primary hover:underline"
								href="/deals"
							>
								Manage Kanban Board
							</Link>
						</div>
					</div>

					{/* Right Column: Upcoming Invoices & Schedule (4 Cols) */}
					<div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md lg:col-span-5 xl:col-span-4">
						<div>
							<div className="mb-4 flex items-center justify-between border-border/60 border-b pb-4">
								<div className="flex items-center gap-2">
									<Receipt className="h-4 w-4 text-primary" />
									<h3 className="font-bold text-foreground text-sm">
										Upcoming Invoices
									</h3>
								</div>
								<Badge className="text-[10px]" variant="secondary">
									Real-time
								</Badge>
							</div>

							{invoicesLoading ? (
								<div className="py-8 text-center text-muted-foreground text-sm">
									Checking invoices...
								</div>
							) : upcomingInvoices && upcomingInvoices.length > 0 ? (
								<div className="space-y-2.5">
									{upcomingInvoices.map((inv) => (
										<Link
											className="group flex items-center justify-between rounded-xl border border-border/70 bg-background/50 p-3 text-xs transition-all hover:border-primary/40 hover:bg-card"
											href={`/billing/invoice/${inv.id}`}
											key={inv.id}
										>
											<div className="flex flex-col truncate">
												<span className="truncate font-semibold text-foreground">
													{inv.invoiceNumber}
												</span>
												<span className="truncate text-muted-foreground">
													{inv.companyName || "Client"}
												</span>
											</div>
											<div className="flex shrink-0 items-center gap-2 font-mono font-semibold text-foreground">
												<span>{formatCurrency(inv.balanceDue)}</span>
												<ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
											</div>
										</Link>
									))}
								</div>
							) : (
								/* Glassmorphic Dashed Empty State Container */
								<div className="flex flex-col items-center justify-center rounded-2xl border-2 border-border/80 border-dashed bg-accent/30 p-6 text-center">
									<div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-card text-primary shadow-xs">
										<FileCheck2 className="h-7 w-7" />
										<div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
											<CheckCircle2 className="h-3.5 w-3.5" />
										</div>
									</div>
									<h4 className="font-semibold text-foreground text-sm">
										No pending invoices for review
									</h4>
									<p className="mt-1 max-w-xs text-muted-foreground text-xs">
										All customer billings are synced and up to date with
										automated reminder webhooks.
									</p>
									<div className="mt-4 flex w-full flex-col gap-2">
										<Link className="w-full" href="/billing/invoices/new">
											<Button
												className="w-full gap-1.5 bg-primary font-medium text-white text-xs shadow-xs"
												size="sm"
											>
												<Plus className="h-3.5 w-3.5" />
												<span>Generate Invoice</span>
											</Button>
										</Link>
									</div>
								</div>
							)}
						</div>

						{/* Next Pitch or Demo Footer */}
						<div className="mt-4 flex items-center justify-between rounded-xl border border-border/70 bg-background/60 p-3 text-xs">
							<div className="flex items-center gap-2.5">
								<Video className="h-4 w-4 text-primary" />
								<div className="flex flex-col">
									<span className="font-semibold text-foreground">
										Next Client Sync
									</span>
									<span className="text-[11px] text-muted-foreground">
										Automated Calendar Ready
									</span>
								</div>
							</div>
							<Badge className="font-mono text-[10px]" variant="outline">
								Active
							</Badge>
						</div>
					</div>
				</section>

				{/* Slide-out DealSheet Drawer for In-Context Deal Inspection */}
				<DealSheet
					dealId={selectedDealId}
					onOpenChange={setDealSheetOpen}
					onStatusChange={() => {
						// Refetch recent deals and metrics on deal win/loss status change
					}}
					open={dealSheetOpen}
					title={selectedDealTitle}
				/>
			</div>
		</DashboardLayout>
	);
}
