"use client";

import {
	Activity,
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	Clock,
	Cloud,
	CreditCard,
	Database,
	Globe,
	HardDrive,
	Mail,
	Radio,
	RefreshCw,
	Send,
	Server,
	ShieldCheck,
	Webhook,
} from "lucide-react";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

export default function SuperAdminIntegrationsPage() {
	const utils = api.useUtils();
	const [testingService, setTestingService] = useState<string | null>(null);

	// Queries
	const {
		data: healthData,
		isLoading: isHealthLoading,
		refetch: refetchHealth,
		isRefetching,
	} = api.superadmin.getIntegrationsHealth.useQuery(undefined, {
		refetchInterval: 30000, // auto-refresh every 30s
	});

	const {
		data: storageStats,
		isLoading: isStorageLoading,
		refetch: refetchStorage,
	} = api.superadmin.getPlatformStorageStats.useQuery();

	const {
		data: svixApps,
		isLoading: isSvixLoading,
		refetch: refetchSvix,
	} = api.superadmin.getSvixApplications.useQuery();

	// Mutations
	const testDodo = api.superadmin.testDodoConnection.useMutation({
		onSuccess: (data) => {
			if (data.status === "OPERATIONAL") {
				toast.success(`Dodo Payments operational (${data.latencyMs}ms)`);
			} else {
				toast.error(`Dodo Payments: ${data.error || data.status}`);
			}
			utils.superadmin.getIntegrationsHealth.invalidate();
		},
		onError: (err) => toast.error(err.message),
	});

	const testSvix = api.superadmin.testSvixConnection.useMutation({
		onSuccess: (data) => {
			if (data.status === "OPERATIONAL") {
				toast.success(`Svix Webhooks connected (${data.latencyMs}ms)`);
			} else {
				toast.warning(`Svix Webhooks: ${data.error || data.status}`);
			}
			utils.superadmin.getIntegrationsHealth.invalidate();
		},
		onError: (err) => toast.error(err.message),
	});

	const testStorage = api.superadmin.testStorageConnection.useMutation({
		onSuccess: (data) => {
			if (data.status === "OPERATIONAL") {
				toast.success(`Neon Storage connected (${data.latencyMs}ms)`);
			} else {
				toast.error(`Storage test failed: ${data.error}`);
			}
			utils.superadmin.getIntegrationsHealth.invalidate();
		},
		onError: (err) => toast.error(err.message),
	});

	const testEmail = api.superadmin.testEmailConnection.useMutation({
		onSuccess: (data) => {
			toast.info(`Email service: ${data.details.provider} (${data.status})`);
			utils.superadmin.getIntegrationsHealth.invalidate();
		},
		onError: (err) => toast.error(err.message),
	});

	const dispatchWebhook = api.superadmin.dispatchSvixTestWebhook.useMutation({
		onSuccess: (res) => {
			if (res.mock) {
				toast.info(res.message);
			} else {
				toast.success(`Test webhook dispatched! Message ID: ${res.messageId}`);
			}
		},
		onError: (err) => toast.error(err.message),
	});

	const handleRefreshAll = async () => {
		await Promise.all([refetchHealth(), refetchStorage(), refetchSvix()]);
		toast.success("Integration diagnostics refreshed");
	};

	const getStatusBadge = (status?: string) => {
		switch (status) {
			case "OPERATIONAL":
				return (
					<Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/30 gap-1.5 font-medium">
						<CheckCircle2 className="h-3 w-3" /> Operational
					</Badge>
				);
			case "MOCK_ACTIVE":
				return (
					<Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-500/30 gap-1.5 font-medium">
						<Server className="h-3 w-3" /> Mock Active
					</Badge>
				);
			case "DEGRADED":
				return (
					<Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-500/30 gap-1.5 font-medium">
						<AlertTriangle className="h-3 w-3" /> Degraded
					</Badge>
				);
			case "NOT_CONFIGURED":
				return (
					<Badge className="bg-muted text-muted-foreground border-border gap-1.5 font-medium">
						<AlertCircle className="h-3 w-3" /> Not Configured
					</Badge>
				);
			case "ERROR":
			default:
				return (
					<Badge variant="destructive" className="gap-1.5 font-medium">
						<AlertCircle className="h-3 w-3" /> Error
					</Badge>
				);
		}
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
						Global Integration Center
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Monitor connectivity, latency, credentials, and health across
						critical infrastructure providers.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleRefreshAll}
						disabled={isHealthLoading || isRefetching}
						className="gap-2"
					>
						<RefreshCw
							className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
						/>
						Run All Diagnostics
					</Button>
				</div>
			</div>

			{/* Overall Health Banner */}
			{healthData && (
				<Card
					className={`border ${
						healthData.overallStatus === "OPERATIONAL"
							? "border-emerald-500/30 bg-emerald-500/5"
							: healthData.overallStatus === "DEGRADED"
								? "border-amber-500/30 bg-amber-500/5"
								: "border-red-500/30 bg-red-500/5"
					}`}
				>
					<CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<div
								className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
									healthData.overallStatus === "OPERATIONAL"
										? "bg-emerald-500/20 text-emerald-600"
										: healthData.overallStatus === "DEGRADED"
											? "bg-amber-500/20 text-amber-600"
											: "bg-red-500/20 text-red-600"
								}`}
							>
								<Activity className="h-5 w-5" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h3 className="font-semibold text-foreground text-base">
										Platform Health: {healthData.overallStatus}
									</h3>
									{getStatusBadge(healthData.overallStatus)}
								</div>
								<p className="text-xs text-muted-foreground mt-0.5">
									{healthData.summary.operational} of {healthData.summary.total}{" "}
									integrations healthy and responding to probes.
								</p>
							</div>
						</div>
						<div className="flex items-center gap-4 text-xs font-mono">
							<div className="text-right">
								<span className="text-muted-foreground">Auto-probe:</span>{" "}
								<span className="font-medium text-foreground">30s active</span>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Service Cards Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
				{/* 1. Dodo Payments */}
				<Card className="border border-border/70 hover:border-border transition-colors">
					<CardHeader className="pb-3 flex flex-row items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
								<CreditCard className="h-5 w-5" />
							</div>
							<div>
								<CardTitle className="text-base font-semibold">
									Dodo Payments
								</CardTitle>
								<CardDescription className="text-xs">
									Merchant of Record & Platform Billing
								</CardDescription>
							</div>
						</div>
						{getStatusBadge(
							healthData?.services.find((s) => s.id === "dodo")?.status,
						)}
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						{(() => {
							const dodo = healthData?.services.find((s) => s.id === "dodo");
							return (
								<>
									<div className="grid grid-cols-2 gap-2 text-xs">
										<div className="rounded-lg bg-muted/40 p-2.5">
											<span className="text-muted-foreground block text-[11px]">
												Environment
											</span>
											<span className="font-semibold font-mono text-foreground uppercase mt-0.5 block">
												{dodo?.details?.environment || "test_mode"}
											</span>
										</div>
										<div className="rounded-lg bg-muted/40 p-2.5">
											<span className="text-muted-foreground block text-[11px]">
												Latency
											</span>
											<span className="font-semibold font-mono text-foreground mt-0.5 flex items-center gap-1">
												<Clock className="h-3 w-3 text-muted-foreground" />
												{dodo?.latencyMs ? `${dodo.latencyMs} ms` : "—"}
											</span>
										</div>
										<div className="rounded-lg bg-muted/40 p-2.5">
											<span className="text-muted-foreground block text-[11px]">
												Webhook Secret
											</span>
											<span className="font-semibold text-foreground mt-0.5 block">
												{dodo?.details?.webhookConfigured
													? "Configured"
													: "Missing"}
											</span>
										</div>
										<div className="rounded-lg bg-muted/40 p-2.5">
											<span className="text-muted-foreground block text-[11px]">
												API Key
											</span>
											<span className="font-semibold text-foreground mt-0.5 block">
												{dodo?.details?.apiKeyConfigured !== false
													? "Active"
													: "Unset"}
											</span>
										</div>
									</div>

									{dodo?.error && (
										<div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
											{dodo.error}
										</div>
									)}

									<Button
										variant="outline"
										size="sm"
										className="w-full gap-2 text-xs"
										disabled={testDodo.isPending}
										onClick={() => testDodo.mutate()}
									>
										<RefreshCw
											className={`h-3.5 w-3.5 ${
												testDodo.isPending ? "animate-spin" : ""
											}`}
										/>
										Test Dodo API Probe
									</Button>
								</>
							);
						})()}
					</CardContent>
				</Card>

				{/* 2. Svix Webhooks */}
				<Card className="border border-border/70 hover:border-border transition-colors">
					<CardHeader className="pb-3 flex flex-row items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
								<Webhook className="h-5 w-5" />
							</div>
							<div>
								<CardTitle className="text-base font-semibold">
									Svix Webhooks
								</CardTitle>
								<CardDescription className="text-xs">
									Outbound Enterprise Event Delivery
								</CardDescription>
							</div>
						</div>
						{getStatusBadge(
							healthData?.services.find((s) => s.id === "svix")?.status,
						)}
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						{(() => {
							const svixHealth = healthData?.services.find(
								(s) => s.id === "svix",
							);
							return (
								<>
									<div className="grid grid-cols-2 gap-2 text-xs">
										<div className="rounded-lg bg-muted/40 p-2.5">
											<span className="text-muted-foreground block text-[11px]">
												Token Status
											</span>
											<span className="font-semibold text-foreground mt-0.5 block">
												{svixHealth?.details?.isProductionReady
													? "Production Key"
													: "Mock Dev Token"}
											</span>
										</div>
										<div className="rounded-lg bg-muted/40 p-2.5">
											<span className="text-muted-foreground block text-[11px]">
												Latency
											</span>
											<span className="font-semibold font-mono text-foreground mt-0.5 flex items-center gap-1">
												<Clock className="h-3 w-3 text-muted-foreground" />
												{svixHealth?.latencyMs
													? `${svixHealth.latencyMs} ms`
													: "—"}
											</span>
										</div>
									</div>

									{svixHealth?.error && (
										<div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-700 dark:text-amber-400">
											{svixHealth.error}
										</div>
									)}

									<Button
										variant="outline"
										size="sm"
										className="w-full gap-2 text-xs"
										disabled={testSvix.isPending}
										onClick={() => testSvix.mutate()}
									>
										<RefreshCw
											className={`h-3.5 w-3.5 ${
												testSvix.isPending ? "animate-spin" : ""
											}`}
										/>
										Test Svix Connection
									</Button>
								</>
							);
						})()}
					</CardContent>
				</Card>

				{/* 3. Neon Object Storage */}
				<Card className="border border-border/70 hover:border-border transition-colors">
					<CardHeader className="pb-3 flex flex-row items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
								<HardDrive className="h-5 w-5" />
							</div>
							<div>
								<CardTitle className="text-base font-semibold">
									Neon Object Storage
								</CardTitle>
								<CardDescription className="text-xs">
									S3-Compatible Document & Attachment Store
								</CardDescription>
							</div>
						</div>
						{getStatusBadge(
							healthData?.services.find((s) => s.id === "storage")?.status,
						)}
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						{(() => {
							const storage = healthData?.services.find(
								(s) => s.id === "storage",
							);
							return (
								<>
									<div className="grid grid-cols-2 gap-2 text-xs">
										<div className="rounded-lg bg-muted/40 p-2.5">
											<span className="text-muted-foreground block text-[11px]">
												Bucket Name
											</span>
											<span className="font-semibold font-mono text-foreground mt-0.5 block truncate">
												{storage?.details?.bucket || "—"}
											</span>
										</div>
										<div className="rounded-lg bg-muted/40 p-2.5">
											<span className="text-muted-foreground block text-[11px]">
												Latency
											</span>
											<span className="font-semibold font-mono text-foreground mt-0.5 flex items-center gap-1">
												<Clock className="h-3 w-3 text-muted-foreground" />
												{storage?.latencyMs ? `${storage.latencyMs} ms` : "—"}
											</span>
										</div>
										<div className="rounded-lg bg-muted/40 p-2.5 col-span-2">
											<span className="text-muted-foreground block text-[11px]">
												Endpoint URL
											</span>
											<span className="font-mono text-foreground text-[11px] mt-0.5 block truncate">
												{storage?.details?.endpoint || "—"}
											</span>
										</div>
									</div>

									{storage?.error && (
										<div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
											{storage.error}
										</div>
									)}

									<Button
										variant="outline"
										size="sm"
										className="w-full gap-2 text-xs"
										disabled={testStorage.isPending}
										onClick={() => testStorage.mutate()}
									>
										<RefreshCw
											className={`h-3.5 w-3.5 ${
												testStorage.isPending ? "animate-spin" : ""
											}`}
										/>
										Probe HeadBucket Connection
									</Button>
								</>
							);
						})()}
					</CardContent>
				</Card>

				{/* 4. Email Delivery */}
				<Card className="border border-border/70 hover:border-border transition-colors">
					<CardHeader className="pb-3 flex flex-row items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
								<Mail className="h-5 w-5" />
							</div>
							<div>
								<CardTitle className="text-base font-semibold">
									Email Delivery
								</CardTitle>
								<CardDescription className="text-xs">
									Transactional Alerts, Invoices & Quotes
								</CardDescription>
							</div>
						</div>
						{getStatusBadge(
							healthData?.services.find((s) => s.id === "email")?.status,
						)}
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						{(() => {
							const email = healthData?.services.find((s) => s.id === "email");
							return (
								<>
									<div className="grid grid-cols-2 gap-2 text-xs">
										<div className="rounded-lg bg-muted/40 p-2.5">
											<span className="text-muted-foreground block text-[11px]">
												Active Provider
											</span>
											<span className="font-semibold text-foreground mt-0.5 block">
												{email?.details?.provider || "Mock Dispatcher"}
											</span>
										</div>
										<div className="rounded-lg bg-muted/40 p-2.5">
											<span className="text-muted-foreground block text-[11px]">
												Latency
											</span>
											<span className="font-semibold font-mono text-foreground mt-0.5 flex items-center gap-1">
												<Clock className="h-3 w-3 text-muted-foreground" />
												{email?.latencyMs ? `${email.latencyMs} ms` : "1 ms"}
											</span>
										</div>
									</div>

									{email?.details?.note && (
										<p className="text-xs text-muted-foreground italic">
											{email.details.note}
										</p>
									)}

									<Button
										variant="outline"
										size="sm"
										className="w-full gap-2 text-xs"
										disabled={testEmail.isPending}
										onClick={() => testEmail.mutate()}
									>
										<RefreshCw
											className={`h-3.5 w-3.5 ${
												testEmail.isPending ? "animate-spin" : ""
											}`}
										/>
										Check Provider Status
									</Button>
								</>
							);
						})()}
					</CardContent>
				</Card>
			</div>

			{/* Operational Management Tabs */}
			<Tabs defaultValue="storage" className="space-y-4">
				<TabsList className="bg-muted/50 p-1">
					<TabsTrigger value="storage" className="text-xs gap-1.5">
						<HardDrive className="h-3.5 w-3.5" /> Platform Storage
					</TabsTrigger>
					<TabsTrigger value="webhooks" className="text-xs gap-1.5">
						<Webhook className="h-3.5 w-3.5" /> Svix Operations
					</TabsTrigger>
				</TabsList>

				{/* Storage Panel */}
				<TabsContent value="storage">
					<Card>
						<CardHeader>
							<CardTitle className="text-base font-semibold">
								Neon Storage Architecture & Tenant Consumption
							</CardTitle>
							<CardDescription className="text-xs">
								Platform-wide file bucket configuration and tenant isolation
								parameters.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{storageStats ? (
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<div className="rounded-xl border border-border/70 p-4 bg-card">
										<span className="text-xs text-muted-foreground">
											Total Tenant Workspaces
										</span>
										<div className="text-2xl font-bold mt-1 text-foreground">
											{storageStats.totalTenants}
										</div>
										<span className="text-[11px] text-muted-foreground mt-1 block">
											Enrolled organizations
										</span>
									</div>
									<div className="rounded-xl border border-border/70 p-4 bg-card">
										<span className="text-xs text-muted-foreground">
											Active Asset Uploaders
										</span>
										<div className="text-2xl font-bold mt-1 text-teal-600">
											{storageStats.tenantsWithUploadedAssets}
										</div>
										<span className="text-[11px] text-muted-foreground mt-1 block">
											Tenants with custom logos/files
										</span>
									</div>
									<div className="rounded-xl border border-border/70 p-4 bg-card">
										<span className="text-xs text-muted-foreground">
											Addressing Mode
										</span>
										<div className="text-2xl font-bold mt-1 text-foreground">
											Path-Style
										</div>
										<span className="text-[11px] text-muted-foreground mt-1 block">
											Compatible with Neon Storage
										</span>
									</div>
								</div>
							) : (
								<div className="text-center py-6 text-xs text-muted-foreground">
									Loading storage metrics...
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Svix Operations Panel */}
				<TabsContent value="webhooks">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle className="text-base font-semibold">
									Svix Webhook Gateway & Tenant Applications
								</CardTitle>
								<CardDescription className="text-xs">
									Dispatch diagnostic test events and inspect tenant webhook
									registrations.
								</CardDescription>
							</div>
							<Button
								size="sm"
								className="gap-2 text-xs"
								disabled={dispatchWebhook.isPending}
								onClick={() => dispatchWebhook.mutate({})}
							>
								<Send className="h-3.5 w-3.5" />
								Dispatch Test Webhook
							</Button>
						</CardHeader>
						<CardContent>
							{svixApps?.isMock ? (
								<div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300">
									Using local development mock token. Webhook dispatches are
									simulated without connecting to production Svix servers.
								</div>
							) : svixApps?.data && svixApps.data.length > 0 ? (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="text-xs">App ID</TableHead>
											<TableHead className="text-xs">Name</TableHead>
											<TableHead className="text-xs">UID</TableHead>
											<TableHead className="text-xs">Created At</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{svixApps.data.map((app: any) => (
											<TableRow key={app.id}>
												<TableCell className="font-mono text-xs">
													{app.id}
												</TableCell>
												<TableCell className="text-xs font-medium">
													{app.name}
												</TableCell>
												<TableCell className="font-mono text-xs text-muted-foreground">
													{app.uid || "—"}
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{new Date(app.createdAt).toLocaleDateString()}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							) : (
								<div className="text-center py-8 text-xs text-muted-foreground">
									No tenant applications currently registered in Svix.
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

