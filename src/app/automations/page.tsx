"use client";

import { format } from "date-fns";
import { Bell, Mail, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { CreateRuleDialog } from "~/components/automations/create-rule-dialog";
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
	const {
		data: rules,
		isLoading: rulesLoading,
		refetch,
	} = api.automations.getRules.useQuery();
	const { data: communications, isLoading: commsLoading } =
		api.automations.getCommunications.useQuery();

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

	return (
		<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
			<div className="flex items-center justify-between">
				<h2 className="font-bold text-3xl tracking-tight">Automations</h2>
				<CreateRuleDialog />
			</div>

			<Tabs defaultValue="rules">
				<TabsList>
					<TabsTrigger value="rules">Active Rules</TabsTrigger>
					<TabsTrigger value="communications">Communications Log</TabsTrigger>
				</TabsList>
				<TabsContent className="mt-4" value="rules">
					<Card>
						<CardHeader>
							<CardTitle>Automation Rules</CardTitle>
							<CardDescription>
								Configure background rules to follow up on invoices and quotes
								automatically.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Trigger</TableHead>
										<TableHead>Timing</TableHead>
										<TableHead>Action</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{rulesLoading ? (
										<TableRow>
											<TableCell className="text-center" colSpan={6}>
												Loading rules...
											</TableCell>
										</TableRow>
									) : rules?.length === 0 ? (
										<TableRow>
											<TableCell
												className="py-8 text-center text-muted-foreground"
												colSpan={6}
											>
												No automation rules configured.
											</TableCell>
										</TableRow>
									) : (
										rules?.map((rule) => (
											<TableRow key={rule.id}>
												<TableCell className="font-medium">
													{rule.name}
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{formatTrigger(rule.triggerType)}
													</Badge>
												</TableCell>
												<TableCell>
													{rule.daysOffset === 0
														? "Immediately"
														: rule.daysOffset < 0
															? `${Math.abs(rule.daysOffset)} days before`
															: `${rule.daysOffset} days after`}
												</TableCell>
												<TableCell>
													<div className="flex items-center">
														{rule.actionType === "SEND_EMAIL" ? (
															<Mail className="mr-2 h-4 w-4 text-muted-foreground" />
														) : (
															<Bell className="mr-2 h-4 w-4 text-muted-foreground" />
														)}
														{formatAction(rule.actionType)}
													</div>
												</TableCell>
												<TableCell>
													{rule.isActive ? (
														<Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
															Active
														</Badge>
													) : (
														<Badge variant="secondary">Paused</Badge>
													)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														onClick={() => handleDelete(rule.id)}
														size="icon"
														variant="ghost"
													>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent className="mt-4" value="communications">
					<Card>
						<CardHeader>
							<CardTitle>Dispatched Communications</CardTitle>
							<CardDescription>
								A log of all emails sent by the automation engine.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Date Sent</TableHead>
										<TableHead>Type</TableHead>
										<TableHead>Recipient (Company)</TableHead>
										<TableHead>Subject</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{commsLoading ? (
										<TableRow>
											<TableCell className="text-center" colSpan={4}>
												Loading communications...
											</TableCell>
										</TableRow>
									) : communications?.length === 0 ? (
										<TableRow>
											<TableCell
												className="py-8 text-center text-muted-foreground"
												colSpan={4}
											>
												No communications dispatched yet.
											</TableCell>
										</TableRow>
									) : (
										communications?.map((comm) => (
											<TableRow key={comm.id}>
												<TableCell className="whitespace-nowrap">
													{format(new Date(comm.sentAt), "MMM d, yyyy h:mm a")}
												</TableCell>
												<TableCell>
													<Badge variant="outline">{comm.type}</Badge>
												</TableCell>
												<TableCell>{comm.company?.name || "Unknown"}</TableCell>
												<TableCell className="font-medium">
													{comm.subject}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
