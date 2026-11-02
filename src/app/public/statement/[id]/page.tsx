"use client";

import { format } from "date-fns";
import { Download, Printer } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export default function PublicStatementPage() {
	const params = useParams();
	const statementId = params.id as string;
	const contentRef = useRef<HTMLDivElement>(null);

	const {
		data: stmt,
		isLoading,
		error,
	} = api.public.getPublicStatement.useQuery(
		{ id: statementId },
		{
			retry: false,
		},
	);

	const handlePrint = useReactToPrint({
		contentRef: contentRef,
		documentTitle: stmt ? `Statement_${stmt.statementNumber}` : "Statement",
	});

	if (isLoading) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground text-xs">
				Loading Statement...
			</div>
		);
	}

	if (error || !stmt) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-background p-4">
				<div className="max-w-md rounded-2xl border border-border/70 bg-card/85 p-8 text-center shadow-sm">
					<h2 className="mb-2 font-bold text-foreground text-lg">
						Statement Not Found
					</h2>
					<p className="text-muted-foreground text-xs">
						The statement you are looking for does not exist or you do not have permission to view it.
					</p>
				</div>
			</div>
		);
	}

	const currency = stmt.organization?.currency || "USD";
	const formatCurrency = (cents: number) =>
		new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
			cents / 100,
		);

	return (
		<div className="flex min-h-dvh flex-col items-center bg-background p-4 sm:p-8 pb-24 text-foreground">
			{/* Floating Action Bar (Hidden when printing) */}
			<div className="sticky top-4 z-20 mb-6 flex w-full max-w-4xl justify-end gap-2 px-2 print:hidden">
				<Button className="shadow-lg min-h-[44px] sm:min-h-9 rounded-xl" onClick={() => handlePrint()}>
					<Download className="mr-2 h-4 w-4" /> Download PDF / Print
				</Button>
			</div>

			{/* A4 Canvas */}
			<div
				className="relative min-h-[1056px] w-full max-w-[800px] rounded-3xl border border-border/70 bg-card p-6 sm:p-12 text-card-foreground shadow-sm print:m-0 print:max-w-none print:rounded-none print:border-none print:bg-white print:p-0 print:text-black print:shadow-none"
				ref={contentRef}
			>
				{/* Header */}
				<div className="mb-12 flex flex-col sm:flex-row items-start justify-between gap-6">
					<div>
						{/* Organization Info */}
						<h1 className="font-bold text-2xl text-foreground print:text-black">
							{stmt.organization?.name || "Company"}
						</h1>
						<p className="mt-1 whitespace-pre-wrap text-muted-foreground text-xs print:text-gray-600">
							{stmt.organization?.address}
						</p>
					</div>
					<div className="text-left sm:text-right">
						<h2 className="mb-2 font-bold text-2xl uppercase tracking-widest text-primary print:text-black">
							Statement
						</h2>
						<p className="font-semibold text-foreground text-sm font-mono print:text-black">
							{stmt.statementNumber}
						</p>
						<p className="mt-1 text-muted-foreground text-xs print:text-gray-600">
							{format(new Date(stmt.startDate), "MMM d, yyyy")} –{" "}
							{format(new Date(stmt.endDate), "MMM d, yyyy")}
						</p>
					</div>
				</div>

				{/* Bill To */}
				<div className="mb-8">
					<h3 className="mb-1 font-semibold text-muted-foreground text-xs uppercase tracking-wider print:text-gray-600">
						Statement For
					</h3>
					<p className="font-bold text-foreground text-base print:text-black">{stmt.company?.name}</p>
				</div>

				{/* Account Summary */}
				<div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4 rounded-2xl border border-border/70 bg-muted/40 p-5 print:border-gray-300 print:bg-gray-100">
					<div>
						<p className="mb-1 text-muted-foreground text-xs print:text-gray-600">Opening Balance</p>
						<p className="font-semibold font-mono text-base print:text-black">
							{formatCurrency(stmt.openingBalance)}
						</p>
					</div>
					<div>
						<p className="mb-1 text-muted-foreground text-xs print:text-gray-600">Invoiced</p>
						<p className="font-semibold font-mono text-base text-primary print:text-black">
							{formatCurrency(
								(stmt.transactions as any[]).reduce(
									(sum, t) => (t.type === "INVOICE" ? sum + t.amount : sum),
									0,
								),
							)}
						</p>
					</div>
					<div>
						<p className="mb-1 text-muted-foreground text-xs print:text-gray-600">Paid</p>
						<p className="font-semibold font-mono text-base text-emerald-500 print:text-black">
							{formatCurrency(
								(stmt.transactions as any[]).reduce(
									(sum, t) =>
										t.type === "PAYMENT" ? sum + Math.abs(t.amount) : sum,
									0,
								),
							)}
						</p>
					</div>
					<div>
						<p className="mb-1 font-bold text-muted-foreground text-xs uppercase tracking-wider print:text-gray-600">
							Closing Balance
						</p>
						<p className="font-bold font-mono text-lg text-foreground print:text-black">
							{formatCurrency(stmt.closingBalance)}
						</p>
					</div>
				</div>

				{/* Transactions Table */}
				<div className="mb-8 overflow-x-auto">
					<table className="w-full text-xs">
						<thead>
							<tr className="border-b border-border/70 print:border-gray-300">
								<th className="py-2.5 text-left font-semibold text-muted-foreground uppercase print:text-gray-600">
									Date
								</th>
								<th className="py-2.5 text-left font-semibold text-muted-foreground uppercase print:text-gray-600">
									Description
								</th>
								<th className="py-2.5 text-right font-semibold text-muted-foreground uppercase print:text-gray-600">
									Amount
								</th>
								<th className="py-2.5 text-right font-semibold text-muted-foreground uppercase print:text-gray-600">
									Balance
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/60 border-b border-border/70 text-foreground print:divide-gray-200 print:border-gray-300 print:text-black">
							<tr className="bg-muted/20">
								<td className="py-2.5 font-medium text-muted-foreground">
									{format(new Date(stmt.startDate), "MMM d, yyyy")}
								</td>
								<td className="py-2.5 font-medium text-muted-foreground">
									Opening Balance
								</td>
								<td className="py-2.5"></td>
								<td className="py-2.5 text-right font-semibold font-mono">
									{formatCurrency(stmt.openingBalance)}
								</td>
							</tr>

							{(stmt.transactions as any[]).map((tx, idx) => (
								<tr key={`${tx.id}-${idx}`}>
									<td className="py-2.5 font-mono text-muted-foreground">
										{format(new Date(tx.date), "MMM d, yyyy")}
									</td>
									<td className="py-2.5">
										<span className="font-medium text-foreground print:text-black">{tx.description}</span>
										{tx.reference && (
											<span className="ml-2 text-muted-foreground text-[11px] print:text-gray-500">
												({tx.reference})
											</span>
										)}
									</td>
									<td
										className={`py-2.5 text-right font-mono font-medium ${tx.type === "PAYMENT" ? "text-emerald-500 print:text-black" : "text-foreground print:text-black"}`}
									>
										{tx.type === "PAYMENT" ? "-" : ""}
										{formatCurrency(Math.abs(tx.amount))}
									</td>
									<td className="py-2.5 text-right font-medium font-mono text-foreground print:text-black">
										{formatCurrency(tx.balance)}
									</td>
								</tr>
							))}

							<tr className="border-t-2 border-border/80 bg-muted/30 font-bold print:border-gray-400 print:bg-gray-100">
								<td className="py-3 font-medium text-foreground print:text-black">
									{format(new Date(stmt.endDate), "MMM d, yyyy")}
								</td>
								<td className="py-3 font-medium text-foreground print:text-black">
									Closing Balance
								</td>
								<td className="py-3"></td>
								<td className="py-3 text-right font-mono text-foreground print:text-black">
									{formatCurrency(stmt.closingBalance)}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
