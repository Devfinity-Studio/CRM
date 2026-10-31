import Link from "next/link";
import { Button } from "~/components/ui/button";

export default async function InvoicePrintPage({
	params,
}: {
	params: { id: string };
}) {
	return (
		<div className="mx-auto min-h-screen max-w-4xl space-y-8 bg-slate-950 p-8 text-slate-100 print:bg-white print:text-black">
			{/* Print Controls Header (Hidden during actual print) */}
			<div className="flex items-center justify-between border-slate-800 border-b pb-4 print:hidden">
				<Link href="/billing">
					<Button variant="outline">← Back to Invoices</Button>
				</Link>
				<div className="flex gap-2">
					<Button onClick={undefined} variant="secondary">
						Print HTML
					</Button>
					<Button>Download PDF</Button>
				</div>
			</div>

			{/* Invoice Document Layout */}
			<div className="space-y-8 rounded-xl border border-slate-800 bg-slate-900 p-8 print:border-none print:bg-white">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="font-extrabold text-3xl text-blue-500 tracking-tight print:text-blue-600">
							DevCRM
						</h1>
						<p className="text-slate-400 text-sm print:text-slate-600">
							Customer Relationship & Billing Platform
						</p>
					</div>
					<div className="text-right">
						<h2 className="font-bold text-white text-xl uppercase tracking-wide print:text-black">
							INVOICE
						</h2>
						<p className="font-mono text-slate-400 text-sm print:text-slate-600">
							INV-2026-001
						</p>
						<p className="mt-1 text-slate-500 text-xs">Date: July 25, 2026</p>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-8 border-slate-800 border-t border-b py-6 text-sm print:border-slate-300">
					<div>
						<span className="font-semibold text-slate-400 text-xs uppercase">
							Billed To:
						</span>
						<p className="mt-1 font-bold text-white print:text-black">
							Acme Corporation
						</p>
						<p className="text-slate-400 print:text-slate-600">
							100 Enterprise Way, Suite 400
						</p>
						<p className="text-slate-400 print:text-slate-600">
							billing@acmecorp.com
						</p>
					</div>
					<div className="text-right">
						<span className="font-semibold text-slate-400 text-xs uppercase">
							Payment Terms:
						</span>
						<p className="mt-1 font-bold text-emerald-400 print:text-emerald-700">
							Due Date: Aug 15, 2026
						</p>
						<p className="text-slate-400 print:text-slate-600">
							Status: Sent / Pending
						</p>
					</div>
				</div>

				{/* Line Items Table */}
				<table className="w-full text-left text-sm">
					<thead className="border-slate-800 border-b text-slate-400 text-xs uppercase print:border-slate-300">
						<tr>
							<th className="py-2">Item Description</th>
							<th className="py-2 text-center">Qty</th>
							<th className="py-2 text-right">Unit Price</th>
							<th className="py-2 text-right">Total</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
						<tr>
							<td className="py-3 font-medium text-white print:text-black">
								Developer API Pro Tier (Annual Plan)
							</td>
							<td className="py-3 text-center">1</td>
							<td className="py-3 text-right">$5,988.00</td>
							<td className="py-3 text-right font-semibold">$5,988.00</td>
						</tr>
						<tr>
							<td className="py-3 font-medium text-white print:text-black">
								Custom SDK Integration Setup
							</td>
							<td className="py-3 text-center">1</td>
							<td className="py-3 text-right">$2,500.00</td>
							<td className="py-3 text-right font-semibold">$2,500.00</td>
						</tr>
					</tbody>
				</table>

				{/* Totals Summary */}
				<div className="flex justify-end border-slate-800 border-t pt-4 print:border-slate-300">
					<div className="w-64 space-y-2 text-sm">
						<div className="flex justify-between text-slate-400">
							<span>Subtotal:</span>
							<span>$8,488.00</span>
						</div>
						<div className="flex justify-between text-slate-400">
							<span>Tax (10%):</span>
							<span>$848.80</span>
						</div>
						<div className="flex justify-between border-slate-800 border-t pt-2 font-bold text-lg text-white print:border-slate-300 print:text-black">
							<span>Total Due:</span>
							<span className="text-emerald-400 print:text-emerald-700">
								$9,336.80
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
