"use client";

import { Eye, Globe, Layers, PlayCircle, Settings2, ShieldBan, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export default function TenantsPage() {
	const router = useRouter();
	const utils = api.useUtils();
	const { data: orgs, isLoading } = api.superadmin.getOrganizations.useQuery();
	const { data: plans } = api.superadmin.getPlans.useQuery();

	const [selectedOrg, setSelectedOrg] = useState<any>(null);
	const [overrideModalOpen, setOverrideModalOpen] = useState(false);
	const [planModalOpen, setPlanModalOpen] = useState(false);
	const [selectedPlanId, setSelectedPlanId] = useState("");

	// Override state
	const [customDomainAllowed, setCustomDomainAllowed] = useState(false);
	const [webhooksAllowed, setWebhooksAllowed] = useState(false);
	const [maxContactsOverride, setMaxContactsOverride] = useState<number | "">("");

	const toggleStatus = api.superadmin.toggleOrganizationStatus.useMutation({
		onSuccess: () => {
			toast.success("Organization status updated");
			utils.superadmin.getOrganizations.invalidate();
		},
		onError: (err) => toast.error(err.message),
	});

	const deleteOrg = api.superadmin.deleteOrganization.useMutation({
		onSuccess: () => {
			toast.success("Organization deleted forever");
			utils.superadmin.getOrganizations.invalidate();
		},
		onError: (err) => toast.error(err.message),
	});

	const impersonate = api.superadmin.impersonateOrganization.useMutation({
		onSuccess: (res) => {
			toast.success(`Impersonating ${res.orgName}`);
			router.push("/dashboard");
		},
		onError: (err) => toast.error(err.message),
	});

	const assignPlan = api.superadmin.assignTenantPlan.useMutation({
		onSuccess: () => {
			toast.success("Plan assigned successfully");
			utils.superadmin.getOrganizations.invalidate();
			setPlanModalOpen(false);
		},
		onError: (err) => toast.error(err.message),
	});

	const upsertOverrides = api.superadmin.upsertTenantOverrides.useMutation({
		onSuccess: () => {
			toast.success("Overrides updated successfully");
			setOverrideModalOpen(false);
		},
		onError: (err) => toast.error(err.message),
	});

	const handleOpenOverrides = (org: any) => {
		setSelectedOrg(org);
		setCustomDomainAllowed(false);
		setWebhooksAllowed(false);
		setMaxContactsOverride("");
		setOverrideModalOpen(true);
	};

	const handleOpenPlanModal = (org: any) => {
		setSelectedOrg(org);
		setSelectedPlanId(org.planId || "");
		setPlanModalOpen(true);
	};

	const handleSaveOverrides = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedOrg) return;

		const featureOverrides: Record<string, boolean> = {
			hasCustomDomains: customDomainAllowed,
			hasWebhooks: webhooksAllowed,
		};

		const quotaOverrides: Record<string, number> = {};
		if (maxContactsOverride !== "") {
			quotaOverrides.maxContacts = Number(maxContactsOverride);
		}

		upsertOverrides.mutate({
			organizationId: selectedOrg.id,
			featureOverrides,
			quotaOverrides,
		});
	};

	return (
		<div className="space-y-8">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Tenant Control Plane</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Manage tenant workspaces, custom domain routing, plan assignments, and impersonation.
					</p>
				</div>
				<Button
					variant="outline"
					onClick={() => router.push("/superadmin/plans")}
					className="min-h-[44px] gap-2 font-medium"
				>
					<Layers className="h-4 w-4" />
					Manage Plans
				</Button>
			</div>

			<Card className="border-border/80 shadow-sm">
				<CardHeader>
					<CardTitle>Registered Workspaces</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Organization</TableHead>
									<TableHead>Subdomain & Domain</TableHead>
									<TableHead>Active Plan</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell className="py-6 text-center text-muted-foreground" colSpan={5}>
											Loading organizations...
										</TableCell>
									</TableRow>
								) : orgs?.length === 0 ? (
									<TableRow>
										<TableCell className="py-6 text-center text-muted-foreground" colSpan={5}>
											No organizations found.
										</TableCell>
									</TableRow>
								) : (
									orgs?.map((org) => {
										const currentPlan = plans?.find((p) => p.id === org.planId);
										return (
											<TableRow key={org.id}>
												<TableCell>
													<div className="flex flex-col">
														<span className="font-semibold text-foreground text-sm">{org.name}</span>
														<span className="text-muted-foreground text-xs">{org.displayName || org.id.slice(0, 8)}</span>
													</div>
												</TableCell>
												<TableCell>
													<div className="flex flex-col gap-1 text-xs">
														<code className="text-primary font-mono">{org.slug}.devfinity.net</code>
														{org.customDomain ? (
															<span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
																<Globe className="h-3 w-3" />
																{org.customDomain}
															</span>
														) : (
															<span className="text-muted-foreground/60 text-[11px]">No custom domain</span>
														)}
													</div>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Badge variant="outline" className="font-mono text-xs">
															{currentPlan?.name || "Starter Tier"}
														</Badge>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleOpenPlanModal(org)}
															className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
														>
															Change
														</Button>
													</div>
												</TableCell>
												<TableCell>
													<Badge variant={org.isActive ? "default" : "destructive"}>
														{org.isActive ? "Active" : "Suspended"}
													</Badge>
												</TableCell>
												<TableCell className="space-x-1.5 text-right whitespace-nowrap">
													<Button
														size="sm"
														variant="ghost"
														asChild
														className="min-h-[36px]"
													>
														<Link href={`/superadmin/tenants/${org.id}`}>
															<Eye className="mr-1 h-3.5 w-3.5" /> Inspect
														</Link>
													</Button>
													<Button
														size="sm"
														variant="outline"
														onClick={() => handleOpenOverrides(org)}
														className="min-h-[36px]"
													>
														<Settings2 className="mr-1 h-3.5 w-3.5" /> Overrides
													</Button>
													<Button
														disabled={impersonate.isPending}
														onClick={() => impersonate.mutate({ orgId: org.id })}
														size="sm"
														variant="default"
														className="min-h-[36px]"
													>
														<PlayCircle className="mr-1 h-3.5 w-3.5" /> Impersonate
													</Button>
													<Button
														disabled={toggleStatus.isPending}
														onClick={() =>
															toggleStatus.mutate({
																orgId: org.id,
																isActive: !org.isActive,
															})
														}
														size="sm"
														variant={org.isActive ? "secondary" : "default"}
														className="min-h-[36px]"
													>
														<ShieldBan className="mr-1 h-3.5 w-3.5" />{" "}
														{org.isActive ? "Suspend" : "Activate"}
													</Button>
													<Button
														disabled={deleteOrg.isPending}
														onClick={() => {
															if (
																confirm(
																	`Are you absolutely sure you want to delete ${org.name}? This cannot be undone.`,
																)
															) {
																deleteOrg.mutate({ orgId: org.id });
															}
														}}
														size="sm"
														variant="destructive"
														className="min-h-[36px]"
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Plan Assignment Dialog */}
			<Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Assign SaaS Plan</DialogTitle>
						<DialogDescription>
							Select a plan to assign to <strong>{selectedOrg?.name}</strong>.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 py-3">
						{plans?.map((plan) => (
							<label
								key={plan.id}
								className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
									selectedPlanId === plan.id
										? "border-primary bg-primary/5 ring-1 ring-primary/20"
										: "border-border/60 hover:bg-muted/40"
								}`}
							>
								<div className="flex items-center gap-3">
									<input
										type="radio"
										name="planSelect"
										value={plan.id}
										checked={selectedPlanId === plan.id}
										onChange={() => setSelectedPlanId(plan.id)}
										className="text-primary"
									/>
									<div>
										<p className="font-semibold text-sm">{plan.name}</p>
										<p className="text-xs text-muted-foreground">${plan.priceMonthly}/mo · {plan.maxContacts} contacts</p>
									</div>
								</div>
								<Badge variant="outline" className="font-mono text-xs uppercase">{plan.code}</Badge>
							</label>
						))}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setPlanModalOpen(false)}>Cancel</Button>
						<Button
							disabled={assignPlan.isPending || !selectedPlanId}
							onClick={() => {
								if (selectedOrg && selectedPlanId) {
									assignPlan.mutate({
										organizationId: selectedOrg.id,
										planId: selectedPlanId,
									});
								}
							}}
						>
							Assign Plan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Overrides Dialog */}
			<Dialog open={overrideModalOpen} onOpenChange={setOverrideModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Per-Tenant Overrides</DialogTitle>
						<DialogDescription>
							Grant exceptions or custom quotas for <strong>{selectedOrg?.name}</strong>.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSaveOverrides} className="space-y-4 py-2">
						<div className="space-y-3">
							<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feature Overrides</h4>
							<label className="flex items-center gap-2 text-sm cursor-pointer">
								<input
									type="checkbox"
									checked={customDomainAllowed}
									onChange={(e) => setCustomDomainAllowed(e.target.checked)}
									className="rounded border-border text-primary"
								/>
								<span>Force enable Custom Domains</span>
							</label>
							<label className="flex items-center gap-2 text-sm cursor-pointer">
								<input
									type="checkbox"
									checked={webhooksAllowed}
									onChange={(e) => setWebhooksAllowed(e.target.checked)}
									className="rounded border-border text-primary"
								/>
								<span>Force enable Outbound Webhooks</span>
							</label>
						</div>

						<div className="space-y-2 border-t border-border pt-4">
							<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quota Overrides</h4>
							<div className="space-y-1">
								<label className="text-xs font-medium">Custom Contact Limit</label>
								<Input
									type="number"
									placeholder="Leave blank for plan default"
									value={maxContactsOverride}
									onChange={(e) => setMaxContactsOverride(e.target.value === "" ? "" : Number(e.target.value))}
								/>
							</div>
						</div>

						<DialogFooter className="pt-3">
							<Button type="button" variant="outline" onClick={() => setOverrideModalOpen(false)}>
								Cancel
							</Button>
							<Button type="submit" disabled={upsertOverrides.isPending}>
								Save Overrides
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
