"use client";

import { Building2, ChevronRight, Info, Loader2, Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { Input } from "~/components/ui/input";
import { InfoTooltip } from "~/components/ui/tooltip-info";
import { useTour } from "~/hooks/use-tour";
import { api } from "~/trpc/react";

export default function ContactsPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const {
		data: companies,
		isLoading,
	} = api.crm.getCompanies.useQuery();

	const filteredCompanies = useMemo(() => {
		if (!companies) return [];
		if (!searchQuery.trim()) return companies;
		const q = searchQuery.toLowerCase();
		return companies.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				(c.industry && c.industry.toLowerCase().includes(q)) ||
				(c.country && c.country.toLowerCase().includes(q)),
		);
	}, [companies, searchQuery]);

	const crmTourSteps = [
		{
			element: "#tour-add-client",
			popover: {
				title: "Add Client",
				description:
					"Click here to add a new organization or contact to your CRM.",
				side: "bottom",
			},
		},
		{
			element: "#tour-search",
			popover: {
				title: "Search & Filter",
				description:
					"Use this search bar to quickly find clients by name or industry.",
				side: "bottom",
			},
		},
	];
	const { startTour, forceStartTour } = useTour(crmTourSteps, "crm");

	React.useEffect(() => {
		const t = setTimeout(() => startTour(), 500);
		return () => clearTimeout(t);
	}, [startTour]);

	return (
		<DashboardLayout>
			<div className="mx-auto flex max-w-[1600px] flex-col gap-6 pb-8">
				{/* Top Control Bar */}
				<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					<div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
						<div className="flex flex-col gap-1.5">
							<div className="flex items-center gap-2.5">
								<span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
									CRM Directory
								</span>
								<span className="text-muted-foreground text-xs">
									Organization Accounts &amp; Key Accounts
								</span>
							</div>
							<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Clients &amp; Organizations
							</h1>
							<p className="text-muted-foreground text-sm">
								Manage enterprise accounts, qualification status, and key points of contact.
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-2.5">
							<Button
								className="gap-1.5 rounded-xl border-border/80 bg-background/60 text-muted-foreground text-xs hover:text-foreground"
								onClick={forceStartTour}
								size="sm"
								variant="outline"
							>
								<Info className="h-3.5 w-3.5" />
								<span>Tour</span>
							</Button>
							<Button asChild className="gap-2 rounded-xl shadow-xs" id="tour-add-client" size="sm">
								<Link href="/clients/new">
									<Plus className="h-4 w-4" />
									<span>Add Client</span>
								</Link>
							</Button>
						</div>
					</div>
					<div className="pointer-events-none absolute -top-16 -right-16 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
				</section>

				{/* Search Bar */}
				<div
					className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-border/70 bg-card/75 p-4 shadow-sm backdrop-blur-md"
					id="tour-search"
				>
					<div className="relative flex-1">
						<Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							className="h-11 sm:h-10 pl-10 rounded-xl border-border/70 bg-background/70"
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search clients by name, industry, or country..."
							value={searchQuery}
						/>
					</div>
					<span className="font-mono text-muted-foreground text-xs px-2">
						{filteredCompanies.length} accounts found
					</span>
				</div>

				{/* Data Table & Mobile Cards */}
				<Card className="rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md">
					<CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
						<CardTitle className="font-bold text-foreground text-lg">
							All Client Accounts
						</CardTitle>
						<Badge variant="outline">{filteredCompanies.length} Total</Badge>
					</CardHeader>
					<CardContent className="pt-4">
						{isLoading ? (
							<div className="flex justify-center p-12">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
							</div>
						) : filteredCompanies.length === 0 ? (
							<EmptyState
								action={
									<Button asChild>
										<Link href="/clients/new">
											<Plus className="mr-2 h-4 w-4" /> Add Your First Client
										</Link>
									</Button>
								}
								description={
									searchQuery
										? "No client accounts matched your search criteria."
										: "Your customer directory is currently empty. Add your first client to start building your CRM."
								}
								icon={Users}
								title={searchQuery ? "No matching clients" : "No clients found"}
							/>
						) : (
							<>
								{/* Desktop Table View */}
								<div className="hidden md:block overflow-x-auto">
									<table className="w-full text-left text-foreground text-sm">
										<thead className="border-b border-border/60 bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
											<tr>
												<th className="px-4 py-3">Company Name</th>
												<th className="px-4 py-3">
													Industry
													<InfoTooltip content="The primary market or vertical this client operates in." />
												</th>
												<th className="px-4 py-3">Country</th>
												<th className="px-4 py-3 text-right">Actions</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border/60">
											{filteredCompanies.map((company) => {
												const initials = company.name.slice(0, 2).toUpperCase();
												return (
													<tr
														className="transition-colors hover:bg-muted/30"
														key={company.id}
													>
														<td className="px-4 py-3.5">
															<div className="flex items-center gap-3">
																<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 font-bold font-mono text-primary text-xs">
																	{initials}
																</div>
																<span className="font-semibold text-foreground">
																	{company.name}
																</span>
															</div>
														</td>
														<td className="px-4 py-3.5 text-muted-foreground">
															{company.industry || "-"}
														</td>
														<td className="px-4 py-3.5 text-muted-foreground">
															{company.country || "-"}
														</td>
														<td className="px-4 py-3.5 text-right">
															<Button asChild size="sm" variant="ghost">
																<Link href={`/clients/${company.id}`}>
																	<span>View Profile</span>
																	<ChevronRight className="h-3.5 w-3.5 ml-1" />
																</Link>
															</Button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>

								{/* Mobile Structured Cards View */}
								<div className="grid grid-cols-1 gap-3 md:hidden">
									{filteredCompanies.map((company) => {
										const initials = company.name.slice(0, 2).toUpperCase();
										return (
											<Link
												className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/60 p-4 transition-all hover:border-primary/40"
												href={`/clients/${company.id}`}
												key={company.id}
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-3">
														<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 font-bold font-mono text-primary text-sm">
															{initials}
														</div>
														<div className="flex flex-col">
															<span className="font-semibold text-foreground text-sm">
																{company.name}
															</span>
															<span className="text-muted-foreground text-xs">
																{company.industry || "General Enterprise"}
															</span>
														</div>
													</div>
													<ChevronRight className="h-4 w-4 text-muted-foreground" />
												</div>

												<div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
													<span>Region: {company.country || "Global"}</span>
													<span className="font-medium text-primary">View Account →</span>
												</div>
											</Link>
										);
									})}
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
