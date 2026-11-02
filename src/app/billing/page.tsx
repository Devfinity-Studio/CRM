"use client";

import {
	ArrowRight,
	Calendar,
	CheckCircle2,
	Clock,
	DollarSign,
	FileText,
	Loader2,
	Package,
	Plus,
	Receipt,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

export default function BillingPage() {
	const {
		data: invoices,
		isLoading: isLoadingInvoices,
		refetch: refetchInvoices,
	} = api.billing.getInvoices.useQuery();
	const {
		data: quotes,
		isLoading: isLoadingQuotes,
		refetch: refetchQuotes,
	} = api.billing.getQuotes.useQuery();

	const createInvoice = api.billing.createInvoice.useMutation({
		onSuccess: () => {
			refetchInvoices();
			setInvoiceModalOpen(false);
			setInvoiceForm({
				invoiceNumber: "",
				subtotal: "",
				taxAmount: "",
				totalAmount: "",
				dueDate: "",
			});
		},
	});

	const createQuote = api.billing.createQuote.useMutation({
		onSuccess: () => {
			refetchQuotes();
			setQuoteModalOpen(false);
			setQuoteForm({
				title: "",
				totalAmount: "",
			});
		},
	});

	const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
	const [quoteModalOpen, setQuoteModalOpen] = useState(false);

	const [invoiceForm, setInvoiceForm] = useState({
		invoiceNumber: "",
		subtotal: "",
		taxAmount: "",
		totalAmount: "",
		dueDate: "",
	});

	const [quoteForm, setQuoteForm] = useState({
		title: "",
		totalAmount: "",
	});

	const handleInvoiceSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createInvoice.mutate({
			invoiceNumber: invoiceForm.invoiceNumber,
			subtotal: parseFloat(invoiceForm.subtotal),
			taxAmount: parseFloat(invoiceForm.taxAmount),
			totalAmount: parseFloat(invoiceForm.totalAmount),
			dueDate: new Date(invoiceForm.dueDate),
		});
	};

	const handleQuoteSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createQuote.mutate({
			title: quoteForm.title,
			totalAmount: parseFloat(quoteForm.totalAmount),
		} as any);
	};

	return (
		<DashboardLayout>
			<div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-8 space-y-6">
				{/* Top Header & Fast Navigation */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
					<div className="space-y-1">
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
							Financial Hub & Billing
						</h1>
						<p className="text-sm text-muted-foreground">
							Create client quotes, issue compliant invoices, and manage receivables.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2 sm:gap-3">
						<Button asChild variant="outline" className="min-h-[44px] gap-2">
							<Link href="/inventory/products">
								<Package className="h-4 w-4 text-primary" />
								<span>Products</span>
							</Link>
						</Button>

						{/* Quick Create Quote Modal */}
						<Dialog onOpenChange={setQuoteModalOpen} open={quoteModalOpen}>
							<DialogTrigger asChild>
								<Button variant="secondary" className="min-h-[44px] gap-1.5">
									<Plus className="h-4 w-4" />
									<span>Quick Quote</span>
								</Button>
							</DialogTrigger>
							<DialogContent className="border border-border bg-popover text-popover-foreground sm:max-w-md p-6">
								<DialogHeader>
									<DialogTitle className="text-foreground text-lg font-bold">
										Create Fast Quote
									</DialogTitle>
									<DialogDescription className="text-xs text-muted-foreground">
										Create an instant proposal draft. For itemized pricing, visit full quotes.
									</DialogDescription>
								</DialogHeader>
								<form className="mt-4 space-y-4" onSubmit={handleQuoteSubmit}>
									<div className="space-y-1.5">
										<Label htmlFor="title" className="text-foreground text-xs font-semibold">
											Quote Title <span className="text-destructive">*</span>
										</Label>
										<Input
											className="min-h-[44px] bg-background border-border text-foreground"
											id="title"
											onChange={(e) =>
												setQuoteForm({ ...quoteForm, title: e.target.value })
											}
											placeholder="e.g. Enterprise Cloud Implementation"
											required
											value={quoteForm.title}
										/>
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="q_total" className="text-foreground text-xs font-semibold">
											Estimated Total Amount ($) <span className="text-destructive">*</span>
										</Label>
										<div className="relative">
											<DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
											<Input
												className="min-h-[44px] pl-9 bg-background border-border text-foreground"
												id="q_total"
												onChange={(e) =>
													setQuoteForm({
														...quoteForm,
														totalAmount: e.target.value,
													})
												}
												placeholder="5000.00"
												required
												step="0.01"
												type="number"
												value={quoteForm.totalAmount}
											/>
										</div>
									</div>
									<div className="flex items-center justify-end gap-2 pt-2">
										<Button
											type="button"
											variant="outline"
											onClick={() => setQuoteModalOpen(false)}
											className="min-h-[44px]"
										>
											Cancel
										</Button>
										<Button
											className="min-h-[44px] px-6 font-semibold"
											disabled={createQuote.isPending}
											type="submit"
										>
											{createQuote.isPending && (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											)}
											Save Quote
										</Button>
									</div>
								</form>
							</DialogContent>
						</Dialog>

						{/* Quick Create Invoice Modal */}
						<Dialog onOpenChange={setInvoiceModalOpen} open={invoiceModalOpen}>
							<DialogTrigger asChild>
								<Button className="min-h-[44px] gap-1.5 font-semibold">
									<Plus className="h-4 w-4" />
									<span>Quick Invoice</span>
								</Button>
							</DialogTrigger>
							<DialogContent className="border border-border bg-popover text-popover-foreground sm:max-w-lg p-6">
								<DialogHeader>
									<DialogTitle className="text-foreground text-lg font-bold">
										Create Fast Invoice
									</DialogTitle>
									<DialogDescription className="text-xs text-muted-foreground">
										Create a manual invoice entry. For multi-line GST invoices, use the Full Generator.
									</DialogDescription>
								</DialogHeader>
								<form className="mt-4 space-y-4" onSubmit={handleInvoiceSubmit}>
									<div className="space-y-1.5">
										<Label htmlFor="invNum" className="text-foreground text-xs font-semibold">
											Invoice Number <span className="text-destructive">*</span>
										</Label>
										<Input
											className="min-h-[44px] bg-background border-border text-foreground font-mono"
											id="invNum"
											onChange={(e) =>
												setInvoiceForm({
													...invoiceForm,
													invoiceNumber: e.target.value,
												})
											}
											placeholder="INV-2026-001"
											required
											value={invoiceForm.invoiceNumber}
										/>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-1.5">
											<Label htmlFor="subtotal" className="text-foreground text-xs font-semibold">
												Subtotal ($) <span className="text-destructive">*</span>
											</Label>
											<Input
												className="min-h-[44px] bg-background border-border text-foreground"
												id="subtotal"
												onChange={(e) =>
													setInvoiceForm({
														...invoiceForm,
														subtotal: e.target.value,
													})
												}
												placeholder="4500.00"
												required
												step="0.01"
												type="number"
												value={invoiceForm.subtotal}
											/>
										</div>
										<div className="space-y-1.5">
											<Label htmlFor="tax" className="text-foreground text-xs font-semibold">
												Tax Amount ($) <span className="text-destructive">*</span>
											</Label>
											<Input
												className="min-h-[44px] bg-background border-border text-foreground"
												id="tax"
												onChange={(e) =>
													setInvoiceForm({
														...invoiceForm,
														taxAmount: e.target.value,
													})
												}
												placeholder="500.00"
												required
												step="0.01"
												type="number"
												value={invoiceForm.taxAmount}
											/>
										</div>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-1.5">
											<Label htmlFor="total" className="text-foreground text-xs font-semibold">
												Total Amount ($) <span className="text-destructive">*</span>
											</Label>
											<Input
												className="min-h-[44px] bg-background border-border text-foreground font-semibold"
												id="total"
												onChange={(e) =>
													setInvoiceForm({
														...invoiceForm,
														totalAmount: e.target.value,
													})
												}
												placeholder="5000.00"
												required
												step="0.01"
												type="number"
												value={invoiceForm.totalAmount}
											/>
										</div>
										<div className="space-y-1.5">
											<Label htmlFor="due" className="text-foreground text-xs font-semibold">
												Due Date <span className="text-destructive">*</span>
											</Label>
											<Input
												className="min-h-[44px] bg-background border-border text-foreground"
												id="due"
												onChange={(e) =>
													setInvoiceForm({
														...invoiceForm,
														dueDate: e.target.value,
													})
												}
												required
												type="date"
												value={invoiceForm.dueDate}
											/>
										</div>
									</div>
									<div className="flex items-center justify-end gap-2 pt-2">
										<Button
											type="button"
											variant="outline"
											onClick={() => setInvoiceModalOpen(false)}
											className="min-h-[44px]"
										>
											Cancel
										</Button>
										<Button
											className="min-h-[44px] px-6 font-semibold"
											disabled={createInvoice.isPending}
											type="submit"
										>
											{createInvoice.isPending && (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											)}
											Save Invoice
										</Button>
									</div>
								</form>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				{/* Two Primary Columns: Invoices & Quotes */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					{/* INVOICES SECTION */}
					<Card className="border border-border bg-card shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
							<div className="flex items-center gap-2">
								<Receipt className="h-4 w-4 text-primary" />
								<CardTitle className="text-base sm:text-lg font-bold text-foreground">
									Recent Invoices
								</CardTitle>
							</div>
							<Button asChild variant="ghost" size="sm" className="min-h-[36px] text-xs gap-1 text-primary hover:text-primary">
								<Link href="/billing/invoices">
									View All <ArrowRight className="h-3.5 w-3.5" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-4 p-4 sm:p-6">
							{isLoadingInvoices ? (
								<div className="flex justify-center p-8">
									<Loader2 className="h-6 w-6 animate-spin text-primary" />
								</div>
							) : invoices?.length === 0 ? (
								<div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
									<FileText className="mx-auto h-8 w-8 text-muted-foreground" />
									<p className="font-semibold text-sm text-foreground">
										No invoices issued yet
									</p>
									<p className="text-xs text-muted-foreground">
										Create your first invoice using the Quick Invoice button above or the complete generator.
									</p>
									<Button asChild size="sm" className="min-h-[40px] mt-2">
										<Link href="/billing/invoices/new">Open Full Invoice Generator</Link>
									</Button>
								</div>
							) : (
								<div className="space-y-3">
									{invoices?.slice(0, 6).map((inv: any) => (
										<Link
											href={`/billing/invoices`}
											key={inv.id}
											className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3.5 transition hover:border-primary/40 hover:bg-muted/40 min-h-[56px]"
										>
											<div className="flex items-center gap-3 min-w-0">
												<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
													<Receipt className="h-5 w-5" />
												</div>
												<div className="min-w-0">
													<div className="font-semibold font-mono text-sm text-foreground truncate">
														{inv.invoiceNumber}
													</div>
													<div className="text-muted-foreground text-xs flex items-center gap-1">
														<Calendar className="h-3 w-3" />
														Due {new Date(inv.dueDate).toLocaleDateString()}
													</div>
												</div>
											</div>
											<div className="text-right shrink-0 ml-3">
												<div className="font-bold text-foreground text-sm tabular-nums">
													${Number(inv.totalAmount).toLocaleString(undefined, {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
												</div>
												<Badge
													className="mt-1 text-[10px] capitalize"
													variant={
														inv.status === "PAID"
															? "default"
															: inv.status === "OVERDUE"
																? "destructive"
																: "secondary"
													}
												>
													{inv.status}
												</Badge>
											</div>
										</Link>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* QUOTES SECTION */}
					<Card className="border border-border bg-card shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-primary" />
								<CardTitle className="text-base sm:text-lg font-bold text-foreground">
									Recent Quotes & Estimates
								</CardTitle>
							</div>
							<Button asChild variant="ghost" size="sm" className="min-h-[36px] text-xs gap-1 text-primary hover:text-primary">
								<Link href="/billing/quotes">
									View All <ArrowRight className="h-3.5 w-3.5" />
								</Link>
							</Button>
						</CardHeader>
						<CardContent className="pt-4 p-4 sm:p-6">
							{isLoadingQuotes ? (
								<div className="flex justify-center p-8">
									<Loader2 className="h-6 w-6 animate-spin text-primary" />
								</div>
							) : quotes?.length === 0 ? (
								<div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
									<CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
									<p className="font-semibold text-sm text-foreground">
										No active quotes found
									</p>
									<p className="text-xs text-muted-foreground">
										Generate client estimates and proposals to accelerate deal negotiations.
									</p>
									<Button asChild size="sm" className="min-h-[40px] mt-2">
										<Link href="/billing/quotes/new">Create Detailed Quote</Link>
									</Button>
								</div>
							) : (
								<div className="space-y-3">
									{quotes?.slice(0, 6).map((quote) => (
										<Link
											href="/billing/quotes"
											key={quote.id}
											className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3.5 transition hover:border-primary/40 hover:bg-muted/40 min-h-[56px]"
										>
											<div className="flex items-center gap-3 min-w-0">
												<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
													<DollarSign className="h-5 w-5" />
												</div>
												<div className="min-w-0">
													<div className="font-semibold text-sm text-foreground truncate">
														{quote.title}
													</div>
													<div className="text-muted-foreground text-xs flex items-center gap-1">
														<Clock className="h-3 w-3" />
														Created {new Date(quote.createdAt).toLocaleDateString()}
													</div>
												</div>
											</div>
											<div className="text-right shrink-0 ml-3">
												<div className="font-bold text-foreground text-sm tabular-nums">
													${Number(quote.totalAmount).toLocaleString(undefined, {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
												</div>
												<Badge
													className="mt-1 text-[10px] capitalize"
													variant="outline"
												>
													{quote.status}
												</Badge>
											</div>
										</Link>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</DashboardLayout>
	);
}
