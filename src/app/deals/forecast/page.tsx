"use client";

import {
	ArrowLeft,
	BarChart3,
	DollarSign,
	Loader2,
	Sparkles,
	Target,
	TrendingUp,
	Trophy,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { api } from "~/trpc/react";

export const dynamic = "force-dynamic";

export default function ForecastPage() {
	const sessionContext = useSession();
	const session = sessionContext?.data;
	const orgId = session?.user?.organizationId as string;

	const { data: pipelines } = api.deals.getPipelines.useQuery(
		{ organizationId: orgId },
		{ enabled: !!orgId },
	);
	const defaultPipelineId = pipelines?.[0]?.id;

	const { data: metrics, isLoading } = api.deals.getMetricsSummary.useQuery(
		{ organizationId: orgId, pipelineId: defaultPipelineId ?? "" },
		{ enabled: !!orgId && !!defaultPipelineId },
	);

	return (
		<DashboardLayout>
			<div className="mx-auto flex max-w-[1600px] flex-col gap-6 pb-8">
				{/* Top Control Bar */}
				<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					<div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
						<div className="flex items-center gap-4">
							<Button asChild className="rounded-xl" size="icon" variant="outline">
								<Link href="/deals">
									<ArrowLeft className="h-4 w-4" />
								</Link>
							</Button>
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2.5">
									<span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
										Revenue Forecasting
									</span>
									<span className="text-muted-foreground text-xs">
										Pipeline Probability Models
									</span>
								</div>
								<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
									Revenue Forecast &amp; Velocity
								</h1>
								<p className="text-muted-foreground text-sm">
									Probability-weighted revenue projections, conversion ratios, and win velocity.
								</p>
							</div>
						</div>
					</div>
					<div className="pointer-events-none absolute -top-16 -right-16 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
				</section>

				{isLoading ? (
					<div className="flex justify-center p-16">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				) : metrics ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<Card className="rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md">
							<CardHeader className="pb-2">
								<CardDescription className="text-xs font-medium">Total Open Pipeline</CardDescription>
								<CardTitle className="flex items-center font-mono text-2xl text-foreground font-bold tracking-tight">
									<DollarSign className="mr-1 h-5 w-5 text-emerald-500" />
									{(metrics.totalPipelineValue / 100).toLocaleString(
										undefined,
										{ minimumFractionDigits: 0, maximumFractionDigits: 0 },
									)}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-muted-foreground text-xs">
									Across {metrics.openDealsCount} active qualified deal(s)
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md">
							<CardHeader className="pb-2">
								<CardDescription className="text-xs font-medium">Weighted Forecast Revenue</CardDescription>
								<CardTitle className="flex items-center font-mono text-2xl text-primary font-bold tracking-tight">
									<Sparkles className="mr-1.5 h-5 w-5 text-primary" />
									$
									{(metrics.forecastedRevenue / 100).toLocaleString(undefined, {
										minimumFractionDigits: 0,
										maximumFractionDigits: 0,
									})}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-muted-foreground text-xs">
									Weighted by stage win probabilities
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md">
							<CardHeader className="pb-2">
								<CardDescription className="text-xs font-medium">Deals Won</CardDescription>
								<CardTitle className="flex items-center font-mono text-2xl text-foreground font-bold tracking-tight">
									<Trophy className="mr-2 h-5 w-5 text-emerald-500" />
									{metrics.wonDealsCount}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-muted-foreground text-xs">
									Closed Won in current workspace
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md">
							<CardHeader className="pb-2">
								<CardDescription className="text-xs font-medium">Pipeline Win Rate</CardDescription>
								<CardTitle className="flex items-center font-mono text-2xl text-foreground font-bold tracking-tight">
									<BarChart3 className="mr-2 h-5 w-5 text-primary" />
									{metrics.winRate}%
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Progress className="mt-2 h-2 rounded-full" value={metrics.winRate} />
								<div className="mt-2 flex justify-between text-muted-foreground text-xs font-mono">
									<span className="text-emerald-500">{metrics.wonDealsCount} Won</span>
									<span className="text-destructive">{metrics.lostDealsCount} Lost</span>
								</div>
							</CardContent>
						</Card>
					</div>
				) : (
					<div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center text-muted-foreground text-sm">
						No pipeline data available to forecast.
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}
