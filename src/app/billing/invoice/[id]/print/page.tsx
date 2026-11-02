"use client";

import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "~/components/ui/button";

export default function InvoicePrintPage() {
	const params = useParams();
	const invoiceId = params?.id as string;

	const handlePrint = () => {
		if (typeof window !== "undefined") {
			window.print();
		}
	};

	return (
		<div className="min-h-screen bg-muted/30 p-3 sm:p-6 lg:p-10 text-foreground print:bg-white print:p-0 print:text-black">
			{/* Print Controls Header (Hidden during actual print) */}
			<div className="mx-auto max-w-4xl mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm print:hidden">
				<Button asChild variant="outline" className="min-h-[44px] gap-2">
					<Link href="/billing/invoices">
						<ArrowLeft className="h-4 w-4" />
						<span>Back to Invoices</span>
					</Link>
				</Button>

				<div className="flex items-center gap-2 self-end sm:self-auto">
					<Button
						onClick={handlePrint}
						variant="secondary"
						className="min-h-[44px] gap-2 font-medium"
					>
						<Printer className="h-4 w-4" />
						<span>Print Document</span>
					</Button>
					<Button
						onClick={handlePrint}
						className="min-h-[44px] gap-2 font-semibold shadow-xs"
					>
						<Download className="h-4 w-4" />
						<span>Save as PDF</span>
					</Button>
				</div>
			</div>

			{/* Invoice Document Stationery */}
			<div className="mx-auto max-w-4xl rounded-2xl sm:rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-md print:border-none print:shadow-none print:p-6 print:bg-white">
				{/* Top Corporate Stationery Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-primary/20 pb-6 print:border-black/20">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-primary print:text-black">
								DevCRM
							</span>
							<span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary print:hidden">
								Official Tax Invoice
							</span>
						</div>
						<p className="text-xs text-muted-foreground print:text-gray-600 max-w-xs">
							Enterprise CRM, Multi-Currency Billing & Cloud Logistics Platform
						</p>
						<p className="text-xs text-muted-foreground print:text-gray-600 font-mono">
							GSTIN: 27AABCT3518Q1ZV • Tax Regime: B2B Standard
						</p>
					</div>

					<div className="text-left sm:text-right space-y-1">
						<h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-foreground print:text-black">
							TAX INVOICE
						</h2>
						<p className="font-mono text-sm font-semibold text-foreground print:text-black">
							{invoiceId ? `INV-${invoiceId.slice(0, 8).toUpperCase()}` : "INV-2026-001"}
						</p>
						<p className="text-xs text-muted-foreground print:text-gray-600">
							Issue Date: July 25, 2026
						</p>
						<p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 print:text-emerald-700">
							Due Date: August 15, 2026
						</p>
					</div>
				</div>

				{/* Billed To / Billed By Details */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-border print:border-gray-300 text-xs sm:text-sm">
					<div className="space-y-1.5">
						<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500">
							Billed To:
						</span>
						<p className="font-bold text-base text-foreground print:text-black">
							Acme Corporation
						</p>
						<p className="text-muted-foreground print:text-gray-600">
							100 Enterprise Way, Suite 400
						</p>
						<p className="text-muted-foreground print:text-gray-600">
							San Francisco, CA 94105, United States
						</p>
						<p className="text-muted-foreground print:text-gray-600 font-mono">
							billing@acmecorp.com • Tax ID: US-EIN-9482910
						</p>
					</div>

					<div className="space-y-1.5 sm:text-right">
						<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500">
							Payment Instructions:
						</span>
						<p className="font-bold text-foreground print:text-black">
							Wire Transfer / Direct Bank Deposit
						</p>
						<p className="text-muted-foreground print:text-gray-600 font-mono">
							Bank: Silicon Valley Commercial Bank
						</p>
						<p className="text-muted-foreground print:text-gray-600 font-mono">
							Account: 4892-0192-3810 • Routing: 121000358
						</p>
						<p className="text-muted-foreground print:text-gray-600 font-mono">
							Swift / BIC: SVCBUS33 • Currency: USD ($)
						</p>
					</div>
				</div>

				{/* Line Items Table */}
				<div className="overflow-x-auto py-6">
					<table className="w-full text-left text-xs sm:text-sm">
						<thead className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider print:border-gray-300">
							<tr>
								<th className="py-3 px-2">Item & Service Description</th>
								<th className="py-3 px-2 text-center">Qty</th>
								<th className="py-3 px-2 text-right">Unit Price</th>
								<th className="py-3 px-2 text-right">Tax Rate</th>
								<th className="py-3 px-2 text-right">Total Amount</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/60 print:divide-gray-200">
							<tr>
								<td className="py-4 px-2">
									<div className="font-semibold text-foreground print:text-black">
										Developer CRM Pro Tier (Annual Contract)
									</div>
									<div className="text-[11px] text-muted-foreground print:text-gray-500">
										Includes 15 team seats, custom webhooks, tRPC APIs, and automated billing.
									</div>
								</td>
								<td className="py-4 px-2 text-center tabular-nums text-foreground print:text-black">1</td>
								<td className="py-4 px-2 text-right tabular-nums text-foreground print:text-black">$5,988.00</td>
								<td className="py-4 px-2 text-right tabular-nums text-muted-foreground print:text-gray-600">10%</td>
								<td className="py-4 px-2 text-right font-semibold tabular-nums text-foreground print:text-black">$5,988.00</td>
							</tr>
							<tr>
								<td className="py-4 px-2">
									<div className="font-semibold text-foreground print:text-black">
										Custom SDK & Svix Integration Package
									</div>
									<div className="text-[11px] text-muted-foreground print:text-gray-500">
										Dedicated enterprise pipeline migration and signature verification rollout.
									</div>
								</td>
								<td className="py-4 px-2 text-center tabular-nums text-foreground print:text-black">1</td>
								<td className="py-4 px-2 text-right tabular-nums text-foreground print:text-black">$2,500.00</td>
								<td className="py-4 px-2 text-right tabular-nums text-muted-foreground print:text-gray-600">10%</td>
								<td className="py-4 px-2 text-right font-semibold tabular-nums text-foreground print:text-black">$2,500.00</td>
							</tr>
						</tbody>
					</table>
				</div>

				{/* Totals Summary */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-t border-border pt-6 print:border-gray-300 gap-6">
					<div className="space-y-1 max-w-sm text-xs text-muted-foreground print:text-gray-500">
						<p className="font-semibold text-foreground print:text-black">Terms & Conditions:</p>
						<p>
							Payment is due within 21 days of invoice date. All payments must reference the invoice identifier.
						</p>
					</div>

					<div className="w-full sm:w-72 space-y-2 text-xs sm:text-sm">
						<div className="flex justify-between text-muted-foreground print:text-gray-600">
							<span>Subtotal</span>
							<span className="tabular-nums font-medium text-foreground print:text-black">$8,488.00</span>
						</div>
						<div className="flex justify-between text-muted-foreground print:text-gray-600">
							<span>Applicable Tax (10%)</span>
							<span className="tabular-nums font-medium text-foreground print:text-black">$848.80</span>
						</div>
						<div className="flex justify-between border-t border-border pt-2 font-bold text-base sm:text-lg text-foreground print:border-black print:text-black">
							<span>Total Due:</span>
							<span className="text-emerald-600 dark:text-emerald-400 print:text-black tabular-nums">
								$9,336.80
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
