import { Calendar, CheckCircle2, Clock, Plus, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { auth } from "~/server/auth";

export default async function TasksPage() {
	const session = await auth();

	const mockTasks = [
		{
			id: "1",
			title: "Schedule demo call with Acme CTO",
			contact: "Alex Developer",
			company: "Acme Corp",
			dueDate: "Today, 4:00 PM",
			priority: "URGENT",
			status: "PENDING",
		},
		{
			id: "2",
			title: "Send revised proposal & contract draft",
			contact: "Sarah TechStart",
			company: "TechStart Inc",
			dueDate: "Tomorrow, 11:00 AM",
			priority: "HIGH",
			status: "PENDING",
		},
		{
			id: "3",
			title: "Follow up on untouched inbound inquiry",
			contact: "CloudScale Lead",
			company: "CloudScale HQ",
			dueDate: "Nov 05, 2026",
			priority: "MEDIUM",
			status: "COMPLETED",
		},
	];

	return (
		<DashboardLayout
			userEmail={session?.user?.email || "rep@devcrm.io"}
			userName={session?.user?.name || "Sales Rep"}
			userRole={session?.user?.systemRole || "USER"}
		>
			<div className="mx-auto flex max-w-[1600px] flex-col gap-6 pb-8">
				{/* Top Control Bar */}
				<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					<div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
						<div className="flex flex-col gap-1.5">
							<div className="flex items-center gap-2.5">
								<span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
									Workflow Productivity
								</span>
								<span className="text-muted-foreground text-xs">
									Automated Follow-up Engine
								</span>
							</div>
							<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Tasks &amp; Follow-up Reminders
							</h1>
							<p className="text-muted-foreground text-sm">
								Schedule client touchpoints, track deal SLAs, and automate sales reminders.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<Button className="gap-2 rounded-xl shadow-xs" size="sm">
								<Plus className="h-4 w-4" />
								<span>Schedule Task</span>
							</Button>
						</div>
					</div>
					<div className="pointer-events-none absolute -top-16 -right-16 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
				</section>

				{/* 2-Column Task Grid */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
					<div className="lg:col-span-8">
						<Card className="rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md">
							<CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
								<CardTitle className="font-bold text-foreground text-lg">
									Upcoming Tasks &amp; Reminders
								</CardTitle>
								<Badge variant="outline">3 Scheduled</Badge>
							</CardHeader>
							<CardContent className="pt-5">
								<div className="space-y-3">
									{mockTasks.map((t) => (
										<div
											className="group flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-background/60 p-4 transition-all hover:border-primary/40 hover:bg-card sm:flex-row sm:items-center"
											key={t.id}
										>
											<div className="flex items-start gap-3">
												<div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
													<Clock className="h-4 w-4" />
												</div>
												<div className="flex flex-col">
													<p className="font-semibold text-foreground text-sm transition-colors group-hover:text-primary">
														{t.title}
													</p>
													<p className="text-muted-foreground text-xs">
														{t.company} • {t.contact} • <span className="font-mono text-foreground/80">{t.dueDate}</span>
													</p>
												</div>
											</div>

											<div className="flex items-center gap-2">
												{t.priority === "URGENT" && (
													<Badge variant="destructive">URGENT</Badge>
												)}
												{t.priority === "HIGH" && (
													<Badge variant="warning">HIGH</Badge>
												)}
												{t.priority === "MEDIUM" && (
													<Badge variant="secondary">MEDIUM</Badge>
												)}
												<Button className="h-9" size="sm" variant="outline">
													<CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
													Complete
												</Button>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="lg:col-span-4">
						<Card className="rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md">
							<CardHeader className="border-b border-border/60 pb-4">
								<CardTitle className="font-bold text-foreground text-lg flex items-center gap-2">
									<Calendar className="h-4 w-4 text-primary" />
									Calendar Cadence
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-5">
								<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-accent/20 p-6 text-center">
									<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
										<Sparkles className="h-6 w-6" />
									</div>
									<h4 className="font-semibold text-foreground text-sm">
										Automated Touchpoint Sync
									</h4>
									<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
										All upcoming customer milestones sync directly with team calendar webhooks.
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
