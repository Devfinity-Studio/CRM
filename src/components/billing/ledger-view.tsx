"use client";

import {
	format,
	startOfMonth,
	startOfQuarter,
	startOfYear,
	subDays,
} from "date-fns";
import {
	ArrowDownLeft,
	ArrowUpRight,
	Copy,
	ExternalLink,
	History,
	Loader2,
	Plus,
	Scale,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

interface LedgerTransaction {
	id: string;
	type: string;
	date: Date | string;
	description: string;
	amount: number;
	isDebit: boolean;
	balance: number;
}

export function LedgerView({ companyId }: { companyId: string }) {
	const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
	const [endDate, setEndDate] = useState<Date>(new Date());

	const {
		data: ledger,
		isLoading,
		refetch,
	} = api.billing.getLedger.useQuery({
		companyId,
		startDate,
		endDate,
	});

	const { data: statements, refetch: refetchStatements } =
		api.billing.getStatementsByCompany.useQuery({
			companyId,
		});

	const generateMutation = api.billing.generateStatement.useMutation({
		onSuccess: () => {
			toast.success("Statement snapshot generated successfully.");
			refetch();
			refetchStatements();
		},
		onError: (err) => {
			toast.error(`Error generating statement: ${err.message}`);
		},
	});

	const handleGenerate = () => {
		generateMutation.mutate({ companyId, startDate, endDate });
	};

	// Calculate summary metrics for the active date range
	const summary = useMemo(() => {
		if (!ledger) {
			return {
				totalDebits: 0,
				totalCredits: 0,
			};
		}

		let totalDebits = 0;
		let totalCredits = 0;

		for (const t of (ledger.transactions as LedgerTransaction[]) || []) {
			if (t.isDebit) {
				totalDebits += t.amount;
			} else {
				totalCredits += t.amount;
			}
		}

		return {
			totalDebits,
			totalCredits,
		};
	}, [ledger]);

	const formatCurrency = (cents: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			maximumFractionDigits: 0,
		}).format(cents / 100);
	};

	const formatCurrencyExact = (cents: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(cents / 100);
	};

	return (
		<div className="space-y-6">
			{/* Date Filters & Statement Action */}
			<div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm md:flex-row md:items-center md:justify-between">
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex items-center gap-2">
						<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
							From:
						</span>
						<input
							className="h-8 rounded-lg border border-input bg-background/50 px-2.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
							onChange={(e) => {
								if (e.target.value) {
									setStartDate(new Date(e.target.value));
								}
							}}
							type="date"
							value={format(startDate, "yyyy-MM-dd")}
						/>
					</div>
					<div className="flex items-center gap-2">
						<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
							To:
						</span>
						<input
							className="h-8 rounded-lg border border-input bg-background/50 px-2.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
							onChange={(e) => {
								if (e.target.value) {
									setEndDate(new Date(e.target.value));
								}
							}}
							type="date"
							value={format(endDate, "yyyy-MM-dd")}
						/>
					</div>

					{/* Quick Presets */}
					<div className="flex items-center gap-1 border-border/60 border-l pl-3">
						<Button
							className="h-7 rounded-full px-2.5 text-xs"
							onClick={() => {
								setStartDate(startOfMonth(new Date()));
								setEndDate(new Date());
							}}
							size="sm"
							variant="ghost"
						>
							This Month
						</Button>
						<Button
							className="h-7 rounded-full px-2.5 text-xs"
							onClick={() => {
								setStartDate(startOfQuarter(new Date()));
								setEndDate(new Date());
							}}
							size="sm"
							variant="ghost"
						>
							This Quarter
						</Button>
						<Button
							className="h-7 rounded-full px-2.5 text-xs"
							onClick={() => {
								setStartDate(startOfYear(new Date()));
								setEndDate(new Date());
							}}
							size="sm"
							variant="ghost"
						>
							YTD
						</Button>
						<Button
							className="h-7 rounded-full px-2.5 text-xs"
							onClick={() => {
								setStartDate(subDays(new Date(), 30));
								setEndDate(new Date());
							}}
							size="sm"
							variant="ghost"
						>
							Last 30d
						</Button>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						className="h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs shadow-indigo-500/20 shadow-sm hover:from-indigo-600 hover:to-indigo-700"
						disabled={generateMutation.isPending || isLoading}
						onClick={handleGenerate}
						size="sm"
					>
						{generateMutation.isPending ? (
							<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
						) : (
							<Plus className="mr-1.5 h-3.5 w-3.5" />
						)}
						Generate Snapshot
					</Button>
				</div>
			</div>

			{/* Running Balance Summary Scorecards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{/* Opening Balance */}
				<Card className="border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:border-indigo-500/20">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
							Opening Balance
						</CardTitle>
						<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-muted/60 text-muted-foreground">
							<History className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent className="space-y-1">
						<div className="font-bold font-mono text-2xl tracking-tight">
							{isLoading ? "—" : formatCurrency(ledger?.openingBalance ?? 0)}
						</div>
						<p className="text-muted-foreground text-xs">
							As of {format(startDate, "MMM d, yyyy")}
						</p>
					</CardContent>
				</Card>

				{/* Total Invoiced (Debits) */}
				<Card className="border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:border-indigo-500/30">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
							Invoiced (Debits)
						</CardTitle>
						<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-500">
							<ArrowUpRight className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent className="space-y-1">
						<div className="font-bold font-mono text-2xl text-indigo-500 tracking-tight">
							{isLoading ? "—" : formatCurrency(summary.totalDebits)}
						</div>
						<p className="text-muted-foreground text-xs">
							Total billed in selected period
						</p>
					</CardContent>
				</Card>

				{/* Total Paid (Credits) */}
				<Card className="border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:border-emerald-500/30">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
							Payments (Credits)
						</CardTitle>
						<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
							<ArrowDownLeft className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent className="space-y-1">
						<div className="font-bold font-mono text-2xl text-emerald-500 tracking-tight">
							{isLoading ? "—" : formatCurrency(summary.totalCredits)}
						</div>
						<p className="text-muted-foreground text-xs">
							Total payments settled
						</p>
					</CardContent>
				</Card>

				{/* Net Closing Balance */}
				<Card className="border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:border-indigo-500/30">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
							Closing Balance
						</CardTitle>
						<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-500">
							<Scale className="h-4 w-4" />
						</div>
					</CardHeader>
					<CardContent className="space-y-1">
						<div className="font-bold font-mono text-2xl tracking-tight">
							{isLoading ? "—" : formatCurrency(ledger?.closingBalance ?? 0)}
						</div>
						<p className="text-muted-foreground text-xs">
							Net balance through {format(endDate, "MMM d, yyyy")}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Ledger Transactions Table */}
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="font-semibold text-base text-foreground">
							Transaction Ledger
						</h3>
						<p className="text-muted-foreground text-xs">
							Detailed chronology of invoices and payments affecting this
							client.
						</p>
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
					{isLoading ? (
						<div className="p-12 text-center text-muted-foreground text-sm">
							<div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
							Loading ledger transactions...
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-muted/30">
									<TableRow className="border-border/60 hover:bg-transparent">
										<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Date
										</TableHead>
										<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Type & Description
										</TableHead>
										<TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Debit (+)
										</TableHead>
										<TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Credit (-)
										</TableHead>
										<TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Running Balance
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{/* Opening Balance Row */}
									<TableRow className="border-border/40 bg-muted/20 font-medium">
										<TableCell className="text-muted-foreground text-xs">
											{format(startDate, "MMM d, yyyy")}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											<span className="font-medium text-foreground">
												Opening Balance
											</span>
										</TableCell>
										<TableCell className="text-right font-mono text-muted-foreground text-xs">
											—
										</TableCell>
										<TableCell className="text-right font-mono text-muted-foreground text-xs">
											—
										</TableCell>
										<TableCell className="text-right font-mono font-semibold text-foreground text-sm">
											{formatCurrencyExact(ledger?.openingBalance ?? 0)}
										</TableCell>
									</TableRow>

									{/* Transactions List */}
									{((ledger?.transactions as LedgerTransaction[]) || []).map(
										(t) => (
											<TableRow
												className="border-border/40 transition-colors hover:bg-muted/20"
												key={t.id}
											>
												<TableCell className="text-muted-foreground text-xs">
													{t.date
														? format(new Date(t.date), "MMM d, yyyy")
														: "—"}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<span
															className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium text-[10px] ${
																t.isDebit
																	? "border-indigo-500/20 bg-indigo-500/10 text-indigo-500"
																	: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
															}`}
														>
															{t.type}
														</span>
														<span className="text-foreground text-sm">
															{t.description}
														</span>
													</div>
												</TableCell>
												<TableCell className="text-right font-mono text-foreground text-sm">
													{t.isDebit ? formatCurrencyExact(t.amount) : "—"}
												</TableCell>
												<TableCell className="text-right font-mono text-emerald-500 text-sm">
													{!t.isDebit ? formatCurrencyExact(t.amount) : "—"}
												</TableCell>
												<TableCell className="text-right font-medium font-mono text-foreground text-sm">
													{formatCurrencyExact(t.balance)}
												</TableCell>
											</TableRow>
										),
									)}

									{(!ledger?.transactions ||
										ledger.transactions.length === 0) && (
										<TableRow>
											<TableCell
												className="py-8 text-center text-muted-foreground text-xs"
												colSpan={5}
											>
												No transactions recorded during this period.
											</TableCell>
										</TableRow>
									)}

									{/* Closing Balance Row */}
									<TableRow className="border-border/60 bg-muted/40 font-semibold">
										<TableCell className="text-foreground text-xs">
											{format(endDate, "MMM d, yyyy")}
										</TableCell>
										<TableCell className="text-foreground text-sm">
											Closing Balance
										</TableCell>
										<TableCell className="text-right font-mono text-muted-foreground text-xs">
											—
										</TableCell>
										<TableCell className="text-right font-mono text-muted-foreground text-xs">
											—
										</TableCell>
										<TableCell className="text-right font-bold font-mono text-foreground text-sm">
											{formatCurrencyExact(ledger?.closingBalance ?? 0)}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</div>

			{/* Generated Statements Snapshot Section */}
			<div className="space-y-3 pt-2">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="font-semibold text-base text-foreground">
							Historical Statement Snapshots
						</h3>
						<p className="text-muted-foreground text-xs">
							Frozen balance snapshots generated for client distribution.
						</p>
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
					<Table>
						<TableHeader className="bg-muted/30">
							<TableRow className="border-border/60 hover:bg-transparent">
								<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Statement #
								</TableHead>
								<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Statement Period
								</TableHead>
								<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Generated On
								</TableHead>
								<TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Closing Balance
								</TableHead>
								<TableHead className="w-[120px] text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{statements && statements.length > 0 ? (
								statements.map((s) => (
									<TableRow
										className="border-border/40 transition-colors hover:bg-muted/20"
										key={s.id}
									>
										<TableCell className="font-medium font-mono text-foreground text-sm">
											{s.statementNumber}
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">
											{s.startDate
												? format(new Date(s.startDate), "MMM d, yyyy")
												: "—"}{" "}
											–{" "}
											{s.endDate
												? format(new Date(s.endDate), "MMM d, yyyy")
												: "—"}
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">
											{s.createdAt
												? format(new Date(s.createdAt), "MMM d, yyyy")
												: "—"}
										</TableCell>
										<TableCell className="text-right font-mono font-semibold text-foreground text-sm">
											{formatCurrencyExact(s.closingBalance || 0)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-1">
												<Button
													className="h-8 px-2 text-muted-foreground hover:text-foreground"
													onClick={() => {
														navigator.clipboard.writeText(
															`${window.location.origin}/public/statement/${s.id}`,
														);
														toast.success(
															"Public statement link copied to clipboard",
														);
													}}
													size="sm"
													title="Copy public link"
													variant="ghost"
												>
													<Copy className="h-3.5 w-3.5" />
													<span className="sr-only">Copy Link</span>
												</Button>
												<Button
													className="h-8 px-2 text-indigo-500 hover:text-indigo-600"
													onClick={() =>
														window.open(`/public/statement/${s.id}`, "_blank")
													}
													size="sm"
													title="View statement"
													variant="ghost"
												>
													<ExternalLink className="h-3.5 w-3.5" />
													<span className="sr-only">View</span>
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										className="py-8 text-center text-muted-foreground text-xs"
										colSpan={5}
									>
										No statement snapshots generated yet for this client.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
