"use client";

import { differenceInDays, format } from "date-fns";
import {
	AlertTriangle,
	CalendarIcon,
	DollarSign,
	Edit,
	Plus,
	Repeat,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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

export default function ClientSubscriptionsPage() {
	const {
		data: subscriptions,
		isLoading,
		refetch,
	} = api.clientSubscriptions.getSubscriptions.useQuery();
	const { data: clients } = api.crm.getCompanies.useQuery();
	const { data: products } = api.inventory.getProducts.useQuery();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<any>(null);

	// Form State
	const [companyId, setCompanyId] = useState("");
	const [productId, setProductId] = useState("");
	const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">(
		"MONTHLY",
	);
	const [price, setPrice] = useState("");
	const [startDate, setStartDate] = useState<string>(
		new Date().toISOString().split("T")[0]!,
	);
	const [status, setStatus] = useState<"ACTIVE" | "CANCELLED" | "EXPIRED">(
		"ACTIVE",
	);

	const createMutation = api.clientSubscriptions.createSubscription.useMutation(
		{
			onSuccess: () => {
				toast.success("Subscription created successfully.");
				setDialogOpen(false);
				refetch();
			},
			onError: (err) => toast.error(`Error: ${err.message}`),
		},
	);

	const updateMutation = api.clientSubscriptions.updateSubscription.useMutation(
		{
			onSuccess: () => {
				toast.success("Subscription updated successfully.");
				setDialogOpen(false);
				refetch();
			},
			onError: (err) => toast.error(`Error: ${err.message}`),
		},
	);

	const deleteMutation = api.clientSubscriptions.deleteSubscription.useMutation(
		{
			onSuccess: () => {
				toast.success("Subscription deleted successfully.");
				refetch();
			},
			onError: (err) => toast.error(`Error: ${err.message}`),
		},
	);

	const handleOpenDialog = (item?: any) => {
		if (item) {
			setEditingItem(item);
			setCompanyId(item.companyId);
			setProductId(item.productId);
			setBillingCycle(item.billingCycle);
			setPrice((item.price / 100).toString());
			setStartDate(new Date(item.startDate).toISOString().split("T")[0]!);
			setStatus(item.status);
		} else {
			setEditingItem(null);
			setCompanyId("");
			setProductId("");
			setBillingCycle("MONTHLY");
			setPrice("");
			setStartDate(new Date().toISOString().split("T")[0]!);
			setStatus("ACTIVE");
		}
		setDialogOpen(true);
	};

	const handleProductChange = (val: string) => {
		setProductId(val);
		if (!editingItem) {
			const prod = products?.find((p) => p.id === val);
			if (prod) {
				setPrice((prod.unitPrice / 100).toString());
			}
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const priceCents = Math.round(parseFloat(price) * 100);
		const start = new Date(startDate);

		if (editingItem) {
			updateMutation.mutate({
				id: editingItem.id,
				status,
				price: priceCents,
				nextRenewalDate: new Date(editingItem.nextRenewalDate),
			});
		} else {
			if (!companyId || !productId)
				return toast.error("Client and Product are required.");
			createMutation.mutate({
				companyId,
				productId,
				billingCycle,
				price: priceCents,
				startDate: start,
			});
		}
	};

	const handleDelete = (id: string) => {
		if (confirm("Are you sure you want to delete this subscription?")) {
			deleteMutation.mutate({ id });
		}
	};

	// Analytics
	const stats = useMemo(() => {
		const list = subscriptions || [];
		let activeCount = 0;
		let mrrCents = 0;
		let overdueCount = 0;
		const now = new Date();

		for (const sub of list) {
			if (sub.status === "ACTIVE") {
				activeCount += 1;
				if (sub.billingCycle === "MONTHLY") {
					mrrCents += sub.price;
				} else {
					mrrCents += Math.round(sub.price / 12);
				}
				const diff = differenceInDays(new Date(sub.nextRenewalDate), now);
				if (diff < 0) overdueCount += 1;
			}
		}

		return {
			total: list.length,
			active: activeCount,
			mrr: mrrCents / 100,
			overdue: overdueCount,
		};
	}, [subscriptions]);

	const renderStatusBadge = (s: string) => {
		switch (s) {
			case "ACTIVE":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-500 text-xs">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm" />
						Active
					</span>
				);
			case "CANCELLED":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs">
						<span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
						Cancelled
					</span>
				);
			case "EXPIRED":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 font-medium text-destructive text-xs">
						<span className="h-1.5 w-1.5 rounded-full bg-destructive shadow-sm" />
						Expired
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 font-medium text-xs">
						{s}
					</span>
				);
		}
	};

	const getRenewalWarning = (date: Date, isActive: boolean) => {
		if (!isActive) return null;
		const days = differenceInDays(date, new Date());
		if (days < 0) {
			return (
				<div className="mt-1 flex items-center font-medium text-destructive text-xs">
					<AlertTriangle className="mr-1 h-3 w-3 shrink-0" /> Overdue by {Math.abs(days)} days
				</div>
			);
		}
		if (days <= 7) {
			return (
				<div className="mt-1 flex items-center font-medium text-amber-500 text-xs">
					<CalendarIcon className="mr-1 h-3 w-3 shrink-0" /> Renews in {days} days
				</div>
			);
		}
		return null;
	};

	return (
		<DashboardLayout>
			<div className="mx-auto flex max-w-[1700px] flex-col gap-6 pb-12">
				{/* Header Section */}
				<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
									Recurring Services
								</span>
								<span className="text-muted-foreground text-xs">
									Retainers & Subscriptions
								</span>
							</div>
							<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Client Subscriptions
							</h1>
							<p className="text-muted-foreground text-xs sm:text-sm">
								Track recurring services, contract retainers, and upcoming renewal dates.
							</p>
						</div>
						<Button
							className="gap-2 rounded-xl min-h-[44px] sm:min-h-0"
							onClick={() => handleOpenDialog()}
						>
							<Plus className="h-4 w-4" />
							<span>New Subscription</span>
						</Button>
					</div>

					{/* Metrics Scorecards */}
					<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
							<span className="font-medium text-muted-foreground text-xs">
								Active Retainers
							</span>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className="font-bold text-emerald-500 text-xl tabular-nums tracking-tight sm:text-2xl">
									{stats.active}
								</span>
								<span className="text-[11px] text-muted-foreground">
									of {stats.total} total
								</span>
							</div>
						</div>

						<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
							<span className="font-medium text-muted-foreground text-xs">
								Estimated MRR
							</span>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className="font-bold text-foreground text-xl tabular-nums tracking-tight sm:text-2xl">
									${stats.mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}
								</span>
								<span className="text-[11px] text-primary font-medium">
									/month
								</span>
							</div>
						</div>

						<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
							<span className="font-medium text-muted-foreground text-xs">
								Upcoming Renewals
							</span>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className="font-bold text-sky-500 text-xl tabular-nums tracking-tight sm:text-2xl">
									{stats.active}
								</span>
								<span className="text-[11px] text-muted-foreground">
									tracked
								</span>
							</div>
						</div>

						<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
							<span className="font-medium text-muted-foreground text-xs">
								Overdue Renewals
							</span>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className={`font-bold text-xl tabular-nums tracking-tight sm:text-2xl ${stats.overdue > 0 ? "text-destructive" : "text-foreground"}`}>
									{stats.overdue}
								</span>
								<span className={`text-[11px] ${stats.overdue > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
									past renewal
								</span>
							</div>
						</div>
					</div>
				</section>

				{/* Table Container */}
				<Card className="rounded-3xl border border-border/70 bg-card/75 shadow-sm backdrop-blur-md">
					<CardHeader className="p-4 sm:p-6 pb-2">
						<CardTitle className="text-lg font-bold">Active & Upcoming Renewals</CardTitle>
						<CardDescription className="text-xs">
							A complete list of all client subscriptions linked to your catalog.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0 sm:p-6 sm:pt-0">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="border-border/60">
										<TableHead className="text-xs font-semibold">Client</TableHead>
										<TableHead className="text-xs font-semibold">Service / Product</TableHead>
										<TableHead className="text-xs font-semibold">Cycle</TableHead>
										<TableHead className="text-xs font-semibold">Price</TableHead>
										<TableHead className="text-xs font-semibold">Status</TableHead>
										<TableHead className="text-xs font-semibold">Next Renewal</TableHead>
										<TableHead className="w-[100px] text-right text-xs font-semibold">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{isLoading ? (
										<TableRow>
											<TableCell className="h-28 text-center text-muted-foreground text-xs" colSpan={7}>
												Loading subscriptions...
											</TableCell>
										</TableRow>
									) : subscriptions?.length === 0 ? (
										<TableRow>
											<TableCell
												className="h-28 text-center text-muted-foreground text-xs"
												colSpan={7}
											>
												No client subscriptions tracked yet.
											</TableCell>
										</TableRow>
									) : (
										subscriptions?.map((sub) => (
											<TableRow className="border-border/60 hover:bg-accent/40" key={sub.id}>
												<TableCell className="font-semibold text-foreground text-xs">
													{sub.company?.name || "Direct Customer"}
												</TableCell>
												<TableCell className="text-xs">
													<div className="font-medium text-foreground">
														{sub.product?.name || "Standard Service"}
													</div>
												</TableCell>
												<TableCell className="text-xs">
													<Badge
														className="text-xs font-mono"
														variant="outline"
													>
														{sub.billingCycle}
													</Badge>
												</TableCell>
												<TableCell className="font-semibold font-mono text-foreground text-xs tabular-nums">
													{new Intl.NumberFormat("en-US", {
														style: "currency",
														currency: "USD",
													}).format(sub.price / 100)}
												</TableCell>
												<TableCell>{renderStatusBadge(sub.status)}</TableCell>
												<TableCell className="text-xs">
													<div className="font-medium text-foreground">
														{format(new Date(sub.nextRenewalDate), "MMM d, yyyy")}
													</div>
													{getRenewalWarning(
														new Date(sub.nextRenewalDate),
														sub.status === "ACTIVE",
													)}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-1">
														<Button
															className="h-9 w-9 rounded-lg"
															onClick={() => handleOpenDialog(sub)}
															size="icon"
															variant="ghost"
														>
															<Edit className="h-4 w-4" />
														</Button>
														<Button
															className="h-9 w-9 rounded-lg text-destructive hover:text-destructive"
															onClick={() => handleDelete(sub.id)}
															size="icon"
															variant="ghost"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				<Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>
								{editingItem ? "Edit Subscription" : "New Subscription"}
							</DialogTitle>
							<DialogDescription className="text-xs">
								{editingItem
									? "Update the status or price of this subscription."
									: "Track a new recurring service for a client."}
							</DialogDescription>
						</DialogHeader>

						<form className="space-y-4 py-2" onSubmit={handleSubmit}>
							{!editingItem && (
								<>
									<div className="space-y-1.5">
										<Label className="text-xs">Client</Label>
										<Select onValueChange={setCompanyId} value={companyId}>
											<SelectTrigger className="h-10">
												<SelectValue placeholder="Select a client" />
											</SelectTrigger>
											<SelectContent>
												{clients?.map((c) => (
													<SelectItem key={c.id} value={c.id}>
														{c.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-1.5">
										<Label className="text-xs">Service / Product (from Catalog)</Label>
										<Select onValueChange={handleProductChange} value={productId}>
											<SelectTrigger className="h-10">
												<SelectValue placeholder="Select a catalog item" />
											</SelectTrigger>
											<SelectContent>
												{products?.map((p) => (
													<SelectItem key={p.id} value={p.id}>
														{p.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
										<div className="space-y-1.5">
											<Label className="text-xs">Billing Cycle</Label>
											<Select
												onValueChange={(val: any) => setBillingCycle(val)}
												value={billingCycle}
											>
												<SelectTrigger className="h-10">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="MONTHLY">Monthly</SelectItem>
													<SelectItem value="YEARLY">Yearly</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-1.5">
											<Label className="text-xs">Start Date</Label>
											<Input
												className="h-10 text-sm"
												onChange={(e) => setStartDate(e.target.value)}
												required
												type="date"
												value={startDate}
											/>
										</div>
									</div>
								</>
							)}

							{editingItem && (
								<div className="space-y-1.5">
									<Label className="text-xs">Status</Label>
									<Select
										onValueChange={(val: any) => setStatus(val)}
										value={status}
									>
										<SelectTrigger className="h-10">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ACTIVE">Active</SelectItem>
											<SelectItem value="CANCELLED">Cancelled</SelectItem>
											<SelectItem value="EXPIRED">Expired</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}

							<div className="space-y-1.5">
								<Label className="text-xs">Agreed Price ($)</Label>
								<Input
									className="h-10 text-sm"
									min="0"
									onChange={(e) => setPrice(e.target.value)}
									required
									step="0.01"
									type="number"
									value={price}
								/>
								<p className="text-muted-foreground text-[11px]">
									This can be different from the catalog default.
								</p>
							</div>

							<DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
								<Button
									className="min-h-[44px] sm:min-h-0"
									onClick={() => setDialogOpen(false)}
									type="button"
									variant="outline"
								>
									Cancel
								</Button>
								<Button
									className="min-h-[44px] sm:min-h-0"
									disabled={createMutation.isPending || updateMutation.isPending}
									type="submit"
								>
									{editingItem ? "Save Changes" : "Create Subscription"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>
		</DashboardLayout>
	);
}
