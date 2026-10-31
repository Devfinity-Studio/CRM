"use client";

import {
	ArrowLeft,
	Building2,
	Loader2,
	Mail,
	Phone,
	Plus,
	Sparkles,
	UserPlus,
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
					<Loader2 className="h-8 w-8 animate-spin text-primary/70" />
				</div>
			</DashboardLayout>
		);
	}

	if (!client) {
		return (
			<DashboardLayout>
				<div className="flex h-[50vh] flex-col items-center justify-center p-12 text-center">
					<Building2 className="mb-4 h-12 w-12 text-muted-foreground/40" />
					<h3 className="mb-2 font-bold text-foreground text-xl">
						Client Not Found
					</h3>
					<p className="mb-6 max-w-sm text-muted-foreground text-sm">
						The client profile you are looking for does not exist or you do not
						have permission to view it.
					</p>
					<Button asChild className="rounded-xl">
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
			<div className="mx-auto flex max-w-[1700px] flex-col gap-6 pb-10">
				{/* Back button & Client Header Card */}
				<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					<div className="relative z-10 flex flex-col gap-6">
						<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
							<div className="flex items-center gap-4">
								<Button
									asChild
									className="h-9 w-9 rounded-xl border-border/80 bg-background/60 shadow-xs"
									size="icon"
									variant="outline"
								>
									<Link href="/clients">
										<ArrowLeft className="h-4 w-4" />
									</Link>
								</Button>

								<div className="flex items-center gap-4">
									<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 font-bold text-primary text-xl shadow-xs">
										{companyInitials}
									</div>
									<div className="flex flex-col gap-1">
										<div className="flex flex-wrap items-center gap-2">
											<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
												{client.name}
											</h1>
											{client.clientType && (
												<Badge
													className="rounded-full px-2.5 py-0.5 font-semibold text-xs"
													variant="secondary"
												>
													{client.clientType}
												</Badge>
											)}
											{client.uid && (
												<span className="rounded-md border border-border/70 bg-background/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
													UID: {client.uid}
												</span>
											)}
										</div>
										<p className="text-muted-foreground text-xs sm:text-sm">
											{client.industry || "General Commercial"}
											{client.country ? ` • ${client.country}` : ""}
											{client.alias ? ` • AKA: ${client.alias}` : ""}
										</p>
									</div>
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-2.5">
								<Button
									className="gap-1.5 rounded-xl border-border/80 bg-background/60 shadow-xs hover:bg-accent/60"
									onClick={() => setAddPocOpen(true)}
									size="sm"
									variant="outline"
								>
									<UserPlus className="h-4 w-4 text-primary" />
									<span className="text-xs">Add Contact</span>
								</Button>

								<Button
									className="gap-1.5 rounded-xl bg-primary px-4 font-semibold text-primary-foreground text-xs shadow-xs hover:bg-primary/90"
									onClick={() => setDealDialogOpen(true)}
									size="sm"
								>
									<Plus className="h-4 w-4" />
									<span>New Deal</span>
								</Button>
							</div>
						</div>

						{/* Client Metrics Strip */}
						<div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
							<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
								<span className="font-medium text-muted-foreground text-xs">
									Total Won Revenue
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-emerald-500 text-xl tabular-nums tracking-tight sm:text-2xl">
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

							<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
								<span className="font-medium text-muted-foreground text-xs">
									Active Pipeline
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-foreground text-xl tabular-nums tracking-tight sm:text-2xl">
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

							<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
								<span className="font-medium text-muted-foreground text-xs">
									Total Opportunities
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
										{companyDeals?.length ?? 0}
									</span>
									<span className="text-[11px] text-muted-foreground">
										Deals
									</span>
								</div>
							</div>

							<div className="flex flex-col rounded-2xl border border-border/60 bg-background/50 p-3.5 shadow-2xs backdrop-blur-xs">
								<span className="font-medium text-muted-foreground text-xs">
									Points of Contact
								</span>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
										{pocs?.length ?? 0}
									</span>
									<span className="text-[11px] text-muted-foreground">
										Designated POCs
									</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Primary Tabs Navigation */}
				<Tabs className="w-full" defaultValue="overview">
					<div className="flex items-center justify-between pb-2">
						<TabsList className="h-10 rounded-2xl border border-border/70 bg-card/60 p-1 backdrop-blur-md">
							<TabsTrigger
								className="rounded-xl px-4 py-1.5 font-medium text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs"
								value="overview"
							>
								Overview & Activity
							</TabsTrigger>
							<TabsTrigger
								className="rounded-xl px-4 py-1.5 font-medium text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs"
								value="ledger"
							>
								Ledger & Statements
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent className="mt-0 space-y-6" value="overview">
						{/* 2-Column Responsive Layout */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
							{/* Left Column (Primary ~60%) */}
							<div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">
								{/* Company & Tax Details Card */}
								<div className="rounded-3xl border border-border/70 bg-card/75 p-5 shadow-xs backdrop-blur-md">
									<div className="mb-4 flex items-center justify-between border-border/60 border-b pb-3">
										<h3 className="font-bold text-base text-foreground tracking-tight">
											Company & Tax Intelligence
										</h3>
										<span className="text-[11px] text-muted-foreground">
											Billing & Registration
										</span>
									</div>

									<div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
										<div className="flex flex-col gap-1">
											<span className="text-[11px] text-muted-foreground">
												Tax Treatment
											</span>
											<span className="font-semibold text-foreground">
												{client.taxTreatment || "Standard Commercial"}
											</span>
										</div>

										<div className="flex flex-col gap-1">
											<span className="text-[11px] text-muted-foreground">
												GSTIN / Tax ID
											</span>
											<span className="font-mono font-semibold text-foreground">
												{client.gstin || "Not Registered"}
											</span>
										</div>

										<div className="flex flex-col gap-1">
											<span className="text-[11px] text-muted-foreground">
												Business PAN
											</span>
											<span className="font-mono font-semibold text-foreground">
												{client.businessPan || "-"}
											</span>
										</div>

										<div className="flex flex-col gap-1">
											<span className="text-[11px] text-muted-foreground">
												Primary Phone
											</span>
											<span className="font-semibold text-foreground">
												{client.phone ? (
													<a
														className="text-primary hover:underline"
														href={`tel:${client.phone}`}
													>
														{client.phone}
													</a>
												) : (
													"-"
												)}
											</span>
										</div>

										<div className="flex flex-col gap-1">
											<span className="text-[11px] text-muted-foreground">
												Primary Email
											</span>
											<span className="font-semibold text-foreground">
												{client.email ? (
													<a
														className="truncate text-primary hover:underline"
														href={`mailto:${client.email}`}
													>
														{client.email}
													</a>
												) : (
													"-"
												)}
											</span>
										</div>

										<div className="flex flex-col gap-1">
											<span className="text-[11px] text-muted-foreground">
												Address & Jurisdiction
											</span>
											<span className="font-semibold text-foreground">
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
								<div className="rounded-3xl border border-border/70 bg-card/75 p-5 shadow-xs backdrop-blur-md">
									<div className="mb-4 flex items-center justify-between border-border/60 border-b pb-3">
										<div className="flex items-center gap-2">
											<h3 className="font-bold text-base text-foreground tracking-tight">
												Points of Contact (POCs)
											</h3>
											<span className="rounded-full bg-accent/80 px-2 py-0.5 font-semibold text-[11px] text-muted-foreground">
												{pocs?.length ?? 0}
											</span>
										</div>

										<div className="flex items-center gap-2">
											<Button
												className="h-8 gap-1 rounded-xl text-xs"
												onClick={() => setAddPocOpen(true)}
												size="sm"
												variant="outline"
											>
												<Plus className="h-3.5 w-3.5 text-primary" />
												<span>Quick Add</span>
											</Button>
											<Button
												asChild
												className="h-8 text-xs"
												size="sm"
												variant="ghost"
											>
												<Link href="/contacts/new">Full Form</Link>
											</Button>
										</div>
									</div>

									{pocsLoading ? (
										<div className="flex justify-center p-6">
											<Loader2 className="h-6 w-6 animate-spin text-primary/70" />
										</div>
									) : pocs && pocs.length > 0 ? (
										<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
											{pocs.map((poc) => {
												const pocInitials =
													`${poc.firstName?.[0] || ""}${poc.lastName?.[0] || ""}`.toUpperCase();
												return (
													<div
														className="flex flex-col justify-between rounded-2xl border border-border/70 bg-background/60 p-4 shadow-2xs transition-all hover:border-primary/40"
														key={poc.id}
													>
														<div className="flex items-start justify-between gap-2">
															<div className="flex items-center gap-3">
																<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 font-bold text-primary text-xs">
																	{pocInitials || "POC"}
																</div>
																<div className="flex flex-col">
																	<div className="flex items-center gap-1.5">
																		<span className="font-semibold text-foreground text-sm">
																			{poc.salutation} {poc.firstName}{" "}
																			{poc.lastName}
																		</span>
																	</div>
																	<span className="text-[11px] text-muted-foreground">
																		UID: {poc.uid || "N/A"}
																	</span>
																</div>
															</div>

															{/* Qualification Status Badge */}
															{poc.qualificationStatus &&
																poc.qualificationStatus !== "NONE" && (
																	<Badge
																		className="h-5 px-1.5 text-[10px]"
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

														<div className="mt-3 flex items-center justify-between border-border/60 border-t pt-2.5 text-xs">
															<div className="flex items-center gap-2">
																{poc.leadScore > 0 ? (
																	<span className="flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-semibold text-[10px] text-amber-500">
																		<Sparkles className="h-3 w-3" />
																		Score: {poc.leadScore}
																	</span>
																) : (
																	<span className="text-[11px] text-muted-foreground">
																		Standard Contact
																	</span>
																)}
															</div>

															<div className="flex items-center gap-2 text-muted-foreground">
																{poc.email && (
																	<a
																		className="hover:text-primary"
																		href={`mailto:${poc.email}`}
																		title={poc.email}
																	>
																		<Mail className="h-3.5 w-3.5" />
																	</a>
																)}
																{poc.phone && (
																	<a
																		className="hover:text-primary"
																		href={`tel:${poc.phone}`}
																		title={poc.phone}
																	>
																		<Phone className="h-3.5 w-3.5" />
																	</a>
																)}
															</div>
														</div>
													</div>
												);
											})}
										</div>
									) : (
										<div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 border-dashed p-6 text-center text-muted-foreground">
											<p className="font-medium text-foreground text-xs">
												No contacts linked to this company
											</p>
											<p className="mt-1 text-[11px]">
												Add point-of-contact details for account representatives
												and decision makers.
											</p>
											<Button
												className="mt-3 h-8 gap-1.5 rounded-xl text-xs"
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

								{/* Deal History Section (REQ-43-03) */}
								<div className="rounded-3xl border border-border/70 bg-card/75 p-5 shadow-xs backdrop-blur-md">
									<div className="mb-4 flex items-center justify-between border-border/60 border-b pb-3">
										<div className="flex items-center gap-2">
											<h3 className="font-bold text-base text-foreground tracking-tight">
												Deal History & Pipeline
											</h3>
											<span className="rounded-full bg-accent/80 px-2 py-0.5 font-semibold text-[11px] text-muted-foreground">
												{companyDeals?.length ?? 0}
											</span>
										</div>

										<Button
											className="h-8 gap-1.5 rounded-xl text-xs"
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
											<Loader2 className="h-6 w-6 animate-spin text-primary/70" />
										</div>
									) : companyDeals && companyDeals.length > 0 ? (
										<div className="flex flex-col gap-2.5">
											{companyDeals.map((deal) => (
												<button
													className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border/70 bg-background/60 p-3.5 text-left shadow-2xs transition-all hover:border-primary/50 hover:bg-background/80"
													key={deal.id}
													onClick={() =>
														setSelectedDeal({
															id: deal.id,
															title: deal.title,
														})
													}
													type="button"
												>
													<div className="flex items-center gap-3">
														<div
															className="h-2.5 w-2.5 rounded-full"
															style={{
																backgroundColor: deal.stageColor || "#6366f1",
															}}
														/>
														<div className="flex flex-col">
															<span className="font-semibold text-foreground text-sm hover:text-primary">
																{deal.title}
															</span>
															<span className="text-[11px] text-muted-foreground">
																{deal.stageName} • {deal.pipelineName}
															</span>
														</div>
													</div>

													<div className="flex items-center gap-3">
														<Badge
															className="font-semibold text-xs"
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
															<span className="font-bold text-emerald-500 text-sm tabular-nums">
																$
																{(deal.value / 100).toLocaleString(undefined, {
																	minimumFractionDigits: 0,
																	maximumFractionDigits: 0,
																})}
															</span>
															{deal.expectedCloseDate && (
																<span className="text-[10px] text-muted-foreground">
																	Target:{" "}
																	{new Date(
																		deal.expectedCloseDate,
																	).toLocaleDateString(undefined, {
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
										<div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 border-dashed p-6 text-center text-muted-foreground">
											<p className="font-medium text-foreground text-xs">
												No opportunities linked yet
											</p>
											<p className="mt-1 text-[11px]">
												Create sales opportunities and track proposals through
												your pipeline.
											</p>
											<Button
												className="mt-3 h-8 gap-1.5 rounded-xl text-xs"
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

							{/* Right Column: Sticky Activity Timeline (REQ-43-02) */}
							<div className="flex flex-col gap-4 lg:col-span-5 xl:col-span-4">
								<div className="sticky top-6 rounded-3xl border border-border/70 bg-card/75 p-5 shadow-xs backdrop-blur-md">
									<div className="mb-4 flex items-center justify-between border-border/60 border-b pb-3">
										<div className="flex items-center gap-2">
											<h3 className="font-bold text-base text-foreground tracking-tight">
												Activity Log
											</h3>
										</div>
										<span className="text-[11px] text-muted-foreground">
											Notes, Calls & Meetings
										</span>
									</div>

									<ActivityTimeline companyId={clientId} />
								</div>
							</div>
						</div>
					</TabsContent>

					{/* Financial Ledger & Statements Tab */}
					<TabsContent className="mt-0" value="ledger">
						<div className="rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
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
