"use client";

import { CheckCircle2, FileText, Loader2 } from "lucide-react";
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
		},
	});

	const createQuote = api.billing.createQuote.useMutation({
		onSuccess: () => {
			refetchQuotes();
			setQuoteModalOpen(false);
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
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-2xl text-white tracking-tight">
							Quotes & Invoices
						</h2>
						<p className="text-slate-400 text-sm">
							Create client quotes, send invoices, and track billing payment
							statuses.
						</p>
					</div>
					<div className="flex gap-3">
						<Link href="/products">
							<Button variant="outline">Product Catalog</Button>
						</Link>

						<Dialog onOpenChange={setQuoteModalOpen} open={quoteModalOpen}>
							<DialogTrigger asChild>
								<Button variant="secondary">Create Quote</Button>
							</DialogTrigger>
							<DialogContent className="border-slate-800 bg-slate-900 text-white sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Create New Quote</DialogTitle>
								</DialogHeader>
								<form className="mt-4 space-y-4" onSubmit={handleQuoteSubmit}>
									<div className="space-y-2">
										<Label htmlFor="title">Quote Title</Label>
										<Input
											className="border-slate-800 bg-slate-950"
											id="title"
											onChange={(e) =>
												setQuoteForm({ ...quoteForm, title: e.target.value })
											}
											placeholder="e.g. Website Redesign"
											required
											value={quoteForm.title}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="q_total">Estimated Total Amount ($)</Label>
										<Input
											className="border-slate-800 bg-slate-950"
											id="q_total"
											onChange={(e) =>
												setQuoteForm({
													...quoteForm,
													totalAmount: e.target.value,
												})
											}
											required
											step="0.01"
											type="number"
											value={quoteForm.totalAmount}
										/>
									</div>
									<Button
										className="mt-2 w-full"
										disabled={createQuote.isPending}
										type="submit"
									>
										{createQuote.isPending && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Create Quote
									</Button>
								</form>
							</DialogContent>
						</Dialog>

						<Dialog onOpenChange={setInvoiceModalOpen} open={invoiceModalOpen}>
							<DialogTrigger asChild>
								<Button>Create Invoice</Button>
							</DialogTrigger>
							<DialogContent className="border-slate-800 bg-slate-900 text-white sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Create New Invoice</DialogTitle>
								</DialogHeader>
								<form className="mt-4 space-y-4" onSubmit={handleInvoiceSubmit}>
									<div className="space-y-2">
										<Label htmlFor="invNum">Invoice Number</Label>
										<Input
											className="border-slate-800 bg-slate-950"
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
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="subtotal">Subtotal ($)</Label>
											<Input
												className="border-slate-800 bg-slate-950"
												id="subtotal"
												onChange={(e) =>
													setInvoiceForm({
														...invoiceForm,
														subtotal: e.target.value,
													})
												}
												required
												step="0.01"
												type="number"
												value={invoiceForm.subtotal}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="tax">Tax Amount ($)</Label>
											<Input
												className="border-slate-800 bg-slate-950"
												id="tax"
												onChange={(e) =>
													setInvoiceForm({
														...invoiceForm,
														taxAmount: e.target.value,
													})
												}
												required
												step="0.01"
												type="number"
												value={invoiceForm.taxAmount}
											/>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="total">Total Amount ($)</Label>
											<Input
												className="border-slate-800 bg-slate-950"
												id="total"
												onChange={(e) =>
													setInvoiceForm({
														...invoiceForm,
														totalAmount: e.target.value,
													})
												}
												required
												step="0.01"
												type="number"
												value={invoiceForm.totalAmount}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="due">Due Date</Label>
											<Input
												className="border-slate-800 bg-slate-950"
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
									<Button
										className="mt-2 w-full"
										disabled={createInvoice.isPending}
										type="submit"
									>
										{createInvoice.isPending && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Create Invoice
									</Button>
								</form>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Invoices</CardTitle>
						</CardHeader>
						<CardContent>
							{isLoadingInvoices ? (
								<div className="flex justify-center p-4">
									<Loader2 className="h-6 w-6 animate-spin text-slate-500" />
								</div>
							) : invoices?.length === 0 ? (
								<div className="rounded-lg border border-slate-800 border-dashed bg-slate-950 p-6 text-center">
									<FileText className="mx-auto mb-2 h-8 w-8 text-slate-600" />
									<p className="text-slate-400 text-sm">
										No invoices found. Create one above.
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{invoices?.map((inv: any) => (
										<div
											className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-3"
											key={inv.id}
										>
											<div>
												<div className="font-medium font-mono text-sm text-white">
													{inv.invoiceNumber}
												</div>
												<div className="text-slate-400 text-xs">
													Due: {new Date(inv.dueDate).toLocaleDateString()}
												</div>
											</div>
											<div className="text-right">
												<div className="font-bold text-white">
													${inv.totalAmount}
												</div>
												<Badge
													className="mt-1"
													variant={
														inv.status === "PAID"
															? "success"
															: inv.status === "OVERDUE"
																? "destructive"
																: "secondary"
													}
												>
													{inv.status}
												</Badge>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Quotes</CardTitle>
						</CardHeader>
						<CardContent>
							{isLoadingQuotes ? (
								<div className="flex justify-center p-4">
									<Loader2 className="h-6 w-6 animate-spin text-slate-500" />
								</div>
							) : quotes?.length === 0 ? (
								<div className="rounded-lg border border-slate-800 border-dashed bg-slate-950 p-6 text-center">
									<CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-slate-600" />
									<p className="text-slate-400 text-sm">
										No quotes found. Create one above.
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{quotes?.map((quote) => (
										<div
											className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-3"
											key={quote.id}
										>
											<div>
												<div className="font-medium text-white">
													{quote.title}
												</div>
												<div className="text-slate-400 text-xs">
													Created:{" "}
													{new Date(quote.createdAt).toLocaleDateString()}
												</div>
											</div>
											<div className="text-right">
												<div className="font-bold text-white">
													${quote.totalAmount}
												</div>
												<Badge
													className="mt-1 border-slate-700 bg-slate-800 text-slate-300"
													variant="outline"
												>
													{quote.status}
												</Badge>
											</div>
										</div>
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
