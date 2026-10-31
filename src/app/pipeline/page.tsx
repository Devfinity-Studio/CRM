import Link from "next/link";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { auth } from "~/server/auth";

export default async function PipelinePage() {
	const session = await auth();

	const stages = [
		{ id: "1", name: "Lead Identified", winProb: 20, color: "border-blue-500" },
		{
			id: "2",
			name: "Meeting Scheduled",
			winProb: 40,
			color: "border-indigo-500",
		},
		{ id: "3", name: "Proposal Sent", winProb: 60, color: "border-purple-500" },
		{ id: "4", name: "Negotiation", winProb: 80, color: "border-amber-500" },
		{ id: "5", name: "Closed Won", winProb: 100, color: "border-emerald-500" },
	];

	const deals = [
		{
			id: "d1",
			title: "Enterprise Dev Tools Deal",
			value: "$45,000",
			stageId: "1",
			company: "Acme Corp",
		},
		{
			id: "d2",
			title: "API SDK Integration License",
			value: "$18,000",
			stageId: "3",
			company: "TechStart Inc",
		},
		{
			id: "d3",
			title: "Annual SaaS Tier Contract",
			value: "$60,000",
			stageId: "4",
			company: "CloudScale",
		},
	];

	return (
		<DashboardLayout
			userEmail={session?.user?.email || "rep@devcrm.io"}
			userName={session?.user?.name || "Sales Rep"}
			userRole={session?.user?.systemRole || "USER"}
		>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-2xl text-foreground tracking-tight">
							Deal Pipeline
						</h2>
						<p className="text-muted-foreground text-sm">
							Manage opportunity stages, pipeline forecasting, and deal flows.
						</p>
					</div>
					<div className="flex gap-3">
						<Button variant="outline">Pipeline Settings</Button>
						<Button>+ New Deal</Button>
					</div>
				</div>

				{/* Metrics Widgets */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
					<Card className="border-border bg-card shadow-sm">
						<CardHeader className="py-3">
							<CardTitle className="font-mono text-muted-foreground text-xs uppercase">
								Total Pipeline Value
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-foreground">$123,000</div>
						</CardContent>
					</Card>
					<Card className="border-border bg-card shadow-sm">
						<CardHeader className="py-3">
							<CardTitle className="font-mono text-muted-foreground text-xs uppercase">
								Weighted Forecast
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-primary">$64,200</div>
						</CardContent>
					</Card>
					<Card className="border-border bg-card shadow-sm">
						<CardHeader className="py-3">
							<CardTitle className="font-mono text-muted-foreground text-xs uppercase">
								Open Opportunities
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-foreground">3 Deals</div>
						</CardContent>
					</Card>
					<Card className="border-border bg-card shadow-sm">
						<CardHeader className="py-3">
							<CardTitle className="font-mono text-muted-foreground text-xs uppercase">
								Est. Win Rate
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-emerald-600">45%</div>
						</CardContent>
					</Card>
				</div>

				{/* Kanban Board Columns */}
				<div className="grid grid-cols-1 gap-4 overflow-x-auto pb-4 md:grid-cols-5">
					{stages.map((stage) => {
						const stageDeals = deals.filter((d) => d.stageId === stage.id);
						return (
							<div
								className="flex min-h-[480px] flex-col rounded-xl border border-border bg-secondary/40 p-3 shadow-sm"
								key={stage.id}
							>
								<div
									className={`border-l-4 ${stage.color} mb-3 flex items-center justify-between py-1 pl-2`}
								>
									<span className="font-semibold text-foreground text-sm">
										{stage.name}
									</span>
									<Badge className="text-[10px]" variant="secondary">
										{stageDeals.length}
									</Badge>
								</div>

								<div className="flex-1 space-y-3">
									{stageDeals.map((deal) => (
										<Card
											className="cursor-grab border-border bg-card shadow-sm transition hover:border-primary"
											key={deal.id}
										>
											<CardContent className="space-y-2 p-3">
												<div className="font-medium text-foreground text-sm">
													{deal.title}
												</div>
												<div className="text-muted-foreground text-xs">
													{deal.company}
												</div>
												<div className="flex items-center justify-between border-border border-t pt-1 text-xs">
													<span className="font-bold text-emerald-600">
														{deal.value}
													</span>
													<span className="text-[10px] text-muted-foreground">
														{stage.winProb}% Prob
													</span>
												</div>
											</CardContent>
										</Card>
									))}
									{stageDeals.length === 0 && (
										<div className="flex h-24 items-center justify-center rounded-lg border border-border border-dashed text-muted-foreground text-xs">
											Drag deal here
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</DashboardLayout>
	);
}
