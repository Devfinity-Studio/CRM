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
			<div className="space-y-6">
				{/* Header Section */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<h1 className="font-semibold text-2xl tracking-tight">
								Account Statements
							</h1>
							<Badge
								className="border-indigo-500/20 bg-indigo-500/10 font-normal text-indigo-500 text-xs"
								variant="outline"
							>
								Ledger Records
							</Badge>
						</div>
						<p className="text-muted-foreground text-sm">
							Generate, review, and share client balance statements and frozen
							transaction ledgers.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-indigo-500/20 shadow-sm hover:from-indigo-600 hover:to-indigo-700"
							onClick={() => setDialogOpen(true)}
						>
							<Plus className="mr-1.5 h-4 w-4" /> Generate Statement
						</Button>
					</div>
				</div>

				{/* Scorecard Metrics */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<Card className="border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:border-indigo-500/30">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Statements Generated
							</CardTitle>
							<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-500">
								<BookOpen className="h-4 w-4" />
							</div>
						</CardHeader>
						<CardContent className="space-y-1">
							<div className="font-bold font-mono text-2xl tracking-tight">
								{isLoading ? "—" : metrics.totalCount}
							</div>
							<p className="text-muted-foreground text-xs">
								Historical billing snapshots created
							</p>
						</CardContent>
					</Card>

					<Card className="border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:border-sky-500/30">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Clients Covered
							</CardTitle>
							<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-500">
								<Users className="h-4 w-4" />
							</div>
						</CardHeader>
						<CardContent className="space-y-1">
							<div className="font-bold font-mono text-2xl text-sky-500 tracking-tight">
								{isLoading ? "—" : metrics.uniqueClients}
							</div>
							<p className="text-muted-foreground text-xs">
								Companies with formal statements
							</p>
						</CardContent>
					</Card>

					<Card className="border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:border-emerald-500/30">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Total Statement Balances
							</CardTitle>
							<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
								<Wallet className="h-4 w-4" />
							</div>
						</CardHeader>
						<CardContent className="space-y-1">
							<div className="font-bold font-mono text-2xl text-emerald-500 tracking-tight">
								{isLoading ? "—" : formatCurrency(metrics.totalBalance)}
							</div>
							<p className="text-muted-foreground text-xs">
								Combined closing balances across snapshots
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Search Bar */}
				<div className="flex items-center justify-between">
					<div className="relative w-full max-w-sm">
						<Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
						<Input
							className="h-8 rounded-lg pl-8 text-xs"
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by statement # or client..."
							value={searchQuery}
						/>
					</div>
				</div>

				{/* Table Container */}
				<div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
					{isLoading ? (
						<div className="p-12 text-center text-muted-foreground text-sm">
							<div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
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
									className="mt-4 h-8 text-xs"
									onClick={() => setSearchQuery("")}
									size="sm"
									variant="outline"
								>
									Clear Search
								</Button>
							) : (
								<Button
									className="mt-4 h-8 bg-indigo-600 text-white text-xs hover:bg-indigo-700"
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
								<TableHeader className="bg-muted/30">
									<TableRow className="border-border/60 hover:bg-transparent">
										<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Statement #
										</TableHead>
										<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Client
										</TableHead>
										<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Statement Period
										</TableHead>
										<TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Closing Balance
										</TableHead>
										<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Generated On
										</TableHead>
										<TableHead className="w-[120px] text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredStatements.map((stmt) => (
										<TableRow
											className="border-border/40 transition-colors hover:bg-muted/20"
											key={stmt.id}
										>
											<TableCell className="font-medium font-mono text-foreground text-sm">
												{stmt.statementNumber}
											</TableCell>
											<TableCell className="font-medium text-foreground text-sm">
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
											<TableCell className="text-right font-mono font-semibold text-foreground text-sm">
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
														className="h-8 px-2 text-muted-foreground hover:text-foreground"
														onClick={() => copyPublicLink(stmt.id)}
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
															window.open(
																`/public/statement/${stmt.id}`,
																"_blank",
															)
														}
														size="sm"
														title="View public statement"
														variant="ghost"
													>
														<ExternalLink className="h-3.5 w-3.5" />
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
