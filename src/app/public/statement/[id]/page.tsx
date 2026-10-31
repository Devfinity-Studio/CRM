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
			<div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
				Loading Statement...
			</div>
		);
	}

	if (error || !stmt) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-100">
				<div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
					<h2 className="mb-2 font-bold text-slate-800 text-xl">
						Statement Not Found
					</h2>
					<p className="text-slate-500">
						The statement you are looking for does not exist or you do not have
						permission to view it.
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
		<div className="flex min-h-screen flex-col items-center bg-slate-100 pb-24">
			{/* Floating Action Bar (Hidden when printing) */}
			<div className="sticky top-4 z-10 mb-8 flex w-full max-w-4xl justify-end gap-2 px-4 print:hidden">
				<Button className="shadow-lg" onClick={() => handlePrint()}>
					<Download className="mr-2 h-4 w-4" /> Download PDF
				</Button>
			</div>

			{/* A4 Canvas */}
			<div
				className="relative min-h-[1056px] w-full max-w-[800px] bg-white p-10 text-slate-800 shadow-sm sm:rounded-md sm:p-16 print:p-0 print:shadow-none"
				ref={contentRef}
			>
				{/* Header */}
				<div className="mb-16 flex items-start justify-between">
					<div>
						{/* Organization Info */}
						<h1 className="font-bold text-2xl text-slate-900">
							{stmt.organization?.name || "Company"}
						</h1>
						<p className="mt-1 whitespace-pre-wrap text-slate-500">
							{stmt.organization?.address}
						</p>
					</div>
					<div className="text-right">
						<h2 className="mb-4 font-bold text-3xl text-slate-200 uppercase tracking-widest">
							Statement
						</h2>
						<p className="font-semibold text-slate-900 text-sm">
							{stmt.statementNumber}
						</p>
						<p className="mt-1 text-slate-500 text-sm">
							{format(new Date(stmt.startDate), "MMM d, yyyy")} -{" "}
							{format(new Date(stmt.endDate), "MMM d, yyyy")}
						</p>
					</div>
				</div>

				{/* Bill To */}
				<div className="mb-12">
					<h3 className="mb-2 font-semibold text-slate-400 text-sm uppercase tracking-wider">
						Statement For
					</h3>
					<p className="font-bold text-slate-900">{stmt.company?.name}</p>
				</div>

				{/* Account Summary */}
				<div className="mb-12 flex items-center justify-between rounded-lg bg-slate-50 p-6">
					<div>
						<p className="mb-1 text-slate-500 text-sm">Opening Balance</p>
						<p className="font-semibold text-lg">
							{formatCurrency(stmt.openingBalance)}
						</p>
					</div>
					<div className="text-center">
						<p className="mb-1 text-slate-500 text-sm">Invoiced</p>
						<p className="font-semibold text-lg">
							{formatCurrency(
								(stmt.transactions as any[]).reduce(
									(sum, t) => (t.type === "INVOICE" ? sum + t.amount : sum),
									0,
								),
							)}
						</p>
					</div>
					<div className="text-center">
						<p className="mb-1 text-slate-500 text-sm">Paid</p>
						<p className="font-semibold text-lg">
							{formatCurrency(
								(stmt.transactions as any[]).reduce(
									(sum, t) =>
										t.type === "PAYMENT" ? sum + Math.abs(t.amount) : sum,
									0,
								),
							)}
						</p>
					</div>
					<div className="text-right">
						<p className="mb-1 font-bold text-slate-700 text-sm">
							Closing Balance
						</p>
						<p className="font-bold text-2xl text-slate-900">
							{formatCurrency(stmt.closingBalance)}
						</p>
					</div>
				</div>

				{/* Transactions Table */}
				<div className="mb-8">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-slate-200 border-b-2">
								<th className="py-3 text-left font-semibold text-slate-600">
									Date
								</th>
								<th className="py-3 text-left font-semibold text-slate-600">
									Description
								</th>
								<th className="py-3 text-right font-semibold text-slate-600">
									Amount
								</th>
								<th className="py-3 text-right font-semibold text-slate-600">
									Balance
								</th>
							</tr>
						</thead>
						<tbody className="divide-y border-slate-200 border-b text-slate-700">
							<tr className="bg-slate-50/50">
								<td className="py-3 font-medium text-slate-500">
									{format(new Date(stmt.startDate), "MMM d, yyyy")}
								</td>
								<td className="py-3 font-medium text-slate-500">
									Opening Balance
								</td>
								<td className="py-3"></td>
								<td className="py-3 text-right font-semibold">
									{formatCurrency(stmt.openingBalance)}
								</td>
							</tr>

							{(stmt.transactions as any[]).map((tx, idx) => (
								<tr key={`${tx.id}-${idx}`}>
									<td className="py-3">
										{format(new Date(tx.date), "MMM d, yyyy")}
									</td>
									<td className="py-3">
										<span className="font-medium">{tx.description}</span>
										{tx.reference && (
											<span className="ml-2 text-slate-400 text-xs">
												({tx.reference})
											</span>
										)}
									</td>
									<td
										className={`py-3 text-right ${tx.type === "PAYMENT" ? "text-green-600" : ""}`}
									>
										{tx.type === "PAYMENT" ? "-" : ""}
										{formatCurrency(Math.abs(tx.amount))}
									</td>
									<td className="py-3 text-right font-medium">
										{formatCurrency(tx.balance)}
									</td>
								</tr>
							))}

							<tr className="border-slate-200 border-t-2 bg-slate-50/50">
								<td className="py-3 font-medium text-slate-900">
									{format(new Date(stmt.endDate), "MMM d, yyyy")}
								</td>
								<td className="py-3 font-medium text-slate-900">
									Closing Balance
								</td>
								<td className="py-3"></td>
								<td className="py-3 text-right font-bold text-slate-900">
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
