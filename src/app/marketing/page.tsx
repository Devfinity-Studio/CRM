import Link from "next/link";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { auth } from "~/server/auth";

export default async function MarketingPage() {
	const session = await auth();

	const mockCampaigns = [
		{
			id: "1",
			name: "Q3 Developer Search Ads",
			platform: "Google Ads",
			spend: "$4,500",
			clicks: 3200,
			conversions: 140,
			cpl: "$32.14",
		},
		{
			id: "2",
			name: "SaaS Enterprise Retargeting",
			platform: "LinkedIn Ads",
			spend: "$8,200",
			clicks: 1100,
			conversions: 65,
			cpl: "$126.15",
		},
		{
			id: "3",
			name: "Dev Tools Community Promo",
			platform: "Twitter/X",
			spend: "$1,800",
			clicks: 4500,
			conversions: 210,
			cpl: "$8.57",
		},
	];

	return (
		<DashboardLayout
			userEmail={session?.user?.email || "marketing@devcrm.io"}
			userName={session?.user?.name || "Marketing Manager"}
			userRole={session?.user?.systemRole || "USER"}
		>
			<div className="mx-auto flex max-w-[1700px] flex-col gap-6 pb-12">
				{/* Header Section */}
				<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
									Growth & Acquisition
								</span>
								<span className="text-muted-foreground text-xs">
									Multi-Channel Ad Attribution
								</span>
							</div>
							<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Ad Campaigns & ROI Analytics
							</h1>
							<p className="text-muted-foreground text-xs sm:text-sm">
								Track multi-channel ad spend, lead conversions, Cost Per Lead (CPL), and customer acquisition metrics.
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Button asChild className="rounded-xl min-h-[44px] sm:min-h-0">
								<Link href="/marketing/ads">
									+ Connect Campaign
								</Link>
							</Button>
						</div>
					</div>

					{/* Marketing KPI Metrics */}
					<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
							<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Total Ad Spend
							</span>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className="font-bold text-foreground text-xl tabular-nums tracking-tight sm:text-2xl">
									$14,500
								</span>
							</div>
						</div>

						<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
							<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Leads Captured
							</span>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className="font-bold text-sky-500 text-xl tabular-nums tracking-tight sm:text-2xl">
									415 Leads
								</span>
							</div>
						</div>

						<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
							<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Average CPL
							</span>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className="font-bold text-emerald-500 text-xl tabular-nums tracking-tight sm:text-2xl">
									$34.93
								</span>
							</div>
						</div>

						<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
							<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Blended CAC
							</span>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className="font-bold text-primary text-xl tabular-nums tracking-tight sm:text-2xl">
									$215.00
								</span>
							</div>
						</div>
					</div>
				</section>

				{/* Active Campaigns Table */}
				<Card className="rounded-3xl border border-border/70 bg-card/75 shadow-sm backdrop-blur-md">
					<CardHeader className="p-4 sm:p-6 pb-2">
						<CardTitle className="text-lg font-bold">Active Ad Campaigns</CardTitle>
						<CardDescription className="text-xs">
							Performance attribution breakdown by connected advertising channel.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0 sm:p-6 sm:pt-0">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="border-border/60">
										<TableHead className="text-xs font-semibold">Campaign Name</TableHead>
										<TableHead className="text-xs font-semibold">Platform</TableHead>
										<TableHead className="text-xs font-semibold">Spend</TableHead>
										<TableHead className="text-xs font-semibold">Clicks</TableHead>
										<TableHead className="text-xs font-semibold">Conversions</TableHead>
										<TableHead className="text-xs font-semibold text-right">Cost / Lead (CPL)</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{mockCampaigns.map((c) => (
										<TableRow
											className="border-border/60 transition-colors hover:bg-accent/40"
											key={c.id}
										>
											<TableCell className="font-semibold text-foreground text-xs">
												{c.name}
											</TableCell>
											<TableCell className="text-xs">
												<Badge variant="outline">{c.platform}</Badge>
											</TableCell>
											<TableCell className="font-mono font-bold text-foreground text-xs tabular-nums">
												{c.spend}
											</TableCell>
											<TableCell className="font-mono text-muted-foreground text-xs tabular-nums">
												{c.clicks.toLocaleString()}
											</TableCell>
											<TableCell className="font-mono font-bold text-sky-500 text-xs tabular-nums">
												{c.conversions}
											</TableCell>
											<TableCell className="font-mono font-bold text-emerald-500 text-xs text-right tabular-nums">
												{c.cpl}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
