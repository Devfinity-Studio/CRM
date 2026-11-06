"use client";

import {
	AlertTriangle,
	Building2,
	Check,
	CreditCard,
	FileText,
	Globe,
	Info,
	Key,
	Package,
	Radio,
	RefreshCw,
	Repeat,
	RotateCcw,
	Search,
	ShieldAlert,
	SlidersHorizontal,
	Sparkles,
	Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { FeatureKey } from "~/server/api/services/entitlements";
import { api } from "~/trpc/react";

interface FeatureMeta {
	key: FeatureKey;
	label: string;
	description: string;
	category: string;
	icon: React.ComponentType<{ className?: string }>;
}

const FEATURE_CATALOG: FeatureMeta[] = [
	{
		key: "hasInventory",
		label: "Inventory Management",
		description:
			"Catalog items, services, SKU tracking, pricing, and stock status.",
		category: "Commerce",
		icon: Package,
	},
	{
		key: "hasSubscriptions",
		label: "Client Subscriptions",
		description:
			"Recurring client billing schedules, contract retainers, and automated renewals.",
		category: "Commerce",
		icon: Repeat,
	},
	{
		key: "hasAutomations",
		label: "Workflow Automations",
		description:
			"Event-driven trigger rules, automated email alerts, and staff notifications.",
		category: "Productivity",
		icon: Zap,
	},
	{
		key: "hasQuotes",
		label: "Quotes & Proposals",
		description:
			"Proposal generation, customer estimate dispatches, and online approvals.",
		category: "Sales & Invoicing",
		icon: FileText,
	},
	{
		key: "hasInvoicing",
		label: "Invoices & Payments",
		description:
			"Commercial invoices, automated checkout links, and payment reconciliation.",
		category: "Sales & Invoicing",
		icon: CreditCard,
	},
	{
		key: "hasCustomDomains",
		label: "Custom Domains",
		description:
			"Custom tenant domain routing, branded subdomains, and SSL certificates.",
		category: "Infrastructure",
		icon: Globe,
	},
	{
		key: "hasWebhooks",
		label: "Outbound Webhooks",
		description:
			"Real-time event subscriptions, payload delivery logs, and retry queues.",
		category: "Developer",
		icon: Radio,
	},
	{
		key: "hasApiKeys",
		label: "API Access & Keys",
		description:
			"Tenant API tokens for programmatic CRUD operations and external integrations.",
		category: "Developer",
		icon: Key,
	},
	{
		key: "hasAiInsights",
		label: "AI Insights & Copilot",
		description:
			"Pipeline predictive analysis, customer sentiment scoring, and AI assistance.",
		category: "Intelligence",
		icon: Sparkles,
	},
];

export default function FeaturesManagementPage() {
	const utils = api.useUtils();
	const [activeTab, setActiveTab] = useState("global");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterHasOverridesOnly, setFilterHasOverridesOnly] = useState(false);
	const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
	const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

	// Queries
	const {
		data: globalFlags,
		isLoading: isGlobalLoading,
		refetch: refetchGlobal,
	} = api.superadmin.getGlobalFeatureFlags.useQuery();

	const {
		data: tenantMatrix,
		isLoading: isMatrixLoading,
		refetch: refetchMatrix,
	} = api.superadmin.getTenantFeatureMatrix.useQuery();

	// Mutations
	const updateGlobalMutation =
		api.superadmin.updateGlobalFeatureFlags.useMutation({
			onSuccess: () => {
				toast.success("Global feature flags successfully updated.");
				utils.superadmin.getGlobalFeatureFlags.invalidate();
				utils.superadmin.getTenantFeatureMatrix.invalidate();
				utils.dashboard.getLayoutData.invalidate();
			},
			onError: (err) => {
				toast.error(`Failed to update global flags: ${err.message}`);
			},
		});

	const setOverrideMutation =
		api.superadmin.setTenantFeatureOverride.useMutation({
			onSuccess: () => {
				toast.success("Tenant feature override updated.");
				utils.superadmin.getTenantFeatureMatrix.invalidate();
				utils.dashboard.getLayoutData.invalidate();
			},
			onError: (err) => {
				toast.error(`Failed to set override: ${err.message}`);
			},
		});

	// Handler for toggling single global feature
	const handleToggleGlobal = (key: FeatureKey, currentVal: boolean) => {
		const nextVal = !currentVal;
		updateGlobalMutation.mutate({
			featureFlags: {
				[key]: nextVal,
			},
		});
	};

	// Handler for tenant override toggle
	const handleSetOverride = (
		organizationId: string,
		featureKey: FeatureKey,
		overrideValue: boolean | null,
	) => {
		setOverrideMutation.mutate({
			organizationId,
			featureKey,
			overrideValue,
		});
	};

	// Filtered tenants for Matrix
	const filteredTenants = useMemo(() => {
		if (!tenantMatrix) return [];
		return tenantMatrix.filter((tenant) => {
			const matchesQuery =
				tenant.organizationName
					.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				tenant.organizationSlug
					.toLowerCase()
					.includes(searchQuery.toLowerCase()) ||
				tenant.planName.toLowerCase().includes(searchQuery.toLowerCase());

			if (!matchesQuery) return false;

			if (filterHasOverridesOnly) {
				return Object.keys(tenant.overrides || {}).length > 0;
			}

			return true;
		});
	}, [tenantMatrix, searchQuery, filterHasOverridesOnly]);

	// Live Impact Stats
	const impactStats = useMemo(() => {
		if (!tenantMatrix) return {} as Record<FeatureKey, { activeCount: number }>;
		const stats: Partial<Record<FeatureKey, { activeCount: number }>> = {};
		for (const feat of FEATURE_CATALOG) {
			const activeCount = tenantMatrix.filter(
				(t) => t.effectiveFeatures[feat.key] === true,
			).length;
			stats[feat.key] = { activeCount };
		}
		return stats as Record<FeatureKey, { activeCount: number }>;
	}, [tenantMatrix]);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<div className="flex items-center gap-2">
						<span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
							System Governance
						</span>
						<span className="text-muted-foreground text-xs font-mono">
							3-Tier Resolution
						</span>
					</div>
					<h1 className="mt-1 font-bold text-3xl tracking-tight text-foreground">
						Feature Flags &amp; Cascading Toggles
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Control global platform kill-switches, plan entitlements, and tenant
						VIP overrides.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						className="gap-2 rounded-xl text-xs"
						onClick={() => {
							refetchGlobal();
							refetchMatrix();
						}}
						size="sm"
						variant="outline"
					>
						<RefreshCw className="h-3.5 w-3.5" />
						<span>Refresh</span>
					</Button>
				</div>
			</div>

			{/* Main Tabs */}
			<Tabs className="space-y-6" onValueChange={setActiveTab} value={activeTab}>
				<TabsList className="bg-muted/70 p-1">
					<TabsTrigger className="gap-2 px-4 py-2" value="global">
						<SlidersHorizontal className="h-4 w-4" />
						<span>Global Feature Kill-Switches</span>
					</TabsTrigger>
					<TabsTrigger className="gap-2 px-4 py-2" value="overrides">
						<Building2 className="h-4 w-4" />
						<span>Tenant VIP Overrides</span>
						{tenantMatrix && (
							<Badge className="ml-1 px-1.5 py-0 text-[10px]" variant="secondary">
								{tenantMatrix.length}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				{/* TAB 1: GLOBAL KILL SWITCHES */}
				<TabsContent className="space-y-6" value="global">
					{/* Explanatory Banner */}
					<div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
						<AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
						<div className="text-xs sm:text-sm">
							<span className="font-semibold">Kill-Switch Precedence: </span>
							Disabling a feature here globally disables it for all standard tenants.
							However, explicit tenant VIP overrides (configured in the Overrides tab)
							will take highest precedence and remain active.
						</div>
					</div>

					{/* 9 Feature Cards Grid */}
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{FEATURE_CATALOG.map((feat) => {
							const Icon = feat.icon;
							const isEnabled = globalFlags ? globalFlags[feat.key] !== false : true;
							const activeTenants = impactStats[feat.key]?.activeCount ?? 0;
							const totalTenants = tenantMatrix?.length ?? 0;

							return (
								<Card
									className={`transition-all ${
										isEnabled
											? "border-border/80 bg-card/90"
											: "border-destructive/40 bg-destructive/5"
									}`}
									key={feat.key}
								>
									<CardHeader className="pb-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<div
													className={`flex h-9 w-9 items-center justify-center rounded-xl border p-1.5 shadow-2xs ${
														isEnabled
															? "border-primary/20 bg-primary/10 text-primary"
															: "border-destructive/30 bg-destructive/15 text-destructive"
													}`}
												>
													<Icon className="h-5 w-5" />
												</div>
												<Badge className="text-[10px]" variant="outline">
													{feat.category}
												</Badge>
											</div>
											<Switch
												checked={isEnabled}
												disabled={isGlobalLoading || updateGlobalMutation.isPending}
												onCheckedChange={() =>
													handleToggleGlobal(feat.key, isEnabled)
												}
											/>
										</div>
										<CardTitle className="mt-3 text-base font-semibold">
											{feat.label}
										</CardTitle>
										<CardDescription className="text-xs line-clamp-2">
											{feat.description}
										</CardDescription>
									</CardHeader>
									<CardContent className="pt-0 border-t border-border/40 mt-2">
										<div className="mt-3 flex items-center justify-between text-xs">
											<span className="text-muted-foreground">Status:</span>
											{isEnabled ? (
												<span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
													<Check className="h-3.5 w-3.5" /> Globally Enabled
												</span>
											) : (
												<span className="flex items-center gap-1 font-semibold text-destructive">
													<ShieldAlert className="h-3.5 w-3.5" /> Killed Globally
												</span>
											)}
										</div>
										<div className="mt-1.5 flex items-center justify-between text-xs">
											<span className="text-muted-foreground">Active Workspaces:</span>
											<span className="font-mono font-medium">
												{activeTenants} / {totalTenants}
											</span>
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</TabsContent>

				{/* TAB 2: TENANT VIP OVERRIDES */}
				<TabsContent className="space-y-6" value="overrides">
					{/* Search & Filter Bar */}
					<div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:flex-row sm:items-center">
						<div className="relative flex-1 max-w-md">
							<Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
							<Input
								className="pl-9"
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search organizations by name, slug, plan..."
								value={searchQuery}
							/>
						</div>
						<div className="flex items-center gap-3">
							<Button
								className="text-xs gap-1.5"
								onClick={() => setFilterHasOverridesOnly(!filterHasOverridesOnly)}
								size="sm"
								variant={filterHasOverridesOnly ? "default" : "outline"}
							>
								<span>VIP Overrides Only</span>
								{filterHasOverridesOnly && <Check className="h-3 w-3" />}
							</Button>
						</div>
					</div>

					{/* Matrix Table */}
					<Card>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Organization</TableHead>
									<TableHead>Subscription Tier</TableHead>
									<TableHead>Commerce</TableHead>
									<TableHead>Sales &amp; Invoices</TableHead>
									<TableHead>Developer / Infra</TableHead>
									<TableHead className="text-right">Manage</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isMatrixLoading ? (
									<TableRow>
										<TableCell
											className="h-32 text-center text-muted-foreground text-sm"
											colSpan={6}
										>
											Loading tenant feature matrix...
										</TableCell>
									</TableRow>
								) : filteredTenants.length === 0 ? (
									<TableRow>
										<TableCell
											className="h-32 text-center text-muted-foreground text-sm"
											colSpan={6}
										>
											No matching organizations found.
										</TableCell>
									</TableRow>
								) : (
									filteredTenants.map((t) => {
										const hasOverrides =
											Object.keys(t.overrides || {}).length > 0;

										return (
											<TableRow key={t.organizationId}>
												<TableCell>
													<div className="flex flex-col">
														<span className="font-semibold text-foreground text-sm">
															{t.organizationName}
														</span>
														<span className="font-mono text-muted-foreground text-xs">
															/{t.organizationSlug}
														</span>
													</div>
												</TableCell>
												<TableCell>
													<Badge
														className="text-xs font-medium"
														variant={
															t.planName.toLowerCase().includes("enterprise")
																? "default"
																: t.planName.toLowerCase().includes("pro")
																	? "secondary"
																	: "outline"
														}
													>
														{t.planName}
													</Badge>
												</TableCell>
												{/* Commerce features (Inventory, Subscriptions) */}
												<TableCell>
													<div className="flex items-center gap-1.5 flex-wrap">
														<Badge
															className="text-[10px]"
															variant={
																t.effectiveFeatures.hasInventory
																	? "success"
																	: "secondary"
															}
														>
															Inv: {t.effectiveFeatures.hasInventory ? "ON" : "OFF"}
														</Badge>
														<Badge
															className="text-[10px]"
															variant={
																t.effectiveFeatures.hasSubscriptions
																	? "success"
																	: "secondary"
															}
														>
															Sub:{" "}
															{t.effectiveFeatures.hasSubscriptions ? "ON" : "OFF"}
														</Badge>
													</div>
												</TableCell>
												{/* Sales features (Quotes, Invoicing, Automations) */}
												<TableCell>
													<div className="flex items-center gap-1.5 flex-wrap">
														<Badge
															className="text-[10px]"
															variant={
																t.effectiveFeatures.hasInvoicing
																	? "success"
																	: "secondary"
															}
														>
															Inv: {t.effectiveFeatures.hasInvoicing ? "ON" : "OFF"}
														</Badge>
														<Badge
															className="text-[10px]"
															variant={
																t.effectiveFeatures.hasAutomations
																	? "success"
																	: "secondary"
															}
														>
															Auto:{" "}
															{t.effectiveFeatures.hasAutomations ? "ON" : "OFF"}
														</Badge>
													</div>
												</TableCell>
												{/* Developer & Infra (CustomDomains, Webhooks, API, AI) */}
												<TableCell>
													<div className="flex items-center gap-1.5 flex-wrap">
														<Badge
															className="text-[10px]"
															variant={
																t.effectiveFeatures.hasAiInsights
																	? "success"
																	: "secondary"
															}
														>
															AI: {t.effectiveFeatures.hasAiInsights ? "ON" : "OFF"}
														</Badge>
														<Badge
															className="text-[10px]"
															variant={
																t.effectiveFeatures.hasWebhooks
																	? "success"
																	: "secondary"
															}
														>
															Hooks: {t.effectiveFeatures.hasWebhooks ? "ON" : "OFF"}
														</Badge>
													</div>
												</TableCell>
												{/* Actions */}
												<TableCell className="text-right">
													<Button
														className="text-xs rounded-xl"
														onClick={() => {
															setSelectedTenant(t);
															setIsOverrideModalOpen(true);
														}}
														size="sm"
														variant={hasOverrides ? "default" : "outline"}
													>
														{hasOverrides ? "VIP Overridden" : "Configure"}
													</Button>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</Card>
				</TabsContent>
			</Tabs>

			{/* DIALOG: Configure Tenant Overrides */}
			<Dialog
				onOpenChange={(open) => {
					setIsOverrideModalOpen(open);
					if (!open) setSelectedTenant(null);
				}}
				open={isOverrideModalOpen}
			>
				<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Building2 className="h-5 w-5 text-primary" />
							<span>Configure Feature Overrides</span>
						</DialogTitle>
						<DialogDescription>
							Fine-tune per-feature overrides for{" "}
							<span className="font-semibold text-foreground">
								{selectedTenant?.organizationName}
							</span>{" "}
							(Plan: {selectedTenant?.planName}). Custom overrides bypass plan
							defaults and global kill-switches.
						</DialogDescription>
					</DialogHeader>

					{selectedTenant && (
						<div className="space-y-4 py-3">
							<div className="space-y-2">
								{FEATURE_CATALOG.map((feat) => {
									const Icon = feat.icon;
									const planDefault =
										selectedTenant.planFeatures?.[feat.key] ?? false;
									const overrideVal =
										selectedTenant.overrides?.[feat.key];
									const effectiveVal =
										selectedTenant.effectiveFeatures?.[feat.key] ?? false;
									const isExplicitlyOverridden = overrideVal !== undefined;

									return (
										<div
											className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
												isExplicitlyOverridden
													? "border-primary/40 bg-primary/5"
													: "border-border/60 bg-card/50"
											}`}
											key={feat.key}
										>
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
													<Icon className="h-4 w-4" />
												</div>
												<div>
													<div className="flex items-center gap-2">
														<span className="font-medium text-sm text-foreground">
															{feat.label}
														</span>
														<Badge className="text-[10px]" variant="outline">
															Plan: {planDefault ? "ON" : "OFF"}
														</Badge>
														{isExplicitlyOverridden && (
															<Badge
																className="text-[10px]"
																variant={overrideVal ? "success" : "destructive"}
															>
																Override: {overrideVal ? "FORCED ON" : "FORCED OFF"}
															</Badge>
														)}
													</div>
													<p className="text-xs text-muted-foreground">
														Effective:{" "}
														<span
															className={
																effectiveVal
																	? "text-emerald-500 font-semibold"
																	: "text-muted-foreground font-semibold"
															}
														>
															{effectiveVal ? "Active" : "Disabled"}
														</span>
													</p>
												</div>
											</div>

											{/* 3-State Controls: Force ON, Force OFF, Reset to Plan Default */}
											<div className="flex items-center gap-1.5">
												<Button
													className={`h-7 px-2.5 text-xs rounded-lg ${
														overrideVal === true
															? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
															: "text-muted-foreground hover:text-foreground"
													}`}
													disabled={setOverrideMutation.isPending}
													onClick={() => {
														handleSetOverride(
															selectedTenant.organizationId,
															feat.key,
															true,
														);
														// update local state
														setSelectedTenant((prev: any) => ({
															...prev,
															overrides: {
																...prev.overrides,
																[feat.key]: true,
															},
															effectiveFeatures: {
																...prev.effectiveFeatures,
																[feat.key]: true,
															},
														}));
													}}
													size="sm"
													variant={overrideVal === true ? "default" : "outline"}
												>
													Force ON
												</Button>
												<Button
													className={`h-7 px-2.5 text-xs rounded-lg ${
														overrideVal === false
															? "bg-destructive text-destructive-foreground font-semibold"
															: "text-muted-foreground hover:text-foreground"
													}`}
													disabled={setOverrideMutation.isPending}
													onClick={() => {
														handleSetOverride(
															selectedTenant.organizationId,
															feat.key,
															false,
														);
														setSelectedTenant((prev: any) => ({
															...prev,
															overrides: {
																...prev.overrides,
																[feat.key]: false,
															},
															effectiveFeatures: {
																...prev.effectiveFeatures,
																[feat.key]: false,
															},
														}));
													}}
													size="sm"
													variant={overrideVal === false ? "destructive" : "outline"}
												>
													Force OFF
												</Button>
												{isExplicitlyOverridden && (
													<Button
														className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
														disabled={setOverrideMutation.isPending}
														onClick={() => {
															handleSetOverride(
																selectedTenant.organizationId,
																feat.key,
																null,
															);
															setSelectedTenant((prev: any) => {
																const nextOverrides = { ...prev.overrides };
																delete nextOverrides[feat.key];
																return {
																	...prev,
																	overrides: nextOverrides,
																	effectiveFeatures: {
																		...prev.effectiveFeatures,
																		[feat.key]: planDefault,
																	},
																};
															});
														}}
														size="sm"
														title="Reset to Plan Default"
														variant="ghost"
													>
														<RotateCcw className="h-3.5 w-3.5" />
													</Button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}

					<DialogFooter>
						<Button
							className="rounded-xl"
							onClick={() => setIsOverrideModalOpen(false)}
							variant="outline"
						>
							Done
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

