"use client";

import { Check, Edit, Layers, Plus, Shield, Sparkles, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
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
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

export default function PlansPage() {
	const utils = api.useUtils();
	const { data: plans, isLoading } = api.superadmin.getPlans.useQuery();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingPlan, setEditingPlan] = useState<any>(null);

	// Form states
	const [name, setName] = useState("");
	const [code, setCode] = useState("");
	const [description, setDescription] = useState("");
	const [priceMonthly, setPriceMonthly] = useState(29);
	const [priceYearly, setPriceYearly] = useState(290);
	const [maxUsers, setMaxUsers] = useState(5);
	const [maxContacts, setMaxContacts] = useState(1000);
	const [maxInvoices, setMaxInvoices] = useState(100);
	const [maxAutomations, setMaxAutomations] = useState(500);
	const [maxStorageMb, setMaxStorageMb] = useState(1024);

	// Features
	const [hasInventory, setHasInventory] = useState(true);
	const [hasSubscriptions, setHasSubscriptions] = useState(true);
	const [hasAutomations, setHasAutomations] = useState(true);
	const [hasCustomDomains, setHasCustomDomains] = useState(false);
	const [hasWebhooks, setHasWebhooks] = useState(false);
	const [hasApiKeys, setHasApiKeys] = useState(true);

	const createMutation = api.superadmin.createPlan.useMutation({
		onSuccess: () => {
			toast.success("Plan created successfully");
			utils.superadmin.getPlans.invalidate();
			setDialogOpen(false);
			resetForm();
		},
		onError: (err) => toast.error(err.message),
	});

	const updateMutation = api.superadmin.updatePlan.useMutation({
		onSuccess: () => {
			toast.success("Plan updated successfully");
			utils.superadmin.getPlans.invalidate();
			setDialogOpen(false);
			resetForm();
		},
		onError: (err) => toast.error(err.message),
	});

	const resetForm = () => {
		setEditingPlan(null);
		setName("");
		setCode("");
		setDescription("");
		setPriceMonthly(29);
		setPriceYearly(290);
		setMaxUsers(5);
		setMaxContacts(1000);
		setMaxInvoices(100);
		setMaxAutomations(500);
		setMaxStorageMb(1024);
		setHasInventory(true);
		setHasSubscriptions(true);
		setHasAutomations(true);
		setHasCustomDomains(false);
		setHasWebhooks(false);
		setHasApiKeys(true);
	};

	const handleEdit = (plan: any) => {
		setEditingPlan(plan);
		setName(plan.name);
		setCode(plan.code);
		setDescription(plan.description || "");
		setPriceMonthly(plan.priceMonthly);
		setPriceYearly(plan.priceYearly);
		setMaxUsers(plan.maxUsers);
		setMaxContacts(plan.maxContacts);
		setMaxInvoices(plan.maxInvoicesPerMonth || 100);
		setMaxAutomations(plan.maxAutomationsPerMonth || 500);
		setMaxStorageMb(plan.maxStorageMb || 1024);
		setHasInventory(plan.hasInventory ?? true);
		setHasSubscriptions(plan.hasSubscriptions ?? true);
		setHasAutomations(plan.hasAutomations ?? true);
		setHasCustomDomains(plan.hasCustomDomains ?? false);
		setHasWebhooks(plan.hasWebhooks ?? false);
		setHasApiKeys(plan.hasApiKeys ?? true);
		setDialogOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (editingPlan) {
			updateMutation.mutate({
				id: editingPlan.id,
				name,
				description,
				priceMonthly,
				priceYearly,
				maxUsers,
				maxContacts,
				maxInvoicesPerMonth: maxInvoices,
				maxAutomationsPerMonth: maxAutomations,
				maxStorageMb,
				hasInventory,
				hasSubscriptions,
				hasAutomations,
				hasCustomDomains,
				hasWebhooks,
				hasApiKeys,
			});
		} else {
			createMutation.mutate({
				name,
				code,
				description,
				priceMonthly,
				priceYearly,
				maxUsers,
				maxContacts,
				maxInvoicesPerMonth: maxInvoices,
				maxAutomationsPerMonth: maxAutomations,
				maxStorageMb,
				hasInventory,
				hasSubscriptions,
				hasAutomations,
				hasCustomDomains,
				hasWebhooks,
				hasApiKeys,
			});
		}
	};

	return (
		<div className="space-y-8">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">SaaS Plan Builder</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Create and manage subscription tiers, pricing, quotas, and feature entitlements.
					</p>
				</div>
				<Button
					onClick={() => {
						resetForm();
						setDialogOpen(true);
					}}
					className="min-h-[44px] gap-2 font-medium"
				>
					<Plus className="h-4 w-4" />
					Create New Plan
				</Button>
			</div>

			{/* Plans Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
				{isLoading ? (
					<p className="text-muted-foreground text-sm">Loading plans...</p>
				) : plans && plans.length > 0 ? (
					plans.map((plan) => (
						<Card key={plan.id} className="relative flex flex-col justify-between border-border/80 shadow-sm">
							<CardHeader>
								<div className="flex items-center justify-between">
									<Badge variant="outline" className="font-mono text-xs uppercase">
										{plan.code}
									</Badge>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleEdit(plan)}
										className="h-8 w-8 p-0"
									>
										<Edit className="h-4 w-4" />
									</Button>
								</div>
								<CardTitle className="text-xl mt-2">{plan.name}</CardTitle>
								<CardDescription>{plan.description || "No description provided."}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-baseline gap-1">
									<span className="font-extrabold text-3xl">${plan.priceMonthly}</span>
									<span className="text-muted-foreground text-sm">/ month</span>
									<span className="text-muted-foreground text-xs ml-2">(${plan.priceYearly}/yr)</span>
								</div>

								{/* Quotas */}
								<div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Team Seats:</span>
										<span className="font-semibold">{plan.maxUsers}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Max Contacts:</span>
										<span className="font-semibold">{plan.maxContacts.toLocaleString()}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Monthly Invoices:</span>
										<span className="font-semibold">{plan.maxInvoicesPerMonth || 100}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Monthly Automations:</span>
										<span className="font-semibold">{plan.maxAutomationsPerMonth || 500}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">Storage:</span>
										<span className="font-semibold">{(plan.maxStorageMb || 1024) / 1024} GB</span>
									</div>
								</div>

								{/* Feature Checklist */}
								<div className="space-y-1.5 text-xs">
									<div className="flex items-center gap-2">
										{plan.hasInventory ? (
											<Check className="h-4 w-4 text-emerald-500" />
										) : (
											<X className="h-4 w-4 text-muted-foreground/40" />
										)}
										<span className={plan.hasInventory ? "font-medium" : "text-muted-foreground"}>
											Inventory & Stock Ledger
										</span>
									</div>
									<div className="flex items-center gap-2">
										{plan.hasSubscriptions ? (
											<Check className="h-4 w-4 text-emerald-500" />
										) : (
											<X className="h-4 w-4 text-muted-foreground/40" />
										)}
										<span className={plan.hasSubscriptions ? "font-medium" : "text-muted-foreground"}>
											Recurring Subscriptions
										</span>
									</div>
									<div className="flex items-center gap-2">
										{plan.hasAutomations ? (
											<Check className="h-4 w-4 text-emerald-500" />
										) : (
											<X className="h-4 w-4 text-muted-foreground/40" />
										)}
										<span className={plan.hasAutomations ? "font-medium" : "text-muted-foreground"}>
											Automations Engine
										</span>
									</div>
									<div className="flex items-center gap-2">
										{plan.hasCustomDomains ? (
											<Check className="h-4 w-4 text-emerald-500" />
										) : (
											<X className="h-4 w-4 text-muted-foreground/40" />
										)}
										<span className={plan.hasCustomDomains ? "font-medium" : "text-muted-foreground"}>
											Custom Domains
										</span>
									</div>
									<div className="flex items-center gap-2">
										{plan.hasWebhooks ? (
											<Check className="h-4 w-4 text-emerald-500" />
										) : (
											<X className="h-4 w-4 text-muted-foreground/40" />
										)}
										<span className={plan.hasWebhooks ? "font-medium" : "text-muted-foreground"}>
											Outbound Webhooks (Svix)
										</span>
									</div>
								</div>
							</CardContent>
							<CardFooter className="border-t border-border/40 pt-4">
								<Badge variant={plan.isActive ? "default" : "secondary"}>
									{plan.isActive ? "Active Plan" : "Draft / Archived"}
								</Badge>
							</CardFooter>
						</Card>
					))
				) : (
					<p className="text-muted-foreground text-sm col-span-3">No plans created yet.</p>
				)}
			</div>

			{/* Create / Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingPlan ? "Edit Subscription Plan" : "Create New Plan"}</DialogTitle>
						<DialogDescription>
							Define plan pricing, resource quotas, and feature entitlements.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-4 py-2">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1">
								<label className="text-xs font-semibold">Plan Name</label>
								<Input
									placeholder="e.g. Enterprise Tier"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-1">
								<label className="text-xs font-semibold">Code / Slug</label>
								<Input
									placeholder="e.g. enterprise"
									value={code}
									onChange={(e) => setCode(e.target.value)}
									disabled={!!editingPlan}
									required
								/>
							</div>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-semibold">Description</label>
							<Input
								placeholder="Ideal for scaling organizations with advanced needs."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-1">
								<label className="text-xs font-semibold">Monthly Price ($)</label>
								<Input
									type="number"
									min="0"
									value={priceMonthly}
									onChange={(e) => setPriceMonthly(Number(e.target.value))}
									required
								/>
							</div>
							<div className="space-y-1">
								<label className="text-xs font-semibold">Yearly Price ($)</label>
								<Input
									type="number"
									min="0"
									value={priceYearly}
									onChange={(e) => setPriceYearly(Number(e.target.value))}
									required
								/>
							</div>
						</div>

						{/* Quotas */}
						<div className="border-t border-border pt-4">
							<h4 className="font-semibold text-sm mb-3">Resource Quotas</h4>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
								<div className="space-y-1">
									<label className="text-xs font-medium">Max Team Users</label>
									<Input
										type="number"
										min="1"
										value={maxUsers}
										onChange={(e) => setMaxUsers(Number(e.target.value))}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium">Max Contacts</label>
									<Input
										type="number"
										min="10"
										value={maxContacts}
										onChange={(e) => setMaxContacts(Number(e.target.value))}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium">Monthly Invoices</label>
									<Input
										type="number"
										min="1"
										value={maxInvoices}
										onChange={(e) => setMaxInvoices(Number(e.target.value))}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium">Monthly Automations</label>
									<Input
										type="number"
										min="1"
										value={maxAutomations}
										onChange={(e) => setMaxAutomations(Number(e.target.value))}
									/>
								</div>
								<div className="space-y-1">
									<label className="text-xs font-medium">Storage (MB)</label>
									<Input
										type="number"
										min="100"
										value={maxStorageMb}
										onChange={(e) => setMaxStorageMb(Number(e.target.value))}
									/>
								</div>
							</div>
						</div>

						{/* Feature Toggles */}
						<div className="border-t border-border pt-4">
							<h4 className="font-semibold text-sm mb-3">Feature Entitlements</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={hasInventory}
										onChange={(e) => setHasInventory(e.target.checked)}
										className="rounded border-border text-primary"
									/>
									<span>Inventory & Stock Control</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={hasSubscriptions}
										onChange={(e) => setHasSubscriptions(e.target.checked)}
										className="rounded border-border text-primary"
									/>
									<span>Recurring Subscriptions</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={hasAutomations}
										onChange={(e) => setHasAutomations(e.target.checked)}
										className="rounded border-border text-primary"
									/>
									<span>Automations Event Bus</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={hasCustomDomains}
										onChange={(e) => setHasCustomDomains(e.target.checked)}
										className="rounded border-border text-primary"
									/>
									<span>Custom Domains</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={hasWebhooks}
										onChange={(e) => setHasWebhooks(e.target.checked)}
										className="rounded border-border text-primary"
									/>
									<span>Outbound Webhooks</span>
								</label>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={hasApiKeys}
										onChange={(e) => setHasApiKeys(e.target.checked)}
										className="rounded border-border text-primary"
									/>
									<span>Developer API Keys</span>
								</label>
							</div>
						</div>

						<DialogFooter className="pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setDialogOpen(false)}
								className="min-h-[44px]"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={createMutation.isPending || updateMutation.isPending}
								className="min-h-[44px] font-semibold"
							>
								{editingPlan ? "Save Changes" : "Create Plan"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}

