"use client";

import {
	Activity,
	AlertCircle,
	Calendar,
	Check,
	Clock,
	Copy,
	ExternalLink,
	Filter,
	RefreshCw,
	Search,
	Shield,
	Terminal,
	User,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export default function SuperAdminAuditPage() {
	const [selectedAction, setSelectedAction] = useState<string>("ALL");
	const [actorEmailSearch, setActorEmailSearch] = useState<string>("");
	const [targetIdSearch, setTargetIdSearch] = useState<string>("");
	const [selectedLogMetadata, setSelectedLogMetadata] = useState<any | null>(null);
	const [copied, setCopied] = useState<boolean>(false);

	const { data: actionsList } = api.superadmin.getAuditActions.useQuery();

	const {
		data: auditLogs,
		isLoading,
		refetch,
		isRefetching,
	} = api.superadmin.getAuditLogs.useQuery({
		action: selectedAction !== "ALL" ? selectedAction : undefined,
		actorEmail: actorEmailSearch.trim() || undefined,
		targetId: targetIdSearch.trim() || undefined,
		limit: 100,
	});

	const handleCopyMetadata = (text: string) => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		toast.success("Metadata copied to clipboard");
		setTimeout(() => setCopied(false), 2000);
	};

	const getActionBadgeVariant = (action: string) => {
		if (action.includes("IMPERSONATE")) return "default";
		if (action.includes("CREATE") || action.includes("ACTIVATE"))
			return "secondary";
		if (action.includes("DELETE") || action.includes("SUSPEND"))
			return "destructive";
		return "outline";
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						Platform Security & Activity Audit Trail
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Immutable record of all privileged administrative events, feature
						toggles, plan changes, and tenant impersonations.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isLoading || isRefetching}
						className="gap-2"
					>
						<RefreshCw
							className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
						/>
						Refresh Logs
					</Button>
				</div>
			</div>

			{/* Filter Controls Bar */}
			<Card className="border border-border/70">
				<CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
					<div className="w-full md:w-64">
						<Select
							value={selectedAction}
							onValueChange={(val) => setSelectedAction(val)}
						>
							<SelectTrigger className="text-xs h-9">
								<SelectValue placeholder="Filter by action..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ALL">All Actions</SelectItem>
								{actionsList?.map((act) => (
									<SelectItem key={act} value={act}>
										{act}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="relative w-full md:w-64">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search by actor email..."
							className="pl-8 text-xs h-9"
							value={actorEmailSearch}
							onChange={(e) => setActorEmailSearch(e.target.value)}
						/>
					</div>

					<div className="relative w-full md:w-64">
						<Input
							placeholder="Filter by target ID..."
							className="text-xs h-9 font-mono"
							value={targetIdSearch}
							onChange={(e) => setTargetIdSearch(e.target.value)}
						/>
					</div>

					{(selectedAction !== "ALL" ||
						actorEmailSearch ||
						targetIdSearch) && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setSelectedAction("ALL");
								setActorEmailSearch("");
								setTargetIdSearch("");
							}}
							className="text-xs h-9"
						>
							Clear Filters
						</Button>
					)}
				</CardContent>
			</Card>

			{/* Audit Log Table */}
			<Card className="border border-border/70">
				<CardHeader className="pb-3 flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-base font-semibold">
							Activity Timeline
						</CardTitle>
						<CardDescription className="text-xs">
							Showing {auditLogs?.length || 0} recent administrative events
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
							<RefreshCw className="h-5 w-5 animate-spin" />
							<span>Loading system audit log...</span>
						</div>
					) : !auditLogs || auditLogs.length === 0 ? (
						<div className="py-12 text-center text-xs text-muted-foreground">
							No audit records matching the specified filters.
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="text-xs">Timestamp</TableHead>
									<TableHead className="text-xs">Action</TableHead>
									<TableHead className="text-xs">Super Admin</TableHead>
									<TableHead className="text-xs">Target Entity</TableHead>
									<TableHead className="text-xs text-right">Details</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{auditLogs.map((log: any) => (
									<TableRow key={log.id}>
										<TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
											{new Date(log.createdAt).toLocaleString()}
										</TableCell>
										<TableCell>
											<Badge
												variant={getActionBadgeVariant(log.action)}
												className="font-mono text-[11px]"
											>
												{log.action}
											</Badge>
										</TableCell>
										<TableCell className="text-xs font-mono">
											{log.actorEmail}
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1.5 text-xs">
												{log.targetType && (
													<Badge
														variant="outline"
														className="text-[10px] uppercase font-mono tracking-tight"
													>
														{log.targetType}
													</Badge>
												)}
												{log.targetId ? (
													log.targetType === "ORGANIZATION" ? (
														<Link
															href={`/superadmin/tenants/${log.targetId}`}
															className="font-mono text-primary hover:underline flex items-center gap-1"
														>
															{log.targetId.slice(0, 12)}...
															<ExternalLink className="h-2.5 w-2.5" />
														</Link>
													) : (
														<span className="font-mono text-muted-foreground">
															{log.targetId.slice(0, 16)}
														</span>
													)
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</div>
										</TableCell>
										<TableCell className="text-right">
											{log.metadata ? (
												<Button
													variant="ghost"
													size="sm"
													className="h-7 text-xs text-primary"
													onClick={() => {
														try {
															setSelectedLogMetadata(JSON.parse(log.metadata));
														} catch {
															setSelectedLogMetadata(log.metadata);
														}
													}}
												>
													Inspect
												</Button>
											) : (
												<span className="text-xs text-muted-foreground">—</span>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Metadata JSON Modal */}
			<Dialog
				open={Boolean(selectedLogMetadata)}
				onOpenChange={(open) => !open && setSelectedLogMetadata(null)}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="text-base flex items-center justify-between pr-4">
							<span>Event Snapshot Metadata</span>
							<Button
								variant="outline"
								size="sm"
								className="h-7 gap-1.5 text-xs"
								onClick={() =>
									handleCopyMetadata(
										JSON.stringify(selectedLogMetadata, null, 2),
									)
								}
							>
								{copied ? (
									<>
										<Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
									</>
								) : (
									<>
										<Copy className="h-3.5 w-3.5" /> Copy JSON
									</>
								)}
							</Button>
						</DialogTitle>
						<DialogDescription className="text-xs">
							Immutable metadata parameters recorded at execution.
						</DialogDescription>
					</DialogHeader>
					<div className="rounded-xl bg-muted/60 p-4 font-mono text-xs overflow-x-auto max-h-[350px]">
						<pre>{JSON.stringify(selectedLogMetadata, null, 2)}</pre>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

