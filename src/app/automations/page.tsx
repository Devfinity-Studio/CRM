"use client";

import { format } from "date-fns";
import { Bell, Mail, Plus, Sparkles, Trash2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreateRuleDialog } from "~/components/automations/create-rule-dialog";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

export default function AutomationsPage() {
	const router = useRouter();
	const { data: layoutData, isLoading: layoutLoading } =
		api.dashboard.getLayoutData.useQuery();

	const isFeatureDisabled =
		!layoutLoading &&
		layoutData?.entitlements?.features?.hasAutomations === false;

	useEffect(() => {
		if (isFeatureDisabled) {
			toast.error(
				"The Automations module is currently disabled for your workspace.",
			);
			router.replace("/dashboard");
		}
	}, [isFeatureDisabled, router]);

	const {
		data: rules,
		isLoading: rulesLoading,
		refetch,
	} = api.automations.getRules.useQuery(undefined, {
		enabled: !isFeatureDisabled,
	});
	const { data: communications, isLoading: commsLoading } =
		api.automations.getCommunications.useQuery(undefined, {
			enabled: !isFeatureDisabled,
		});

	const deleteMutation = api.automations.deleteRule.useMutation({
		onSuccess: () => {
			toast.success("Rule deleted successfully.");
			refetch();
		},
		onError: (err) => toast.error(`Error: ${err.message}`),
	});

	const handleDelete = (id: string) => {
		if (confirm("Are you sure you want to delete this rule?")) {
			deleteMutation.mutate({ id });
		}
	};

	const formatTrigger = (type: string) => {
		switch (type) {
			case "INVOICE_DUE":
				return "Invoice Due";
			case "QUOTE_SENT":
				return "Quote Sent";
			case "SUBSCRIPTION_RENEWAL":
				return "Subscription Renewal";
			case "DEAL_STALLED":
				return "Deal Stalled";
			default:
				return type;
		}
	};

	const formatAction = (type: string) => {
		switch (type) {
			case "CREATE_NOTIFICATION":
				return "Notification";
			case "CREATE_TASK":
				return "Task";
			case "SEND_EMAIL":
				return "Send Email";
			case "INTERNAL_ALERT":
				return "Staff Alert";
			default:
				return type;
		}
	};

	if (isFeatureDisabled) {
		return null;
	}

	return (
		<DashboardLayout>
			<div className="mx-auto flex max-w-[1700px] flex-col gap-6 pb-12">
				{/* Header Section */}
				<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
									Workflow Automation
								</span>
								<span className="text-muted-foreground text-xs">
									Background Triggers & Actions
								</span>
							</div>
							<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Automations Engine
							</h1>
							<p className="text-muted-foreground text-xs sm:text-sm">
								Configure automated follow-ups, payment reminders, and renewal alert notifications.
							</p>
						</div>
						<div className="flex items-center gap-2">
							<CreateRuleDialog />
						</div>
					</div>
				</section>

				<Tabs className="w-full space-y-6" defaultValue="rules">
					<TabsList className="h-11 rounded-2xl bg-muted/60 p-1">
						<TabsTrigger className="rounded-xl px-4 text-xs font-semibold" value="rules">
							<Zap className="mr-2 h-4 w-4" />
							Active Rules ({rules?.length || 0})
						</TabsTrigger>
						<TabsTrigger className="rounded-xl px-4 text-xs font-semibold" value="communications">
							<Mail className="mr-2 h-4 w-4" />
							Communications Log ({communications?.length || 0})
						</TabsTrigger>
					</TabsList>

					<TabsContent className="space-y-6 mt-0" value="rules">
						<Card className="rounded-3xl border border-border/70 bg-card/75 shadow-sm backdrop-blur-md">
							<CardHeader className="p-4 sm:p-6 pb-2">
								<CardTitle className="text-lg font-bold">Automation Rules</CardTitle>
								<CardDescription className="text-xs">
									Scheduled triggers monitoring invoices, quotes, subscriptions, and stalled deals.
								</CardDescription>
							</CardHeader>
							<CardContent className="p-0 sm:p-6 sm:pt-0">
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow className="border-border/60">
												<TableHead className="text-xs font-semibold">Rule Name</TableHead>
												<TableHead className="text-xs font-semibold">Trigger</TableHead>
												<TableHead className="text-xs font-semibold">Timing</TableHead>
												<TableHead className="text-xs font-semibold">Action</TableHead>
												<TableHead className="text-xs font-semibold">Status</TableHead>
												<TableHead className="text-right text-xs font-semibold w-[80px]">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{rulesLoading ? (
												<TableRow>
													<TableCell className="h-28 text-center text-muted-foreground text-xs" colSpan={6}>
														Loading automation rules...
													</TableCell>
												</TableRow>
											) : rules?.length === 0 ? (
												<TableRow>
													<TableCell
														className="h-28 text-center text-muted-foreground text-xs"
														colSpan={6}
													>
														No automation rules configured yet. Click New Rule above to create one.
													</TableCell>
												</TableRow>
											) : (
												rules?.map((rule) => (
													<TableRow className="border-border/60 hover:bg-accent/40" key={rule.id}>
														<TableCell className="font-semibold text-foreground text-xs">
															{rule.name}
														</TableCell>
														<TableCell className="text-xs">
															<Badge variant="outline">
																{formatTrigger(rule.triggerType)}
															</Badge>
														</TableCell>
														<TableCell className="text-muted-foreground text-xs">
															{rule.daysOffset === 0
																? "Immediately"
																: rule.daysOffset < 0
																	? `${Math.abs(rule.daysOffset)} days before`
																	: `${rule.daysOffset} days after`}
														</TableCell>
														<TableCell className="text-xs">
															<div className="flex items-center gap-1.5 font-medium text-foreground">
																{rule.actionType === "SEND_EMAIL" ? (
																	<Mail className="h-4 w-4 text-sky-500" />
																) : (
																	<Bell className="h-4 w-4 text-primary" />
																)}
																{formatAction(rule.actionType)}
															</div>
														</TableCell>
														<TableCell className="text-xs">
															{rule.isActive ? (
																<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-500 text-xs">
																	<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm" />
																	Active
																</span>
															) : (
																<span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs">
																	<span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
																	Paused
																</span>
															)}
														</TableCell>
														<TableCell className="text-right">
															<Button
																className="h-9 w-9 rounded-lg text-destructive hover:text-destructive"
																onClick={() => handleDelete(rule.id)}
																size="icon"
																variant="ghost"
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent className="space-y-6 mt-0" value="communications">
						<Card className="rounded-3xl border border-border/70 bg-card/75 shadow-sm backdrop-blur-md">
							<CardHeader className="p-4 sm:p-6 pb-2">
								<CardTitle className="text-lg font-bold">Dispatched Communications</CardTitle>
								<CardDescription className="text-xs">
									Audit trail log of all outbound emails dispatched by automated background tasks.
								</CardDescription>
							</CardHeader>
							<CardContent className="p-0 sm:p-6 sm:pt-0">
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow className="border-border/60">
												<TableHead className="text-xs font-semibold">Date Sent</TableHead>
												<TableHead className="text-xs font-semibold">Type</TableHead>
												<TableHead className="text-xs font-semibold">Recipient (Company)</TableHead>
												<TableHead className="text-xs font-semibold">Subject</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{commsLoading ? (
												<TableRow>
													<TableCell className="h-28 text-center text-muted-foreground text-xs" colSpan={4}>
														Loading communications...
													</TableCell>
												</TableRow>
											) : communications?.length === 0 ? (
												<TableRow>
													<TableCell
														className="h-28 text-center text-muted-foreground text-xs"
														colSpan={4}
													>
														No communications dispatched yet.
													</TableCell>
												</TableRow>
											) : (
												communications?.map((comm) => (
													<TableRow className="border-border/60 hover:bg-accent/40" key={comm.id}>
														<TableCell className="whitespace-nowrap font-mono text-muted-foreground text-xs">
															{format(new Date(comm.sentAt), "MMM d, yyyy h:mm a")}
														</TableCell>
														<TableCell className="text-xs">
															<Badge variant="outline">{comm.type}</Badge>
														</TableCell>
														<TableCell className="font-semibold text-foreground text-xs">
															{comm.company?.name || "Direct Customer"}
														</TableCell>
														<TableCell className="font-medium text-foreground text-xs">
															{comm.subject}
														</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
}
