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
			dueDate: "Today, 4:00 PM",
			priority: "URGENT",
			status: "PENDING",
		},
		{
			id: "2",
			title: "Send revised proposal & invoice",
			contact: "Sarah TechStart",
			dueDate: "Tomorrow, 11:00 AM",
			priority: "HIGH",
			status: "PENDING",
		},
		{
			id: "3",
			title: "Follow up on untouched lead inquiry",
			contact: "CloudScale Lead",
			dueDate: "July 28, 2026",
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
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-2xl text-white tracking-tight">
							Tasks & Follow-up Reminders
						</h2>
						<p className="text-slate-400 text-sm">
							Schedule client call/email reminders, track deadlines, and view
							automated follow-up alerts.
						</p>
					</div>
					<Button>+ Schedule Task</Button>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					<div className="md:col-span-2">
						<Card>
							<CardHeader>
								<CardTitle>Upcoming Tasks & Reminders</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{mockTasks.map((t) => (
										<div
											className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-3 hover:border-slate-700"
											key={t.id}
										>
											<div>
												<p className="font-medium text-sm text-white">
													{t.title}
												</p>
												<p className="text-slate-400 text-xs">
													Contact: {t.contact} • Due: {t.dueDate}
												</p>
											</div>
											<div className="flex items-center gap-2">
												{t.priority === "URGENT" && (
													<Badge variant="destructive">URGENT</Badge>
												)}
												{t.priority === "HIGH" && (
													<Badge variant="default">HIGH</Badge>
												)}
												{t.priority === "MEDIUM" && (
													<Badge variant="secondary">MEDIUM</Badge>
												)}
												<Button size="sm" variant="ghost">
													Complete
												</Button>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					<div>
						<Card>
							<CardHeader>
								<CardTitle>Calendar Overview</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="rounded-lg border border-slate-800 border-dashed py-6 text-center text-slate-400 text-sm">
									Interactive Activity Calendar
									<div className="mt-1 text-slate-500 text-xs">
										July 2026 Overview
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
