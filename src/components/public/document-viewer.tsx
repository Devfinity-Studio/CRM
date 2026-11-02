"use client";

import { format } from "date-fns";
import { Printer } from "lucide-react";
import { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { QuoteSignDialog } from "~/components/public/quote-sign-dialog";
import { Badge } from "~/components/ui/badge";
import { useReactToPrint } from "react-to-print";
import { Button } from "~/components/ui/button";

interface DocumentLineItem {
	id?: string;
	name: string;
	description?: string;
	quantity: number;
	unitPrice: number;
	amount: number;
}

interface DocumentPayment {
	id: string;
	paymentDate: Date | string;
	paymentMethod: string;
	amount: number;
}

interface DocumentData {
	id?: string;
	signedAt?: Date | string;
	quoteNumber?: string;
	invoiceNumber?: string;
	version?: number;
	date?: Date | string;
	createdAt?: Date | string;
	dueDate?: Date | string;
	status?: string;
	subtotal?: number;
	totalAmount?: number;
	taxPercent?: number;
	taxAmount?: number;
	amountPaid?: number;
	balanceDue?: number;
	notes?: string;
	signatureData?: string;
	signatureName?: string;
	organization?: {
		name?: string;
		logoUrl?: string;
	};
	company?: {
		name?: string;
		addressLine1?: string;
		addressLine2?: string;
		addressCity?: string;
		addressState?: string;
		addressZip?: string;
	};
	contactEmail?: string;
	contactPhone?: string;
	lineItems?: DocumentLineItem[];
	terms?: Array<string | { text: string }>;
	payments?: DocumentPayment[];
}

interface DocumentViewerProps {
	type: "quote" | "invoice";
	data: DocumentData;
}

export function DocumentViewer({ type, data }: DocumentViewerProps) {
	const printRef = useRef<HTMLDivElement>(null);

	const handlePrint = useReactToPrint({
		contentRef: printRef,
		documentTitle: `${type === "quote" ? "Quote" : "Invoice"}_${data.quoteNumber || data.invoiceNumber}`,
	});

	const numberStr = data.quoteNumber || data.invoiceNumber;
	const formattedNumber =
		data.version && data.version > 1
			? `${numberStr}-v${data.version}`
			: numberStr;

	const issueDate = data.date || data.createdAt;
	const dueDate = data.dueDate;

	const items = Array.isArray(data.lineItems) ? data.lineItems : [];

	const [signedState, setSignedState] = useState<{
		signatureData: string;
		signatureName: string;
	} | null>(null);

	const isSigned =
		data.status === "ACCEPTED" ||
		data.status === "SIGNED" ||
		!!signedState ||
		!!data.signedAt;

	const effectiveSignature =
		signedState?.signatureData || data.signatureData;
	const effectiveSignerName =
		signedState?.signatureName || data.signatureName;

	const totalFormatted = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format((data.totalAmount || 0) / 100);

	return (
		<div className="mx-auto my-8 max-w-4xl">
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div>
					{isSigned && (
						<Badge className="gap-1.5 bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700 text-xs font-semibold">
							<CheckCircle2 className="h-3.5 w-3.5" />
							Proposal Accepted & Digitally Signed
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-3">
					{type === "quote" && !isSigned && data.id && (
						<QuoteSignDialog
							quoteId={data.id}
							quoteNumber={data.quoteNumber}
							totalAmountFormatted={totalFormatted}
							onSigned={(sig, name) => setSignedState({ signatureData: sig, signatureName: name })}
						/>
					)}
					<Button onClick={handlePrint} variant="outline">
						<Printer className="mr-2 h-4 w-4" />
						Print / Save PDF
					</Button>
				</div>
			</div>

			<div
				className="min-h-[1056px] rounded-lg border bg-white p-12 text-black shadow-sm print:m-0 print:border-none print:p-0 print:shadow-none"
				ref={printRef}
				style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}
			>
				<div className="mb-12 flex items-start justify-between">
					<div>
						{data.organization?.logoUrl ? (
							// biome-ignore lint/performance/noImgElement: dynamic user-uploaded branding logo
							<img
								alt="Logo"
								className="h-16 object-contain"
								src={data.organization.logoUrl}
							/>
						) : (
							<h2 className="font-bold text-2xl">
								{data.organization?.name || "Company Name"}
							</h2>
						)}
					</div>
					<div className="text-right">
						<h1 className="mb-2 font-light text-4xl text-slate-400 uppercase tracking-wider">
							{type === "quote" ? "Quote" : "Invoice"}
						</h1>
						<p className="font-semibold text-lg">{formattedNumber}</p>
					</div>
				</div>

				<div className="mb-12 grid grid-cols-2 gap-12">
					<div>
						<h3 className="mb-3 font-semibold text-slate-400 text-sm uppercase tracking-wider">
							Bill To
						</h3>
						<div className="space-y-1 text-sm">
							<p className="font-semibold text-base">
								{data.company?.name || "No Client"}
							</p>
							{data.company?.addressLine1 && <p>{data.company.addressLine1}</p>}
							{data.company?.addressLine2 && <p>{data.company.addressLine2}</p>}
							{data.company?.addressCity && (
								<p>
									{data.company.addressCity}, {data.company.addressState}{" "}
									{data.company.addressZip}
								</p>
							)}
							{data.contactEmail && (
								<p className="mt-2 text-slate-600">{data.contactEmail}</p>
							)}
							{data.contactPhone && (
								<p className="text-slate-600">{data.contactPhone}</p>
							)}
						</div>
					</div>
					<div className="space-y-3 text-right">
						<div className="grid grid-cols-2 gap-4">
							<div className="text-slate-400 text-sm">Issue Date</div>
							<div className="font-medium text-sm">
								{issueDate ? format(new Date(issueDate), "MMM d, yyyy") : "-"}
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="text-slate-400 text-sm">Due Date</div>
							<div className="font-medium text-sm">
								{dueDate ? format(new Date(dueDate), "MMM d, yyyy") : "-"}
							</div>
						</div>
						{type === "invoice" && data.status === "PAID" && (
							<div className="mt-4 inline-block rounded border border-green-200 bg-green-100 px-4 py-1 font-bold text-green-700 text-sm uppercase tracking-wider">
								Paid
							</div>
						)}
					</div>
				</div>

				<table className="mb-8 w-full text-sm">
					<thead>
						<tr className="border-slate-200 border-b-2 text-slate-500">
							<th className="py-3 text-left font-semibold">Description</th>
							<th className="w-24 py-3 text-right font-semibold">Qty</th>
							<th className="w-32 py-3 text-right font-semibold">Unit Price</th>
							<th className="w-32 py-3 text-right font-semibold">Total</th>
						</tr>
					</thead>
					<tbody>
						{items.map((item, idx) => (
							<tr
								className="border-slate-100 border-b"
								key={item.id || `${item.name}-${idx}`}
							>
								<td className="py-4">
									<p className="font-medium">{item.name}</p>
									{item.description && (
										<p className="mt-1 text-slate-500 text-xs">
											{item.description}
										</p>
									)}
								</td>
								<td className="py-4 text-right">{item.quantity}</td>
								<td className="py-4 text-right">
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: "USD",
									}).format(item.unitPrice / 100)}
								</td>
								<td className="py-4 text-right font-medium">
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: "USD",
									}).format(item.amount / 100)}
								</td>
							</tr>
						))}
						{items.length === 0 && (
							<tr>
								<td className="py-8 text-center text-slate-400" colSpan={4}>
									No line items found.
								</td>
							</tr>
						)}
					</tbody>
				</table>

				<div className="mb-12 flex justify-end">
					<div className="w-72 space-y-3">
						<div className="flex justify-between text-slate-600 text-sm">
							<span>Subtotal</span>
							<span>
								{new Intl.NumberFormat("en-US", {
									style: "currency",
									currency: "USD",
								}).format((data.subtotal || data.totalAmount || 0) / 100)}
							</span>
						</div>
						{data.taxAmount && data.taxAmount > 0 && (
							<div className="flex justify-between text-slate-600 text-sm">
								<span>Tax ({data.taxPercent}%)</span>
								<span>
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: "USD",
									}).format(data.taxAmount / 100)}
								</span>
							</div>
						)}
						<div className="flex justify-between border-t pt-3 font-bold text-lg">
							<span>Total</span>
							<span>
								{new Intl.NumberFormat("en-US", {
									style: "currency",
									currency: "USD",
								}).format((data.totalAmount || 0) / 100)}
							</span>
						</div>
						{type === "invoice" &&
							data.amountPaid !== undefined &&
							data.amountPaid > 0 && (
								<>
									<div className="flex justify-between pt-2 text-green-600 text-sm">
										<span>Amount Paid</span>
										<span>
											-
											{new Intl.NumberFormat("en-US", {
												style: "currency",
												currency: "USD",
											}).format(data.amountPaid / 100)}
										</span>
									</div>
									<div className="flex justify-between border-t pt-2 font-bold text-base">
										<span>Balance Due</span>
										<span>
											{new Intl.NumberFormat("en-US", {
												style: "currency",
												currency: "USD",
											}).format((data.balanceDue ?? 0) / 100)}
										</span>
									</div>
								</>
							)}
					</div>
				</div>

				{data.notes && (
					<div className="mb-8">
						<h4 className="mb-2 font-semibold text-slate-400 text-sm uppercase tracking-wider">
							Notes
						</h4>
						<div className="whitespace-pre-wrap text-slate-700 text-sm">
							{data.notes}
						</div>
					</div>
				)}

				{Array.isArray(data.terms) && data.terms.length > 0 && (
					<div className="mb-8">
						<h4 className="mb-2 font-semibold text-slate-400 text-sm uppercase tracking-wider">
							Terms & Conditions
						</h4>
						<ul className="list-inside list-disc space-y-1 text-slate-600 text-sm">
							{data.terms.map((term, idx) => {
								const termText = typeof term === "string" ? term : term.text;
								return (
									<li
										key={
											typeof term === "string" ? term : `${term.text}-${idx}`
										}
									>
										{termText}
									</li>
								);
							})}
						</ul>
					</div>
				)}

				{type === "invoice" && data.payments && data.payments.length > 0 && (
					<div className="mb-8">
						<h4 className="mb-4 font-semibold text-slate-400 text-sm uppercase tracking-wider">
							Payment History
						</h4>
						<div className="overflow-hidden rounded-md border">
							<table className="w-full text-left text-sm">
								<thead className="border-b bg-slate-50 text-slate-500">
									<tr>
										<th className="px-4 py-2 font-medium">Date</th>
										<th className="px-4 py-2 font-medium">Method</th>
										<th className="px-4 py-2 text-right font-medium">Amount</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									{data.payments.map((p) => (
										<tr key={p.id}>
											<td className="px-4 py-2">
												{new Date(p.paymentDate).toLocaleDateString()}
											</td>
											<td className="px-4 py-2">
												{p.paymentMethod.replace("_", " ")}
											</td>
											<td className="px-4 py-2 text-right font-medium text-slate-700">
												{new Intl.NumberFormat("en-US", {
													style: "currency",
													currency: "USD",
												}).format(p.amount / 100)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{effectiveSignature && (
					<div className="mt-16 inline-block border-t pt-8 pr-16">
						{/* biome-ignore lint/performance/noImgElement: dynamic user-uploaded signature */}
						<img
							alt="Signature"
							className="mb-2 h-16 object-contain"
							src={effectiveSignature}
						/>
						<div className="font-medium text-sm">
							{effectiveSignerName || "Authorized Signature"}
						</div>
						{isSigned && (
							<div className="mt-1 text-xs text-muted-foreground">
								Digitally Signed & Verified
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
