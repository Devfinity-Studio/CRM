"use client";

import {
	Activity,
	AlertCircle,
	AlertTriangle,
	ArrowLeft,
	BadgeCheck,
	Ban,
	Building2,
	Check,
	CheckCircle2,
	Clock,
	CreditCard,
	DollarSign,
	FileText,
	Key,
	LogIn,
	Package,
	Radio,
	RefreshCw,
	Shield,
	ShieldAlert,
	Sliders,
	TrendingUp,
	User,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

export default function TenantDeepInspectorPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const orgId = params.id;
	const [selectedLogMetadata, setSelectedLogMetadata] = useState<any | null>(null);

	const utils = api.useUtils();

	const {
		data: tenantData,
		isLoading,
		refetch,
		isRefetching,
	} = api.superadmin.getTenantDeepInspection.useQuery(
		{ orgId },
		{ enabled: Boolean(orgId) },
	);

	const impersonate = api.superadmin.impersonateOrganization.useMutation({
		onSuccess: (res) => {
			toast.success(`Now impersonating ${res.orgName}`);
			router.push("/dashboard");
		},
		onError: (err) => toast.error(err.message),
	});

	const toggleStatus = api.superadmin.toggleTenantStatus.useMutation({
		onSuccess: (updated) => {
			toast.success(
				`Tenant ${updated.name} is now ${updated.isActive ? "active" : "suspended"}`,
			);
			utils.superadmin.getTenantDeepInspection.invalidate({ orgId });
		},
		onError: (err) => toast.error(err.message),
	});

	if (isLoading) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
					<RefreshCw className="h-6 w-6 animate-spin" />
					<span>Loading tenant deep inspection data...</span>
				</div>
			</div>
		);
	}

	if (!tenantData) {
		return (
			<div className="space-y-4">
				<Button variant="ghost" size="sm" asChild className="gap-2">
					<Link href="/superadmin/tenants">
						<ArrowLeft className="h-4 w-4" /> Back to Tenants
					</Link>
				</Button>
				<Card>
					<CardContent className="p-12 text-center text-muted-foreground">
						<AlertCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
						<p>Tenant organization not found or accessible.</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const org = tenantData.organization;
	const metrics = tenantData.metrics;

	return (
		<div className="space-y-8">
			{/* Breadcrumb & Navigation */}
			<div className="flex items-center justify-between">
				<Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
					<Link href="/superadmin/tenants">
						<ArrowLeft className="h-4 w-4" /> Back to Tenants Directory
					</Link>
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => refetch()}
					disabled={isRefetching}
					className="gap-1.5"
				>
					<RefreshCw
						className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`}
					/>
					Refresh Data
				</Button>
			</div>

			{/* Tenant Overview Header */}
			<div className="flex flex-col gap-6 rounded-2xl border border-border/70 bg-card p-6 md:flex-row md:items-center md:justify-between shadow-sm">
				<div className="flex items-center gap-4">
					<div className="h-16 w-16 rounded-2xl border border-border/80 flex items-center justify-center font-bold text-xl bg-primary/10 text-primary overflow-hidden shrink-0">
						{org.logoUrl ? (
							<img src={org.logoUrl} alt={org.name} className="h-full w-full object-cover" />
						) : (
							org.name.slice(0, 2).toUpperCase()
						)}
					</div>
					<div>
						<div className="flex items-center gap-2.5">
							<h1 className="text-2xl font-bold tracking-tight text-foreground">
								{org.name}
							</h1>
							<Badge
								variant={org.isActive ? "default" : "destructive"}
								className="text-xs font-semibold"
							>
								{org.isActive ? "Active" : "Suspended"}
							</Badge>
						</div>
						<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
							<span className="font-mono">slug: {org.slug}</span>
							<span>•</span>
							<span className="font-mono">id: {org.id}</span>
							<span>•</span>
							<span>
								Created: {new Date(org.createdAt).toLocaleDateString()}
							</span>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2.5">
					<Button
						variant="outline"
						size="sm"
						onClick={() => impersonate.mutate({ orgId: org.id })}
						disabled={impersonate.isPending}
						className="gap-2"
					>
						<LogIn className="h-4 w-4" />
						Impersonate Tenant
					</Button>

					<Button
						variant={org.isActive ? "destructive" : "default"}
						size="sm"
						onClick={() =>
							toggleStatus.mutate({ orgId: org.id, isActive: !org.isActive })
						}
						disabled={toggleStatus.isPending}
						className="gap-2"
					>
						{org.isActive ? (
							<>
								<Ban className="h-4 w-4" /> Suspend Tenant
							</>
						) : (
							<>
								<Check className="h-4 w-4" /> Activate Tenant
							</>
						)}
					</Button>
				</div>
			</div>

			{/* High-Level Commercial & Activity Metrics */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="border border-border/70">
					<CardContent className="p-5 flex items-center gap-4">
						<div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
							<DollarSign className="h-5 w-5" />
						</div>
						<div>
							<span className="text-xs text-muted-foreground block font-medium">
								Total Revenue Paid
							</span>
							<div className="text-2xl font-bold text-foreground mt-0.5">
								${(metrics.invoices.totalPaidCents / 100).toLocaleString(
									undefined,
									{ minimumFractionDigits: 2 },
								)}
							</div>
							<span className="text-[11px] text-muted-foreground">
								{metrics.invoices.paidCount} paid invoices
							</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border border-border/70">
					<CardContent className="p-5 flex items-center gap-4">
						<div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
							<TrendingUp className="h-5 w-5" />
						</div>
						<div>
							<span className="text-xs text-muted-foreground block font-medium">
								Open Deals Pipeline
							</span>
							<div className="text-2xl font-bold text-foreground mt-0.5">
								${(metrics.deals.openPipelineCents / 100).toLocaleString(
									undefined,
									{ minimumFractionDigits: 2 },
								)}
							</div>
							<span className="text-[11px] text-muted-foreground">
								{metrics.deals.openCount} open deals
							</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border border-border/70">
					<CardContent className="p-5 flex items-center gap-4">
						<div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
							<FileText className="h-5 w-5" />
						</div>
						<div>
							<span className="text-xs text-muted-foreground block font-medium">
								Invoicing Volume
							</span>
							<div className="text-2xl font-bold text-foreground mt-0.5">
								{metrics.invoices.total}
							</div>
							<span className="text-[11px] text-muted-foreground">
								${(metrics.invoices.totalInvoicedCents / 100).toLocaleString()}{" "}
								invoiced
							</span>
						</div>
					</CardContent>
				</Card>

				<Card className="border border-border/70">
					<CardContent className="p-5 flex items-center gap-4">
						<div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
							<Users className="h-5 w-5" />
						</div>
						<div>
							<span className="text-xs text-muted-foreground block font-medium">
								Team Roster
							</span>
							<div className="text-2xl font-bold text-foreground mt-0.5">
								{metrics.totalMembers}
							</div>
							<span className="text-[11px] text-muted-foreground">
								Plan: {tenantData.entitlements.planName}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Deep Inspection Tabs */}
			<Tabs defaultValue="members" className="space-y-4">
				<TabsList className="bg-muted/50 p-1">
					<TabsTrigger value="members" className="text-xs gap-1.5">
						<Users className="h-3.5 w-3.5" /> Members ({tenantData.members.length})
					</TabsTrigger>
					<TabsTrigger value="commercials" className="text-xs gap-1.5">
						<DollarSign className="h-3.5 w-3.5" /> Commercials & Pipelines
					</TabsTrigger>
					<TabsTrigger value="entitlements" className="text-xs gap-1.5">
						<Shield className="h-3.5 w-3.5" /> Features & Quotas
					</TabsTrigger>
					<TabsTrigger value="audit" className="text-xs gap-1.5">
						<Clock className="h-3.5 w-3.5" /> Tenant Audit Trail (
						{tenantData.recentAuditLogs.length})
					</TabsTrigger>
				</TabsList>

				{/* 1. Members Roster */}
				<TabsContent value="members">
					<Card>
						<CardHeader>
							<CardTitle className="text-base font-semibold">
								Team Members & Access Roles
							</CardTitle>
							<CardDescription className="text-xs">
								All registered users with active organization membership.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="text-xs">User</TableHead>
										<TableHead className="text-xs">Role</TableHead>
										<TableHead className="text-xs">System Role</TableHead>
										<TableHead className="text-xs">Joined At</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{tenantData.members.map((m) => (
										<TableRow key={m.id}>
											<TableCell className="flex items-center gap-3">
												<div className="h-8 w-8 rounded-full border border-border/80 flex items-center justify-center text-xs font-semibold bg-primary/10 text-primary overflow-hidden shrink-0">
													{m.user.image ? (
														<img src={m.user.image} alt={m.user.name || "User"} className="h-full w-full object-cover" />
													) : (
														m.user.name?.slice(0, 2).toUpperCase() || "U"
													)}
												</div>
												<div>
													<span className="font-medium text-xs text-foreground block">
														{m.user.name || "Unnamed User"}
													</span>
													<span className="text-[11px] text-muted-foreground block font-mono">
														{m.user.email}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={m.role === "OWNER" ? "default" : "secondary"}
													className="text-[11px]"
												>
													{m.role}
												</Badge>
											</TableCell>
											<TableCell className="font-mono text-xs text-muted-foreground">
												{m.user.systemRole}
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{new Date(m.joinedAt).toLocaleDateString()}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* 2. Commercials & Pipelines */}
				<TabsContent value="commercials">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-base font-semibold">
									Deal Pipeline Summary
								</CardTitle>
								<CardDescription className="text-xs">
									Sales pipeline activity and closed deals.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex justify-between items-center py-2 border-b border-border/50 text-xs">
									<span className="text-muted-foreground">Total Deals</span>
									<span className="font-semibold text-foreground">
										{metrics.deals.total}
									</span>
								</div>
								<div className="flex justify-between items-center py-2 border-b border-border/50 text-xs">
									<span className="text-muted-foreground">Won Deals</span>
									<span className="font-semibold text-emerald-600">
										{metrics.deals.wonCount}
									</span>
								</div>
								<div className="flex justify-between items-center py-2 border-b border-border/50 text-xs">
									<span className="text-muted-foreground">Won Deal Value</span>
									<span className="font-semibold text-foreground font-mono">
										${(metrics.deals.wonRevenueCents / 100).toLocaleString()}
									</span>
								</div>
								<div className="flex justify-between items-center py-2 text-xs">
									<span className="text-muted-foreground">
										Open Pipeline Potential
									</span>
									<span className="font-semibold text-foreground font-mono">
										${(metrics.deals.openPipelineCents / 100).toLocaleString()}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-base font-semibold">
									Invoicing & Financial Status
								</CardTitle>
								<CardDescription className="text-xs">
									Invoices, collections, and overdue receivables.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex justify-between items-center py-2 border-b border-border/50 text-xs">
									<span className="text-muted-foreground">Total Invoices</span>
									<span className="font-semibold text-foreground">
										{metrics.invoices.total}
									</span>
								</div>
								<div className="flex justify-between items-center py-2 border-b border-border/50 text-xs">
									<span className="text-muted-foreground">
										Paid Invoices Count
									</span>
									<span className="font-semibold text-emerald-600">
										{metrics.invoices.paidCount}
									</span>
								</div>
								<div className="flex justify-between items-center py-2 border-b border-border/50 text-xs">
									<span className="text-muted-foreground">Overdue Invoices</span>
									<span className="font-semibold text-destructive">
										{metrics.invoices.overdueCount}
									</span>
								</div>
								<div className="flex justify-between items-center py-2 text-xs">
									<span className="text-muted-foreground">
										Collected Revenue
									</span>
									<span className="font-semibold text-foreground font-mono">
										${(metrics.invoices.totalPaidCents / 100).toLocaleString()}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* 3. Features & Quotas */}
				<TabsContent value="entitlements">
					<Card>
						<CardHeader>
							<CardTitle className="text-base font-semibold">
								Effective Feature Toggles & Custom Quotas
							</CardTitle>
							<CardDescription className="text-xs">
								Hierarchical resolution for plan entitlements and tenant
								overrides.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div>
								<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
									Module Access
								</h4>
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
									{Object.entries(tenantData.entitlements.features).map(
										([key, enabled]) => (
											<div
												key={key}
												className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card text-xs"
											>
												<span className="font-medium text-foreground">
													{key}
												</span>
												<Badge
													variant={enabled ? "default" : "secondary"}
													className="text-[10px]"
												>
													{enabled ? "Enabled" : "Disabled"}
												</Badge>
											</div>
										),
									)}
								</div>
							</div>

							<div>
								<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
									Allocated Quotas
								</h4>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
									{Object.entries(tenantData.entitlements.quotas).map(
										([quotaKey, val]) => (
											<div
												key={quotaKey}
												className="p-3 rounded-xl border border-border/70 bg-card"
											>
												<span className="text-muted-foreground block text-[11px]">
													{quotaKey}
												</span>
												<span className="text-lg font-bold text-foreground mt-0.5 block">
													{val.toLocaleString()}
												</span>
											</div>
										),
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* 4. Audit Trail */}
				<TabsContent value="audit">
					<Card>
						<CardHeader>
							<CardTitle className="text-base font-semibold">
								Administrative Audit History
							</CardTitle>
							<CardDescription className="text-xs">
								Super Admin actions specifically targeting {org.name}.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{tenantData.recentAuditLogs.length === 0 ? (
								<div className="py-8 text-center text-xs text-muted-foreground">
									No administrative actions recorded for this tenant yet.
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="text-xs">Timestamp</TableHead>
											<TableHead className="text-xs">Action</TableHead>
											<TableHead className="text-xs">Actor</TableHead>
											<TableHead className="text-xs">Metadata</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{tenantData.recentAuditLogs.map((log: any) => (
											<TableRow key={log.id}>
												<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
													{new Date(log.createdAt).toLocaleString()}
												</TableCell>
												<TableCell>
													<Badge variant="outline" className="text-[11px] font-mono">
														{log.action}
													</Badge>
												</TableCell>
												<TableCell className="text-xs font-mono">
													{log.actorEmail}
												</TableCell>
												<TableCell>
													{log.metadata ? (
														<Button
															variant="ghost"
															size="sm"
															className="h-7 text-xs text-primary"
															onClick={() => {
																try {
																	setSelectedLogMetadata(
																		JSON.parse(log.metadata),
																	);
																} catch {
																	setSelectedLogMetadata(log.metadata);
																}
															}}
														>
															View Details
														</Button>
													) : (
														<span className="text-xs text-muted-foreground">
															—
														</span>
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Metadata Modal */}
			<Dialog
				open={Boolean(selectedLogMetadata)}
				onOpenChange={(open) => !open && setSelectedLogMetadata(null)}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="text-base">
							Audit Event Metadata
						</DialogTitle>
						<DialogDescription className="text-xs">
							Detailed snapshot recorded at the time of administrative action.
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
