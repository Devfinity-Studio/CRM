"use client";

import { BarChart3, Plus } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { DealDialog } from "~/components/deals/deal-dialog";
import { KanbanBoard } from "~/components/deals/kanban-board";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

export const dynamic = "force-dynamic";

export default function DealsPage() {
	const sessionContext = useSession();
	const session = sessionContext?.data;
	const orgId = session?.user?.organizationId as string;
	const [dealDialogOpen, setDealDialogOpen] = useState(false);
	const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");

	// Fetch pipelines to get the active pipeline
	const { data: pipelines } = api.deals.getPipelines.useQuery(
		{ organizationId: orgId },
		{ enabled: !!orgId },
	);

	useEffect(() => {
		if (pipelines && pipelines.length > 0 && !selectedPipelineId) {
			setSelectedPipelineId(pipelines[0]?.id ?? "");
		}
	}, [pipelines, selectedPipelineId]);

	// Fetch metrics summary for active pipeline
	const { data: metrics } = api.deals.getMetricsSummary.useQuery(
		{ organizationId: orgId, pipelineId: selectedPipelineId },
		{ enabled: !!orgId && !!selectedPipelineId },
	);

	const _activePipeline = pipelines?.find((p) => p.id === selectedPipelineId);

	return (
		<DashboardLayout>
			<div className="mx-auto flex max-w-[1700px] flex-col gap-6 pb-8">
				{/* Top Control Bar & Pipeline Summary */}
				<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					<div className="relative z-10 flex flex-col gap-5">
						<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center gap-2.5">
									<span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
										Sales Engine
									</span>
									<span className="text-muted-foreground text-xs">
										Enterprise Pipeline Management
									</span>
								</div>
								<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
									Deals & Pipeline
								</h1>
								<p className="text-muted-foreground text-sm">
									Track deal velocity, probability scoring, and stage
									progression in real time.
								</p>
							</div>

							<div className="flex flex-wrap items-center gap-3">
								{pipelines && pipelines.length > 1 && (
									<div className="w-[180px]">
										<Select
											onValueChange={setSelectedPipelineId}
											value={selectedPipelineId}
										>
											<SelectTrigger className="h-9 rounded-xl border-border/80 bg-background/70 text-xs shadow-xs">
												<SelectValue placeholder="Select Pipeline" />
											</SelectTrigger>
											<SelectContent>
												{pipelines.map((pipe) => (
													<SelectItem key={pipe.id} value={pipe.id}>
														{pipe.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}

								<Button
									asChild
									className="gap-2 rounded-xl border-border/80 bg-background/60 shadow-xs hover:bg-accent/60"
									size="sm"
									variant="outline"
								>
									<Link href="/deals/forecast">
										<BarChart3 className="h-4 w-4 text-primary" />
										<span className="text-xs">Forecast Analytics</span>
									</Link>
								</Button>

								<Button
									className="gap-1.5 rounded-xl bg-primary px-4 font-semibold text-primary-foreground text-xs shadow-xs transition-all hover:bg-primary/90"
									onClick={() => setDealDialogOpen(true)}
									size="sm"
								>
									<Plus className="h-4 w-4" />
									<span>New Deal</span>
								</Button>
							</div>
						</div>

						{/* Pipeline Quick-Metric Cards */}
						<div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
							<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
								<span className="font-medium text-muted-foreground text-xs">
									Pipeline Value
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
										$
										{(
											(metrics?.totalPipelineValue ?? 0) / 100 || 0
										).toLocaleString(undefined, {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}
									</span>
									<span className="font-medium text-[11px] text-emerald-500">
										Open
									</span>
								</div>
							</div>

							<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
								<span className="font-medium text-muted-foreground text-xs">
									Weighted Forecast
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
										$
										{(
											(metrics?.forecastedRevenue ?? 0) / 100 || 0
										).toLocaleString(undefined, {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}
									</span>
									<span className="font-medium text-[11px] text-primary">
										Probability
									</span>
								</div>
							</div>

							<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
								<span className="font-medium text-muted-foreground text-xs">
									Win Rate
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
										{metrics?.winRate ?? 0}%
									</span>
									<span className="font-medium text-[11px] text-emerald-500">
										Closed Won
									</span>
								</div>
							</div>

							<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
								<span className="font-medium text-muted-foreground text-xs">
									Active Opportunities
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
										{metrics?.openDealsCount ?? 0}
									</span>
									<span className="text-[11px] text-muted-foreground">
										In Flight
									</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Kanban Board Container */}
				<section className="h-[calc(100vh-320px)] min-h-[580px] overflow-hidden rounded-3xl border border-border/70 bg-card/40 p-4 shadow-sm backdrop-blur-md">
					<KanbanBoard
						onNewDeal={() => setDealDialogOpen(true)}
						pipelineId={selectedPipelineId || undefined}
					/>
				</section>
			</div>

			<DealDialog
				defaultPipelineId={selectedPipelineId || undefined}
				onOpenChange={setDealDialogOpen}
				open={dealDialogOpen}
			/>
		</DashboardLayout>
	);
}
