"use client";

import { format } from "date-fns";
import {
	ArrowUpRight,
	CheckCircle2,
	Clock,
	Copy,
	Edit,
	FileEdit,
	FileText,
	Link as LinkIcon,
	MoreHorizontal,
	Plus,
	Search,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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

type QuoteStatusFilter = "ALL" | "ACCEPTED" | "SENT" | "DECLINED" | "DRAFT";

export default function QuotesListPage() {
	const router = useRouter();
	const { data: quotes, isLoading, refetch } = api.billing.getQuotes.useQuery();
	const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>("ALL");
	const [searchQuery, setSearchQuery] = useState("");

	const deleteMutation = api.billing.deleteQuote.useMutation({
		onSuccess: () => {
			toast.success("Quote deleted successfully.");
			refetch();
		},
		onError: (err) => {
			toast.error(`Error deleting quote: ${err.message}`);
		},
	});

	const reviseMutation = api.billing.reviseQuote.useMutation({
		onSuccess: () => {
			toast.success("Quote revised successfully as a new version.");
			refetch();
		},
		onError: (err) => {
			toast.error(`Error revising quote: ${err.message}`);
		},
	});

	const convertMutation = api.billing.convertToInvoice.useMutation({
		onSuccess: () => {
			toast.success("Quote converted to Invoice successfully.");
			router.push("/billing/invoices");
		},
		onError: (err) => {
			toast.error(`Error converting quote: ${err.message}`);
		},
	});

	// Calculate Quote Pipeline KPIs
	const kpis = useMemo(() => {
		if (!quotes) {
			return {
				totalQuoted: 0,
				acceptedValue: 0,
				pendingCount: 0,
				draftCount: 0,
			};
		}

		let totalQuoted = 0;
		let acceptedValue = 0;
		let pendingCount = 0;
		let draftCount = 0;

		for (const q of quotes) {
			const amt = q.totalAmount || 0;
			totalQuoted += amt;

			const status = (q.status || "").toUpperCase();
			if (status === "ACCEPTED") {
				acceptedValue += amt;
			} else if (status === "SENT" || status === "PENDING") {
				pendingCount += 1;
			} else if (status === "DRAFT") {
				draftCount += 1;
			}
		}

		return {
			totalQuoted,
			acceptedValue,
			pendingCount,
			draftCount,
		};
	}, [quotes]);

	// Filter quotes based on status and search
	const filteredQuotes = useMemo(() => {
		if (!quotes) return [];
		return quotes.filter((quote) => {
			const status = (quote.status || "").toUpperCase();
			if (statusFilter !== "ALL" && status !== statusFilter) {
				return false;
			}
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				const matchNumber = quote.quoteNumber?.toLowerCase().includes(q);
				const matchTitle = quote.title?.toLowerCase().includes(q);
				const matchClient = quote.company?.name?.toLowerCase().includes(q);
				return matchNumber || matchTitle || matchClient;
			}
			return true;
		});
	}, [quotes, statusFilter, searchQuery]);

	const formatCurrency = (cents: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			maximumFractionDigits: 0,
		}).format(cents / 100);
	};

	const renderStatusBadge = (status: string) => {
		const s = (status || "DRAFT").toUpperCase();
		if (s === "ACCEPTED") {
			return (
				<span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-500 text-xs">
					<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
					Accepted
				</span>
			);
		}
		if (s === "SENT" || s === "PENDING") {
			return (
				<span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 font-medium text-sky-500 text-xs">
					<span className="h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
					Sent
				</span>
			);
		}
		if (s === "DECLINED" || s === "REJECTED") {
			return (
				<span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 font-medium text-red-500 text-xs">
					<span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
					Declined
				</span>
			);
		}
		return (
			<span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/60 px-2.5 py-0.5 font-medium text-muted-foreground text-xs">
				<span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
				Draft
			</span>
		);
	};

	return (
		<DashboardLayout>
			<div className="space-y-6">
				{/* Header Section */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<h1 className="font-semibold text-2xl tracking-tight">Quotes</h1>
							<Badge
								className="border-indigo-500/20 bg-indigo-500/10 font-normal text-indigo-500 text-xs"
								variant="outline"
							>
								Pipeline
							</Badge>
						</div>
						<p className="text-muted-foreground text-sm">
							Manage sales proposals, track customer approvals, and convert
							accepted quotes to invoices.
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							asChild
							className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-indigo-500/20 shadow-sm hover:from-indigo-600 hover:to-indigo-700"
						>
							<Link href="/billing/quotes/new">
								<Plus className="mr-1.5 h-4 w-4" />
								New Quote
							</Link>
						</Button>
					</div>
				</div>

				{/* Quote Pipeline KPI Scorecards */}
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{/* KPI 1: Total Quoted Value */}
					<Card className="relative overflow-hidden border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:border-indigo-500/30">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Total Quoted
							</CardTitle>
							<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-500">
								<FileText className="h-4 w-4" />
							</div>
						</CardHeader>
						<CardContent className="space-y-1">
							<div className="font-bold font-mono text-2xl tracking-tight">
								{isLoading ? "—" : formatCurrency(kpis.totalQuoted)}
							</div>
							<p className="text-muted-foreground text-xs">
								Lifetime proposal pipeline value
							</p>
						</CardContent>
					</Card>

					{/* KPI 2: Accepted Value */}
					<Card className="relative overflow-hidden border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:border-emerald-500/30">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Accepted Value
							</CardTitle>
							<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
								<CheckCircle2 className="h-4 w-4" />
							</div>
						</CardHeader>
						<CardContent className="space-y-1">
							<div className="font-bold font-mono text-2xl text-emerald-500 tracking-tight">
								{isLoading ? "—" : formatCurrency(kpis.acceptedValue)}
							</div>
							<p className="text-muted-foreground text-xs">
								Won proposals ready for billing
							</p>
						</CardContent>
					</Card>

					{/* KPI 3: Pending Decision */}
					<Card className="relative overflow-hidden border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:border-sky-500/30">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Pending Decision
							</CardTitle>
							<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-500">
								<Clock className="h-4 w-4" />
							</div>
						</CardHeader>
						<CardContent className="space-y-1">
							<div className="font-bold font-mono text-2xl text-sky-500 tracking-tight">
								{isLoading ? "—" : kpis.pendingCount}
							</div>
							<p className="text-muted-foreground text-xs">
								Awaiting client signature or review
							</p>
						</CardContent>
					</Card>

					{/* KPI 4: Drafts */}
					<Card className="relative overflow-hidden border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm transition-all hover:border-indigo-500/20">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
								Draft Proposals
							</CardTitle>
							<div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-muted/60 text-muted-foreground">
								<FileEdit className="h-4 w-4" />
							</div>
						</CardHeader>
						<CardContent className="space-y-1">
							<div className="font-bold font-mono text-2xl tracking-tight">
								{isLoading ? "—" : kpis.draftCount}
							</div>
							<p className="text-muted-foreground text-xs">
								Proposals currently in progress
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Table Filter & Search Controls */}
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-wrap items-center gap-1.5">
						{(
							[
								{ label: "All", value: "ALL" },
								{ label: "Accepted", value: "ACCEPTED" },
								{ label: "Sent", value: "SENT" },
								{ label: "Declined", value: "DECLINED" },
								{ label: "Draft", value: "DRAFT" },
							] as const
						).map((tab) => (
							<Button
								className="h-8 rounded-full px-3 text-xs"
								key={tab.value}
								onClick={() => setStatusFilter(tab.value)}
								size="sm"
								variant={statusFilter === tab.value ? "secondary" : "ghost"}
							>
								{tab.label}
							</Button>
						))}
					</div>

					<div className="flex items-center gap-2">
						<div className="relative w-full sm:w-64">
							<Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
							<Input
								className="h-8 rounded-lg pl-8 text-xs"
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search quotes or clients..."
								value={searchQuery}
							/>
						</div>
					</div>
				</div>

				{/* Data Table Container */}
				<div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
					{isLoading ? (
						<div className="p-12 text-center text-muted-foreground text-sm">
							<div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
							Loading quotes...
						</div>
					) : filteredQuotes.length === 0 ? (
						<div className="p-12 text-center">
							<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border border-dashed text-muted-foreground">
								<FileText className="h-6 w-6" />
							</div>
							<h3 className="font-semibold text-foreground text-sm">
								No quotes found
							</h3>
							<p className="mt-1 text-muted-foreground text-xs">
								{searchQuery || statusFilter !== "ALL"
									? "Try adjusting your search criteria or status filter."
									: "Create your first quote to kickstart client engagements."}
							</p>
							{searchQuery || statusFilter !== "ALL" ? (
								<Button
									className="mt-4 h-8 text-xs"
									onClick={() => {
										setStatusFilter("ALL");
										setSearchQuery("");
									}}
									size="sm"
									variant="outline"
								>
									Clear Filters
								</Button>
							) : (
								<Button
									asChild
									className="mt-4 h-8 bg-indigo-600 text-white text-xs hover:bg-indigo-700"
									size="sm"
								>
									<Link href="/billing/quotes/new">
										<Plus className="mr-1.5 h-3.5 w-3.5" />
										Create Quote
									</Link>
								</Button>
							)}
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader className="bg-muted/30">
									<TableRow className="border-border/60 hover:bg-transparent">
										<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Quote Number
										</TableHead>
										<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Client
										</TableHead>
										<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Scope / Title
										</TableHead>
										<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Issued Date
										</TableHead>
										<TableHead className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Total Amount
										</TableHead>
										<TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Status
										</TableHead>
										<TableHead className="w-[60px] text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredQuotes.map((quote) => {
										const formattedNumber =
											quote.version > 1
												? `${quote.quoteNumber}-v${quote.version}`
												: quote.quoteNumber;

										return (
											<TableRow
												className="border-border/40 transition-colors hover:bg-muted/20"
												key={quote.id}
											>
												<TableCell className="font-medium font-mono text-sm">
													<div className="flex items-center gap-1.5">
														<span className="text-foreground">
															{formattedNumber}
														</span>
														{quote.version > 1 && (
															<span className="rounded bg-indigo-500/10 px-1 py-0.5 font-medium text-[10px] text-indigo-500">
																Rev {quote.version}
															</span>
														)}
													</div>
												</TableCell>
												<TableCell>
													<div className="font-medium text-foreground text-sm">
														{quote.company?.name || "No Client Assigned"}
													</div>
													{quote.contactEmail && (
														<div className="text-muted-foreground text-xs">
															{quote.contactEmail}
														</div>
													)}
												</TableCell>
												<TableCell>
													<span className="text-muted-foreground text-sm">
														{quote.title || "—"}
													</span>
												</TableCell>
												<TableCell className="text-muted-foreground text-xs">
													{quote.date
														? format(new Date(quote.date), "MMM d, yyyy")
														: "—"}
												</TableCell>
												<TableCell className="text-right font-mono font-semibold text-foreground text-sm">
													{new Intl.NumberFormat("en-US", {
														style: "currency",
														currency: "USD",
													}).format((quote.totalAmount || 0) / 100)}
												</TableCell>
												<TableCell>{renderStatusBadge(quote.status)}</TableCell>
												<TableCell className="text-right">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
																variant="ghost"
															>
																<span className="sr-only">Open menu</span>
																<MoreHorizontal className="h-4 w-4" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent
															align="end"
															className="w-48 rounded-xl border-border/60 bg-popover/90 backdrop-blur-md"
														>
															<DropdownMenuLabel className="text-xs">
																Quote Actions
															</DropdownMenuLabel>
															{quote.status === "DRAFT" && (
																<DropdownMenuItem
																	onClick={() =>
																		toast.info(
																			"Direct draft editor available in full view",
																		)
																	}
																>
																	<Edit className="mr-2 h-4 w-4 text-muted-foreground" />
																	<span>Edit Proposal</span>
																</DropdownMenuItem>
															)}
															{quote.status !== "DRAFT" && (
																<DropdownMenuItem
																	onClick={() => {
																		navigator.clipboard.writeText(
																			`${window.location.origin}/public/quote/${quote.id}`,
																		);
																		toast.success(
																			"Public proposal link copied to clipboard",
																		);
																	}}
																>
																	<LinkIcon className="mr-2 h-4 w-4 text-sky-500" />
																	<span>Copy Public Link</span>
																</DropdownMenuItem>
															)}
															<DropdownMenuItem
																disabled={reviseMutation.isPending}
																onClick={() =>
																	reviseMutation.mutate({ id: quote.id })
																}
															>
																<Copy className="mr-2 h-4 w-4 text-indigo-500" />
																<span>Revise (Clone New)</span>
															</DropdownMenuItem>
															<DropdownMenuItem
																disabled={convertMutation.isPending}
																onClick={() =>
																	convertMutation.mutate({
																		quoteId: quote.id,
																	})
																}
															>
																<ArrowUpRight className="mr-2 h-4 w-4 text-emerald-500" />
																<span>Convert to Invoice</span>
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																className="text-destructive focus:text-destructive"
																disabled={deleteMutation.isPending}
																onClick={() =>
																	deleteMutation.mutate({ id: quote.id })
																}
															>
																<Trash2 className="mr-2 h-4 w-4" />
																<span>Delete Quote</span>
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
}
