"use client";

import {
	ArrowLeft,
	Building2,
	Calendar,
	ChevronRight,
	DollarSign,
	ExternalLink,
	FileText,
	Globe,
	Loader2,
	Mail,
	MapPin,
	Phone,
	Plus,
	ShieldCheck,
	Sparkles,
	TrendingUp,
	UserPlus,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { LedgerView } from "~/components/billing/ledger-view";
import { AddPocDialog } from "~/components/clients/add-poc-dialog";
import { ActivityTimeline } from "~/components/crm/activity-timeline";
import { DealDialog } from "~/components/deals/deal-dialog";
import { DealSheet } from "~/components/deals/deal-sheet";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

export default function ClientProfilePage() {
	const params = useParams();
	const clientId = params.id as string;

	const [addPocOpen, setAddPocOpen] = useState(false);
	const [dealDialogOpen, setDealDialogOpen] = useState(false);
	const [selectedDeal, setSelectedDeal] = useState<{
		id: string;
		title: string;
	} | null>(null);

	const { data: client, isLoading } = api.crm.getCompanyById.useQuery({
		id: clientId,
	});

	const { data: pocs, isLoading: pocsLoading } =
		api.crm.getPOCsByCompanyId.useQuery(
			{ companyId: clientId },
			{ enabled: !!clientId },
		);

	const {
		data: companyDeals,
		isLoading: dealsLoading,
		refetch: refetchDeals,
	} = api.deals.getDealsByCompanyId.useQuery(
		{ companyId: clientId },
		{ enabled: !!clientId },
	);

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex h-[50vh] items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			</DashboardLayout>
		);
	}

	if (!client) {
		return (
			<DashboardLayout>
				<div className="flex h-[50vh] flex-col items-center justify-center p-6 text-center">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
						<Building2 className="h-8 w-8" />
					</div>
					<h3 className="mb-2 font-bold text-foreground text-xl">
						Client Not Found
					</h3>
					<p className="mb-6 max-w-sm text-muted-foreground text-sm">
						The client profile you are looking for does not exist or you do not
						have permission to view it.
					</p>
					<Button asChild className="min-h-[44px] px-6">
						<Link href="/clients">Return to Clients</Link>
					</Button>
				</div>
			</DashboardLayout>
		);
	}

	// Calculate client financial metrics
	const wonDeals = companyDeals?.filter((d) => d.status === "WON") || [];
	const openDeals = companyDeals?.filter((d) => d.status === "OPEN") || [];
	const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
	const openValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);

	const companyInitials = client.name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<DashboardLayout>
			<div className="mx-auto flex max-w-[1700px] flex-col gap-6 px-3 sm:px-6 py-4 sm:py-6 pb-12">
				{/* Breadcrumb Navigation */}
				<div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
					<Link
						href="/clients"
						className="hover:text-foreground transition-colors flex items-center gap-1"
					>
						<Building2 className="h-3.5 w-3.5" />
						Clients
					</Link>
					<ChevronRight className="h-3.5 w-3.5" />
					<span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
						{client.name}
					</span>
				</div>

				{/* Client Header Card */}
				<section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-sm">
					<div className="flex flex-col gap-6">
						<div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
							<div className="flex items-start sm:items-center gap-3 sm:gap-4">
								<Button
									asChild
									className="h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 rounded-xl border border-border bg-background"
									size="icon"
									variant="outline"
								>
									<Link href="/clients" aria-label="Return to clients">
										<ArrowLeft className="h-4 w-4" />
									</Link>
								</Button>

								<div className="flex items-start sm:items-center gap-3 sm:gap-4">
									<div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 font-bold text-primary text-lg sm:text-xl shadow-xs">
										{companyInitials || "CO"}
									</div>
									<div className="flex flex-col gap-1 min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<h1 className="font-bold text-xl sm:text-2xl lg:text-3xl text-foreground tracking-tight break-words">
												{client.name}
											</h1>
											{client.clientType && (
												<Badge
													className="rounded-full px-2.5 py-0.5 font-semibold text-xs capitalize"
													variant="secondary"
												>
													{client.clientType}
												</Badge>
											)}
											{client.uid && (
												<span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
													UID: {client.uid}
												</span>
											)}
										</div>
										<p className="text-muted-foreground text-xs sm:text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
											<span>{client.industry || "General Commercial"}</span>
											{client.country && (
												<>
													<span>•</span>
													<span className="flex items-center gap-1">
														<Globe className="h-3 w-3" />
														{client.country}
													</span>
												</>
											)}
											{client.alias && (
												<>
													<span>•</span>
													<span>AKA: {client.alias}</span>
												</>
											)}
										</p>
									</div>
								</div>
							</div>

							{/* Action CTAs */}
							<div className="flex flex-wrap items-center gap-2 sm:gap-3 self-stretch sm:self-auto">
								<Button
									className="min-h-[44px] flex-1 sm:flex-initial gap-2 rounded-xl"
									onClick={() => setAddPocOpen(true)}
									size="sm"
									variant="outline"
								>
									<UserPlus className="h-4 w-4 text-primary" />
									<span>Add Contact</span>
								</Button>

								<Button
									className="min-h-[44px] flex-1 sm:flex-initial gap-2 rounded-xl font-semibold shadow-xs"
									onClick={() => setDealDialogOpen(true)}
									size="sm"
								>
									<Plus className="h-4 w-4" />
									<span>New Deal</span>
								</Button>
							</div>
						</div>

						{/* Client Metrics Strip */}
						<div className="grid grid-cols-2 gap-2.5 sm:gap-4 pt-1 sm:grid-cols-4">
							<div className="flex flex-col rounded-xl sm:rounded-2xl border border-border bg-muted/20 p-3 sm:p-4">
								<span className="font-medium text-muted-foreground text-xs">
									Total Won Revenue
								</span>
								<div className="mt-1 flex flex-wrap items-baseline gap-1.5">
									<span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg sm:text-2xl tabular-nums tracking-tight">
										$
										{(wonValue / 100).toLocaleString(undefined, {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}
									</span>
									<span className="text-[11px] text-muted-foreground">
										({wonDeals.length} won)
									</span>
								</div>
							</div>

							<div className="flex flex-col rounded-xl sm:rounded-2xl border border-border bg-muted/20 p-3 sm:p-4">
								<span className="font-medium text-muted-foreground text-xs">
									Active Pipeline
								</span>
								<div className="mt-1 flex flex-wrap items-baseline gap-1.5">
									<span className="font-bold text-foreground text-lg sm:text-2xl tabular-nums tracking-tight">
										$
										{(openValue / 100).toLocaleString(undefined, {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}
									</span>
									<span className="font-medium text-[11px] text-primary">
										({openDeals.length} in flight)
									</span>
								</div>
							</div>

							<div className="flex flex-col rounded-xl sm:rounded-2xl border border-border bg-muted/20 p-3 sm:p-4">
								<span className="font-medium text-muted-foreground text-xs">
									Total Deals
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-foreground text-lg sm:text-2xl tracking-tight">
										{companyDeals?.length ?? 0}
									</span>
									<span className="text-[11px] text-muted-foreground">
										Opportunities
									</span>
								</div>
							</div>

							<div className="flex flex-col rounded-xl sm:rounded-2xl border border-border bg-muted/20 p-3 sm:p-4">
								<span className="font-medium text-muted-foreground text-xs">
									Designated POCs
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-foreground text-lg sm:text-2xl tracking-tight">
										{pocs?.length ?? 0}
									</span>
									<span className="text-[11px] text-muted-foreground">
										Contacts
									</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Primary Tabs Navigation */}
				<Tabs className="w-full space-y-6" defaultValue="overview">
					<div className="flex items-center justify-between">
						<TabsList className="min-h-[44px] rounded-xl border border-border bg-muted/40 p-1">
							<TabsTrigger
								className="min-h-[38px] rounded-lg px-4 py-1.5 font-medium text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
								value="overview"
							>
								Overview & Activity
							</TabsTrigger>
							<TabsTrigger
								className="min-h-[38px] rounded-lg px-4 py-1.5 font-medium text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
								value="ledger"
							>
								Ledger & Statements
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent className="mt-0 space-y-6 focus-visible:outline-none" value="overview">
						{/* 2-Column Responsive Layout */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
							{/* Left Column (Primary ~60%) */}
							<div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">
								{/* Company & Tax Details Card */}
								<div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-sm">
									<div className="mb-4 flex items-center justify-between border-b border-border pb-3">
										<div className="flex items-center gap-2">
											<ShieldCheck className="h-4 w-4 text-primary" />
											<h3 className="font-bold text-base text-foreground tracking-tight">
												Company & Tax Intelligence
											</h3>
										</div>
										<span className="text-xs text-muted-foreground">
											Billing & Registration
										</span>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
										<div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/20 border border-border/50">
											<span className="text-[11px] text-muted-foreground">
												Tax Treatment
											</span>
											<span className="font-semibold text-foreground text-sm">
												{client.taxTreatment || "Standard Commercial"}
											</span>
										</div>

										<div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/20 border border-border/50">
											<span className="text-[11px] text-muted-foreground">
												GSTIN / Tax ID
											</span>
											<span className="font-mono font-semibold text-foreground text-sm">
												{client.gstin || "Not Registered"}
											</span>
										</div>

										<div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/20 border border-border/50">
											<span className="text-[11px] text-muted-foreground">
												Business PAN
											</span>
											<span className="font-mono font-semibold text-foreground text-sm">
												{client.businessPan || "-"}
											</span>
										</div>

										<div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/20 border border-border/50">
											<span className="text-[11px] text-muted-foreground">
												Primary Phone
											</span>
											<span className="font-semibold text-foreground text-sm">
												{client.phone ? (
													<a
														className="text-primary hover:underline inline-flex items-center gap-1"
														href={`tel:${client.phone}`}
													>
														<Phone className="h-3 w-3" />
														{client.phone}
													</a>
												) : (
													"-"
												)}
											</span>
										</div>

										<div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/20 border border-border/50">
											<span className="text-[11px] text-muted-foreground">
												Primary Email
											</span>
											<span className="font-semibold text-foreground text-sm truncate">
												{client.email ? (
													<a
														className="text-primary hover:underline inline-flex items-center gap-1 truncate"
														href={`mailto:${client.email}`}
													>
														<Mail className="h-3 w-3 shrink-0" />
														<span className="truncate">{client.email}</span>
													</a>
												) : (
													"-"
												)}
											</span>
										</div>

										<div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/20 border border-border/50">
											<span className="text-[11px] text-muted-foreground">
												Address & Jurisdiction
											</span>
											<span className="font-semibold text-foreground text-sm truncate">
												{[
													client.addressCity,
													client.addressState,
													client.country,
												]
													.filter(Boolean)
													.join(", ") || "Global"}
											</span>
										</div>
									</div>
								</div>

								{/* Points of Contact (POCs) Card */}
								<div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-sm">
									<div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
										<div className="flex items-center gap-2">
											<Users className="h-4 w-4 text-primary" />
											<h3 className="font-bold text-base text-foreground tracking-tight">
												Points of Contact (POCs)
											</h3>
											<span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-xs text-muted-foreground">
												{pocs?.length ?? 0}
											</span>
										</div>

										<div className="flex items-center gap-2">
											<Button
												className="min-h-[38px] gap-1.5 rounded-lg text-xs"
												onClick={() => setAddPocOpen(true)}
												size="sm"
												variant="outline"
											>
												<Plus className="h-3.5 w-3.5 text-primary" />
												<span>Quick Add</span>
											</Button>
											<Button
												asChild
												className="min-h-[38px] text-xs"
												size="sm"
												variant="ghost"
											>
												<Link href="/contacts/new">Full Form</Link>
											</Button>
										</div>
									</div>

									{pocsLoading ? (
										<div className="flex justify-center p-6">
											<Loader2 className="h-6 w-6 animate-spin text-primary" />
										</div>
									) : pocs && pocs.length > 0 ? (
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
											{pocs.map((poc) => {
												const pocInitials =
													`${poc.firstName?.[0] || ""}${poc.lastName?.[0] || ""}`.toUpperCase();
												return (
													<div
														className="flex flex-col justify-between rounded-xl border border-border bg-muted/20 p-4 transition-all hover:border-primary/40 space-y-3"
														key={poc.id}
													>
														<div className="flex items-start justify-between gap-2">
															<div className="flex items-center gap-3 min-w-0">
																<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 font-bold text-primary text-xs">
																	{pocInitials || "POC"}
																</div>
																<div className="flex flex-col min-w-0">
																	<span className="font-semibold text-foreground text-sm truncate">
																		{poc.salutation} {poc.firstName}{" "}
																		{poc.lastName}
																	</span>
																	<span className="text-[11px] text-muted-foreground font-mono">
																		UID: {poc.uid || "N/A"}
																	</span>
																</div>
															</div>

															{poc.qualificationStatus &&
																poc.qualificationStatus !== "NONE" && (
																	<Badge
																		className="h-5 px-2 text-[10px] shrink-0"
																		variant={
																			poc.qualificationStatus === "SQL"
																				? "default"
																				: poc.qualificationStatus === "MQL"
																					? "secondary"
																					: "outline"
																		}
																	>
																		{poc.qualificationStatus}
																	</Badge>
																)}
														</div>

														<div className="flex items-center justify-between border-t border-border pt-3 text-xs">
															<div className="flex items-center gap-2">
																{poc.leadScore > 0 ? (
																	<span className="flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-semibold text-[10px] text-amber-600 dark:text-amber-400">
																		<Sparkles className="h-3 w-3" />
																		Score: {poc.leadScore}
																	</span>
																) : (
																	<span className="text-[11px] text-muted-foreground">
																		Standard Contact
																	</span>
																)}
															</div>

															<div className="flex items-center gap-1">
																{poc.email && (
																	<a
																		className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted"
																		href={`mailto:${poc.email}`}
																		title={poc.email}
																		aria-label={`Email ${poc.firstName}`}
																	>
																		<Mail className="h-4 w-4" />
																	</a>
																)}
																{poc.phone && (
																	<a
																		className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted"
																		href={`tel:${poc.phone}`}
																		title={poc.phone}
																		aria-label={`Call ${poc.firstName}`}
																	>
																		<Phone className="h-4 w-4" />
																	</a>
																)}
															</div>
														</div>
													</div>
												);
											})}
										</div>
									) : (
										<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground space-y-2">
											<p className="font-semibold text-foreground text-sm">
												No contacts linked to this company
											</p>
											<p className="text-xs text-muted-foreground max-w-sm">
												Add point-of-contact details for account representatives and decision makers.
											</p>
											<Button
												className="min-h-[40px] gap-1.5 rounded-lg text-xs mt-2"
												onClick={() => setAddPocOpen(true)}
												size="sm"
												variant="outline"
											>
												<Plus className="h-3.5 w-3.5 text-primary" />
												<span>Add First Contact</span>
											</Button>
										</div>
									)}
								</div>

								{/* Deal History Section */}
								<div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-sm">
									<div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
										<div className="flex items-center gap-2">
											<TrendingUp className="h-4 w-4 text-primary" />
											<h3 className="font-bold text-base text-foreground tracking-tight">
												Deal History & Pipeline
											</h3>
											<span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-xs text-muted-foreground">
												{companyDeals?.length ?? 0}
											</span>
										</div>

										<Button
											className="min-h-[38px] gap-1.5 rounded-lg text-xs self-start sm:self-auto"
											onClick={() => setDealDialogOpen(true)}
											size="sm"
											variant="outline"
										>
											<Plus className="h-3.5 w-3.5 text-primary" />
											<span>Create Deal</span>
										</Button>
									</div>

									{dealsLoading ? (
										<div className="flex justify-center p-6">
											<Loader2 className="h-6 w-6 animate-spin text-primary" />
										</div>
									) : companyDeals && companyDeals.length > 0 ? (
										<div className="flex flex-col gap-2.5">
											{companyDeals.map((deal) => (
												<button
													className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-muted/20 p-3.5 sm:p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/40 min-h-[56px]"
													key={deal.id}
													onClick={() =>
														setSelectedDeal({
															id: deal.id,
															title: deal.title,
														})
													}
													type="button"
												>
													<div className="flex items-center gap-3 min-w-0">
														<div
															className="h-3 w-3 shrink-0 rounded-full"
															style={{
																backgroundColor: deal.stageColor || "#2563eb",
															}}
														/>
														<div className="flex flex-col min-w-0">
															<span className="font-semibold text-foreground text-sm hover:text-primary truncate">
																{deal.title}
															</span>
															<span className="text-xs text-muted-foreground truncate">
																{deal.stageName} • {deal.pipelineName}
															</span>
														</div>
													</div>

													<div className="flex items-center gap-3 shrink-0 ml-2">
														<Badge
															className="font-semibold text-xs capitalize hidden sm:inline-flex"
															variant={
																deal.status === "WON"
																	? "default"
																	: deal.status === "LOST"
																		? "destructive"
																		: "secondary"
															}
														>
															{deal.status}
														</Badge>

														<div className="flex flex-col items-end">
															<span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
																$
																{(deal.value / 100).toLocaleString(undefined, {
																	minimumFractionDigits: 0,
																	maximumFractionDigits: 0,
																})}
															</span>
															{deal.expectedCloseDate && (
																<span className="text-[10px] text-muted-foreground">
																	{new Date(deal.expectedCloseDate).toLocaleDateString(undefined, {
																		month: "short",
																		day: "numeric",
																	})}
																</span>
															)}
														</div>
													</div>
												</button>
											))}
										</div>
									) : (
										<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground space-y-2">
											<p className="font-semibold text-foreground text-sm">
												No opportunities linked yet
											</p>
											<p className="text-xs text-muted-foreground max-w-sm">
												Create sales opportunities and track proposals through your pipeline.
											</p>
											<Button
												className="min-h-[40px] gap-1.5 rounded-lg text-xs mt-2"
												onClick={() => setDealDialogOpen(true)}
												size="sm"
												variant="outline"
											>
												<Plus className="h-3.5 w-3.5 text-primary" />
												<span>New Opportunity</span>
											</Button>
										</div>
									)}
								</div>
							</div>

							{/* Right Column: Sticky Activity Timeline */}
							<div className="flex flex-col gap-4 lg:col-span-5 xl:col-span-4">
								<div className="sticky top-6 rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-sm">
									<div className="mb-4 flex items-center justify-between border-b border-border pb-3">
										<h3 className="font-bold text-base text-foreground tracking-tight">
											Activity Log
										</h3>
										<span className="text-xs text-muted-foreground">
											Notes, Calls & Meetings
										</span>
									</div>

									<ActivityTimeline companyId={clientId} />
								</div>
							</div>
						</div>
					</TabsContent>

					{/* Financial Ledger & Statements Tab */}
					<TabsContent className="mt-0 focus-visible:outline-none" value="ledger">
						<div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-sm">
							<LedgerView companyId={clientId} />
						</div>
					</TabsContent>
				</Tabs>
			</div>

			{/* In-Context Modals & Drawers */}
			<AddPocDialog
				companyId={clientId}
				onOpenChange={setAddPocOpen}
				open={addPocOpen}
			/>

			<DealDialog onOpenChange={setDealDialogOpen} open={dealDialogOpen} />

			<DealSheet
				dealId={selectedDeal?.id || null}
				onOpenChange={(open) => !open && setSelectedDeal(null)}
				onStatusChange={() => refetchDeals()}
				open={!!selectedDeal}
				title={selectedDeal?.title || ""}
			/>
		</DashboardLayout>
	);
}
