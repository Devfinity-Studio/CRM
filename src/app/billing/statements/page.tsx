"use client";

import { format } from "date-fns";
import {
	BookOpen,
	Copy,
	ExternalLink,
	FileText,
	Plus,
	Search,
	Users,
	Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GenerateStatementDialog } from "~/components/billing/generate-statement-dialog";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export default function StatementsListPage() {
	const {
		data: statements,
		isLoading,
		refetch,
	} = api.billing.getStatements.useQuery();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const copyPublicLink = (id: string) => {
		const url = `${window.location.origin}/public/statement/${id}`;
		navigator.clipboard.writeText(url);
		toast.success("Public statement link copied to clipboard!");
	};

	// Calculate summary metrics
	const metrics = useMemo(() => {
		if (!statements) {
			return {
				totalCount: 0,
				uniqueClients: 0,
				totalBalance: 0,
			};
		}

		const clientsSet = new Set<string>();
		let totalBalance = 0;

		for (const s of statements) {
			if (s.companyId) {
				clientsSet.add(s.companyId);
			}
			totalBalance += s.closingBalance || 0;
		}

		return {
			totalCount: statements.length,
			uniqueClients: clientsSet.size,
			totalBalance,
		};
	}, [statements]);

	// Filter statements by search
	const filteredStatements = useMemo(() => {
		if (!statements) return [];
		if (!searchQuery.trim()) return statements;

		const q = searchQuery.toLowerCase();
		return statements.filter(
			(s) =>
				s.statementNumber?.toLowerCase().includes(q) ||
				s.company?.name?.toLowerCase().includes(q),
		);
	}, [statements, searchQuery]);

	const formatCurrency = (cents: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			maximumFractionDigits: 0,
		}).format(cents / 100);
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
									Ledger Snapshots
								</span>
								<span className="text-muted-foreground text-xs">
									Billing History & Reconciliations
								</span>
							</div>
							<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Account Statements
							</h1>
							<p className="text-muted-foreground text-xs sm:text-sm">
								Generate, review, and share client balance statements and frozen transaction ledgers.
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Button
								className="gap-2 rounded-xl min-h-[44px] sm:min-h-0"
								onClick={() => setDialogOpen(true)}
							>
								<Plus className="h-4 w-4" />
								<span>Generate Statement</span>
							</Button>
						</div>
					</div>

					{/* Scorecard Metrics */}
					<div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
						<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
							<span className="font-medium text-muted-foreground text-xs">
								Statements Generated
							</span>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className="font-bold text-foreground text-xl tabular-nums tracking-tight sm:text-2xl">
									{isLoading ? "—" : metrics.totalCount}
								</span>
								<span className="text-[11px] text-muted-foreground">
									snapshots
								</span>
							</div>
						</div>

						<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
							<span className="font-medium text-muted-foreground text-xs">
								Clients Covered
							</span>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className="font-bold text-sky-500 text-xl tabular-nums tracking-tight sm:text-2xl">
									{isLoading ? "—" : metrics.uniqueClients}
								</span>
								<span className="text-[11px] text-muted-foreground">
									enterprises
								</span>
							</div>
						</div>

						<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
							<span className="font-medium text-muted-foreground text-xs">
								Total Statement Balances
							</span>
							<div className="mt-1 flex items-baseline gap-1.5">
								<span className="font-bold text-emerald-500 text-xl tabular-nums tracking-tight sm:text-2xl">
									{isLoading ? "—" : formatCurrency(metrics.totalBalance)}
								</span>
								<span className="text-[11px] text-emerald-500 font-medium">
									combined
								</span>
							</div>
						</div>
					</div>
				</section>

				{/* Search Bar & Table Container */}
				<div className="rounded-3xl border border-border/70 bg-card/75 p-4 sm:p-6 shadow-sm backdrop-blur-md">
					<div className="mb-4 flex items-center justify-between">
						<div className="relative w-full max-w-sm">
							<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								className="h-10 rounded-xl pl-9 text-xs sm:text-sm"
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search by statement # or client..."
								value={searchQuery}
							/>
						</div>
					</div>

					{isLoading ? (
						<div className="p-12 text-center text-muted-foreground text-sm">
							<div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
							Loading statements...
						</div>
					) : filteredStatements.length === 0 ? (
						<div className="p-12 text-center">
							<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border border-dashed text-muted-foreground">
								<FileText className="h-6 w-6" />
							</div>
							<h3 className="font-semibold text-foreground text-sm">
								No statements found
							</h3>
							<p className="mt-1 text-muted-foreground text-xs">
								{searchQuery
									? "No statements match your search criteria."
									: "Generate your first client account statement to snapshot ledgers."}
							</p>
							{searchQuery ? (
								<Button
									className="mt-4 min-h-[44px] sm:min-h-0 text-xs"
									onClick={() => setSearchQuery("")}
									size="sm"
									variant="outline"
								>
									Clear Search
								</Button>
							) : (
								<Button
									className="mt-4 min-h-[44px] sm:min-h-0 text-xs"
									onClick={() => setDialogOpen(true)}
									size="sm"
								>
									<Plus className="mr-1.5 h-3.5 w-3.5" />
									Generate Statement
								</Button>
							)}
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="border-border/60 hover:bg-transparent">
										<TableHead className="font-semibold text-foreground text-xs uppercase tracking-wider">
											Statement #
										</TableHead>
										<TableHead className="font-semibold text-foreground text-xs uppercase tracking-wider">
											Client
										</TableHead>
										<TableHead className="font-semibold text-foreground text-xs uppercase tracking-wider">
											Statement Period
										</TableHead>
										<TableHead className="text-right font-semibold text-foreground text-xs uppercase tracking-wider">
											Closing Balance
										</TableHead>
										<TableHead className="font-semibold text-foreground text-xs uppercase tracking-wider">
											Generated On
										</TableHead>
										<TableHead className="w-[120px] text-right font-semibold text-foreground text-xs uppercase tracking-wider">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredStatements.map((stmt) => (
										<TableRow
											className="border-border/60 transition-colors hover:bg-accent/40"
											key={stmt.id}
										>
											<TableCell className="font-semibold font-mono text-foreground text-xs">
												{stmt.statementNumber}
											</TableCell>
											<TableCell className="font-medium text-foreground text-xs">
												{stmt.company?.name || "Unknown Client"}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{stmt.startDate
													? format(new Date(stmt.startDate), "MMM d")
													: "—"}{" "}
												–{" "}
												{stmt.endDate
													? format(new Date(stmt.endDate), "MMM d, yyyy")
													: "—"}
											</TableCell>
											<TableCell className="text-right font-mono font-semibold text-foreground text-xs tabular-nums">
												{new Intl.NumberFormat("en-US", {
													style: "currency",
													currency: "USD",
												}).format((stmt.closingBalance || 0) / 100)}
											</TableCell>
											<TableCell className="text-muted-foreground text-xs">
												{stmt.createdAt
													? format(new Date(stmt.createdAt), "MMM d, yyyy")
													: "—"}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-1">
													<Button
														className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
														onClick={() => copyPublicLink(stmt.id)}
														size="icon"
														title="Copy public link"
														variant="ghost"
													>
														<Copy className="h-4 w-4" />
														<span className="sr-only">Copy Link</span>
													</Button>
													<Button
														className="h-9 w-9 rounded-lg text-primary hover:text-primary/80"
														onClick={() =>
															window.open(
																`/public/statement/${stmt.id}`,
																"_blank",
															)
														}
														size="icon"
														title="View public statement"
														variant="ghost"
													>
														<ExternalLink className="h-4 w-4" />
														<span className="sr-only">View</span>
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</div>

			<GenerateStatementDialog
				onOpenChange={setDialogOpen}
				onSuccess={() => refetch()}
				open={dialogOpen}
			/>
		</DashboardLayout>
	);
}
