"use client";

import { format } from "date-fns";
import {
	Copy,
	DollarSign,
	Edit,
	FileText,
	Info,
	Link as LinkIcon,
	Loader2,
	MoreHorizontal,
	Plus,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RecordPaymentDialog } from "~/components/billing/record-payment-dialog";
import { ViewPaymentsDialog } from "~/components/billing/view-payments-dialog";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { EmptyState } from "~/components/ui/empty-state";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { InfoTooltip } from "~/components/ui/tooltip-info";
import { useTour } from "~/hooks/use-tour";
import { api } from "~/trpc/react";

type InvoiceStatusFilter = "ALL" | "PAID" | "SENT" | "OVERDUE" | "DRAFT";

interface SelectedInvoice {
	id: string;
	invoiceNumber: string;
	balanceDue: number;
	version: number;
}

export default function InvoicesListPage() {
	const {
		data: invoices,
		isLoading,
		refetch,
	} = api.billing.getInvoices.useQuery();
	const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("ALL");
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [viewPaymentsDialogOpen, setViewPaymentsDialogOpen] = useState(false);
	const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
		useState<SelectedInvoice | null>(null);

	const invoiceTourSteps = [
		{
			element: "#tour-new-invoice",
			popover: {
				title: "Create Invoice",
				description:
					"Click here to generate a new invoice or quote for your clients.",
				side: "bottom",
			},
		},
	];
	const { startTour, forceStartTour } = useTour(invoiceTourSteps, "invoices");

	useEffect(() => {
		const t = setTimeout(() => startTour(), 500);
		return () => clearTimeout(t);
	}, [startTour]);

	const deleteMutation = api.billing.deleteInvoice.useMutation({
		onSuccess: () => {
			toast.success("Invoice deleted.");
			refetch();
		},
		onError: (err) => {
			toast.error(`Error deleting invoice: ${err.message}`);
		},
	});

	const reviseMutation = api.billing.reviseInvoice.useMutation({
		onSuccess: () => {
			toast.success("Invoice revised successfully.");
			refetch();
		},
		onError: (err) => {
			toast.error(`Error revising invoice: ${err.message}`);
		},
	});

	// Compute Financial KPI Metrics
	const allInvoices = invoices || [];
	const totalInvoiced = allInvoices.reduce(
		(sum, inv) => sum + (inv.totalAmount || 0),
		0,
	);
	const totalBalanceDue = allInvoices.reduce(
		(sum, inv) => sum + (inv.balanceDue || 0),
		0,
	);
	const totalCollected = Math.max(0, totalInvoiced - totalBalanceDue);

	const overdueInvoices = allInvoices.filter(
		(inv) =>
			inv.status === "OVERDUE" ||
			(inv.balanceDue > 0 && inv.dueDate && new Date(inv.dueDate) < new Date()),
	);
	const overdueAmount = overdueInvoices.reduce(
		(sum, inv) => sum + (inv.balanceDue || 0),
		0,
	);

	// Filter invoices
	const filteredInvoices = allInvoices.filter((inv) => {
		if (statusFilter === "ALL") return true;
		if (statusFilter === "PAID") return inv.status === "PAID";
		if (statusFilter === "SENT")
			return inv.status === "SENT" || inv.status === "PROFORMA";
		if (statusFilter === "OVERDUE") return inv.status === "OVERDUE";
		if (statusFilter === "DRAFT") return inv.status === "DRAFT";
		return true;
	});

	const renderStatusBadge = (status: string) => {
		switch (status) {
			case "PAID":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-semibold text-[11px] text-emerald-500 shadow-2xs">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm" />
						Paid
					</span>
				);
			case "OVERDUE":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 font-semibold text-[11px] text-red-500 shadow-2xs">
						<span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-sm" />
						Overdue
					</span>
				);
			case "SENT":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 font-semibold text-[11px] text-sky-500 shadow-2xs">
						<span className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-sm" />
						Sent
					</span>
				);
			case "PROFORMA":
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 font-semibold text-[11px] text-indigo-500 shadow-2xs">
						<span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-sm" />
						Proforma
					</span>
				);
			default:
				return (
					<span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted px-2.5 py-0.5 font-medium text-[11px] text-muted-foreground">
						<span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
						Draft
					</span>
				);
		}
	};

	return (
		<DashboardLayout>
			<div className="mx-auto flex max-w-[1700px] flex-col gap-6 pb-10">
				{/* Header & Financial KPI Strip */}
				<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					<div className="relative z-10 flex flex-col gap-6">
						<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
										Financial Ledger
									</span>
									<span className="text-muted-foreground text-xs">
										Billing & Receivables Engine
									</span>
								</div>
								<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
									Invoices
								</h1>
								<p className="text-muted-foreground text-xs sm:text-sm">
									Manage invoices, proformas, customer collections, and payment
									schedules.
								</p>
							</div>

							<div className="flex flex-wrap items-center gap-2.5">
								<Button
									className="gap-1.5 rounded-xl border-border/80 bg-background/60 text-xs shadow-xs hover:bg-accent/60"
									onClick={forceStartTour}
									size="sm"
									variant="outline"
								>
									<Info className="h-4 w-4 text-primary" />
									<span>Tour</span>
								</Button>

								<Button
									asChild
									className="gap-1.5 rounded-xl bg-primary px-4 font-semibold text-primary-foreground text-xs shadow-xs hover:bg-primary/90"
									id="tour-new-invoice"
									size="sm"
								>
									<Link href="/billing/invoices/new">
										<Plus className="h-4 w-4" />
										<span>New Invoice</span>
									</Link>
								</Button>
							</div>
						</div>

						{/* Top KPI Metric Scorecards */}
						<div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
							<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
								<span className="font-medium text-muted-foreground text-xs">
									Total Invoiced
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-foreground text-xl tabular-nums tracking-tight sm:text-2xl">
										$
										{(totalInvoiced / 100).toLocaleString(undefined, {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}
									</span>
									<span className="text-[11px] text-muted-foreground">
										({allInvoices.length} total)
									</span>
								</div>
							</div>

							<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
								<span className="font-medium text-muted-foreground text-xs">
									Total Collected
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-emerald-500 text-xl tabular-nums tracking-tight sm:text-2xl">
										$
										{(totalCollected / 100).toLocaleString(undefined, {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}
									</span>
									<span className="font-medium text-[11px] text-emerald-500">
										Settled
									</span>
								</div>
							</div>

							<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
								<span className="font-medium text-muted-foreground text-xs">
									Outstanding Balance
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-foreground text-xl tabular-nums tracking-tight sm:text-2xl">
										$
										{(totalBalanceDue / 100).toLocaleString(undefined, {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}
									</span>
									<span className="font-medium text-[11px] text-primary">
										Receivable
									</span>
								</div>
							</div>

							<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
								<span className="font-medium text-muted-foreground text-xs">
									Overdue Exposure
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span
										className={`font-bold text-xl tabular-nums tracking-tight sm:text-2xl ${overdueInvoices.length > 0 ? "text-red-500" : "text-foreground"}`}
									>
										$
										{(overdueAmount / 100).toLocaleString(undefined, {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}
									</span>
									<span
										className={`font-semibold text-[11px] ${overdueInvoices.length > 0 ? "text-red-500" : "text-muted-foreground"}`}
									>
										{overdueInvoices.length} past due
									</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Table Container Card */}
				<div className="rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					{/* Table Controls & Filter Pills */}
					<div className="mb-6 flex flex-col justify-between gap-4 border-border/60 border-b pb-4 sm:flex-row sm:items-center">
						<div className="flex flex-wrap items-center gap-1.5">
							{(
								[
									{ id: "ALL", label: "All Invoices" },
									{ id: "PAID", label: "Paid" },
									{ id: "SENT", label: "Pending Payment" },
									{ id: "OVERDUE", label: "Overdue" },
									{ id: "DRAFT", label: "Drafts" },
								] as const
							).map((p) => (
								<button
									className={`rounded-xl px-3 py-1 font-medium text-xs transition-all ${
										statusFilter === p.id
											? "bg-primary font-semibold text-primary-foreground shadow-xs"
											: "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
									}`}
									key={p.id}
									onClick={() => setStatusFilter(p.id)}
									type="button"
								>
									{p.label}
								</button>
							))}
						</div>

						<span className="text-muted-foreground text-xs">
							Showing {filteredInvoices.length} of {allInvoices.length} records
						</span>
					</div>

					{isLoading ? (
						<div className="flex h-48 items-center justify-center">
							<Loader2 className="h-6 w-6 animate-spin text-primary/70" />
						</div>
					) : filteredInvoices.length === 0 ? (
						<EmptyState
							action={
								<Button asChild className="rounded-xl">
									<Link href="/billing/invoices/new">
										<Plus className="mr-2 h-4 w-4" /> New Invoice
									</Link>
								</Button>
							}
							description={
								statusFilter === "ALL"
									? "You haven't created any invoices yet. Click below to create your first invoice."
									: "No invoices matched the selected status filter."
							}
							icon={FileText}
							title="No invoices found"
						/>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="border-border/60 hover:bg-transparent">
										<TableHead className="font-semibold text-foreground text-xs">
											Invoice #
										</TableHead>
										<TableHead className="font-semibold text-foreground text-xs">
											Client
										</TableHead>
										<TableHead className="font-semibold text-foreground text-xs">
											Issue Date
										</TableHead>
										<TableHead className="font-semibold text-foreground text-xs">
											Amount
										</TableHead>
										<TableHead className="font-semibold text-foreground text-xs">
											Balance Due
											<InfoTooltip content="The remaining amount unpaid on this invoice." />
										</TableHead>
										<TableHead className="font-semibold text-foreground text-xs">
											Status
											<InfoTooltip content="DRAFT: not sent. PROFORMA: estimated. SENT: awaiting payment. PAID: settled." />
										</TableHead>
										<TableHead className="w-[80px]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredInvoices.map((invoice) => {
										const formattedNumber =
											invoice.version > 1
												? `${invoice.invoiceNumber}-v${invoice.version}`
												: invoice.invoiceNumber;

										return (
											<TableRow
												className="border-border/60 transition-colors hover:bg-accent/40"
												key={invoice.id}
											>
												<TableCell className="font-mono font-semibold text-foreground text-xs">
													{formattedNumber}
												</TableCell>
												<TableCell className="font-medium text-foreground text-xs">
													{invoice.company?.name || "Direct Customer"}
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">
													{format(new Date(invoice.createdAt), "MMM d, yyyy")}
												</TableCell>
												<TableCell className="font-mono text-foreground text-xs tabular-nums">
													$
													{((invoice.totalAmount || 0) / 100).toLocaleString(
														undefined,
														{
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														},
													)}
												</TableCell>
												<TableCell className="font-mono font-semibold text-foreground text-xs tabular-nums">
													$
													{((invoice.balanceDue || 0) / 100).toLocaleString(
														undefined,
														{
															minimumFractionDigits: 2,
															maximumFractionDigits: 2,
														},
													)}
												</TableCell>
												<TableCell>
													{renderStatusBadge(invoice.status)}
												</TableCell>
												<TableCell className="text-right">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-accent hover:text-foreground"
																variant="ghost"
															>
																<span className="sr-only">Open menu</span>
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent
															align="end"
															className="w-48 rounded-2xl border-border/80 bg-popover/95 text-xs backdrop-blur-md"
														>
															<DropdownMenuLabel>Actions</DropdownMenuLabel>
															{invoice.status === "DRAFT" && (
																<DropdownMenuItem
																	onClick={() =>
																		toast.info(
																			"Edit not fully implemented yet in UI",
																		)
																	}
																>
																	<Edit className="mr-2 h-4 w-4 text-muted-foreground" />
																	Edit Draft
																</DropdownMenuItem>
															)}
															{invoice.status !== "DRAFT" && (
																<DropdownMenuItem
																	onClick={() => {
																		navigator.clipboard.writeText(
																			`${window.location.origin}/public/invoice/${invoice.id}`,
																		);
																		toast.success(
																			"Public link copied to clipboard",
																		);
																	}}
																>
																	<LinkIcon className="mr-2 h-4 w-4 text-primary" />
																	Copy Public Link
																</DropdownMenuItem>
															)}
															<DropdownMenuItem
																disabled={reviseMutation.isPending}
																onClick={() =>
																	reviseMutation.mutate({ id: invoice.id })
																}
															>
																<Copy className="mr-2 h-4 w-4 text-muted-foreground" />
																Revise (Clone)
															</DropdownMenuItem>
															{invoice.status !== "DRAFT" &&
																invoice.status !== "PAID" && (
																	<DropdownMenuItem
																		onClick={() => {
																			setSelectedInvoiceForPayment(invoice);
																			setPaymentDialogOpen(true);
																		}}
																	>
																		<DollarSign className="mr-2 h-4 w-4 text-emerald-500" />
																		Record Payment
																	</DropdownMenuItem>
																)}
															{invoice.status !== "DRAFT" && (
																<DropdownMenuItem
																	onClick={() => {
																		setSelectedInvoiceForPayment(invoice);
																		setViewPaymentsDialogOpen(true);
																	}}
																>
																	<DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
																	View Payments
																</DropdownMenuItem>
															)}
															<DropdownMenuSeparator />
															<DropdownMenuItem
																className="text-destructive focus:text-destructive"
																disabled={deleteMutation.isPending}
																onClick={() =>
																	deleteMutation.mutate({ id: invoice.id })
																}
															>
																<Trash2 className="mr-2 h-4 w-4" />
																Delete Invoice
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</div>

			{selectedInvoiceForPayment && (
				<>
					<RecordPaymentDialog
						balanceDue={selectedInvoiceForPayment.balanceDue}
						currency="USD"
						invoiceId={selectedInvoiceForPayment.id}
						invoiceNumber={
							selectedInvoiceForPayment.version > 1
								? `${selectedInvoiceForPayment.invoiceNumber}-v${selectedInvoiceForPayment.version}`
								: selectedInvoiceForPayment.invoiceNumber
						}
						onOpenChange={setPaymentDialogOpen}
						onSuccess={() => refetch()}
						open={paymentDialogOpen}
					/>
					<ViewPaymentsDialog
						invoiceId={selectedInvoiceForPayment.id}
						invoiceNumber={
							selectedInvoiceForPayment.version > 1
								? `${selectedInvoiceForPayment.invoiceNumber}-v${selectedInvoiceForPayment.version}`
								: selectedInvoiceForPayment.invoiceNumber
						}
						onOpenChange={setViewPaymentsDialogOpen}
						onSuccess={() => refetch()}
						open={viewPaymentsDialogOpen}
					/>
				</>
			)}
		</DashboardLayout>
	);
}
