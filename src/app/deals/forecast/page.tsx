"use client";

import {
	ArrowLeft,
	BarChart3,
	DollarSign,
	Loader2,
	Trophy,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
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

	// For MVP, we'll just pick the first pipeline (or default). In a real app, there'd be a pipeline selector.
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
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button asChild size="icon" variant="outline">
							<Link href="/deals">
								<ArrowLeft className="h-4 w-4" />
							</Link>
						</Button>
						<div>
							<h2 className="font-bold text-2xl text-foreground tracking-tight">
								Pipeline Forecast & Reports
							</h2>
							<p className="text-muted-foreground text-sm">
								Track revenue, win rates, and overall deal pipeline health.
							</p>
						</div>
					</div>
				</div>

				{isLoading ? (
					<div className="flex justify-center p-12">
						<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
					</div>
				) : metrics ? (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Total Open Pipeline</CardDescription>
								<CardTitle className="flex items-center text-2xl text-emerald-500">
									<DollarSign className="mr-1 h-6 w-6" />
									{(metrics.totalPipelineValue / 100).toLocaleString(
										undefined,
										{ minimumFractionDigits: 2 },
									)}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-muted-foreground text-xs">
									Across {metrics.openDealsCount} open deal(s)
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Forecasted Revenue</CardDescription>
								<CardTitle className="flex items-center text-2xl text-blue-500">
									<DollarSign className="mr-1 h-6 w-6" />
									{(metrics.forecastedRevenue / 100).toLocaleString(undefined, {
										minimumFractionDigits: 2,
									})}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-muted-foreground text-xs">
									Based on win probabilities per stage
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Deals Won</CardDescription>
								<CardTitle className="flex items-center text-2xl text-foreground">
									<Trophy className="mr-2 h-5 w-5 text-emerald-500" />
									{metrics.wonDealsCount}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-muted-foreground text-xs">
									Closed Won deals
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-2">
								<CardDescription>Win Rate</CardDescription>
								<CardTitle className="flex items-center text-2xl text-foreground">
									<BarChart3 className="mr-2 h-5 w-5 text-primary" />
									{metrics.winRate}%
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Progress className="mt-2" value={metrics.winRate} />
								<div className="mt-2 flex justify-between text-muted-foreground text-xs">
									<span>{metrics.wonDealsCount} Won</span>
									<span>{metrics.lostDealsCount} Lost</span>
								</div>
							</CardContent>
						</Card>
					</div>
				) : (
					<div className="rounded-lg border bg-card p-12 text-center">
						No pipeline data available.
					</div>
				)}
			</div>
		</DashboardLayout>
	);
}
