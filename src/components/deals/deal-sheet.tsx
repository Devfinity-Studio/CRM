"use client";

import {
	Building2,
	Calendar,
	Loader2,
	Sparkles,
	Trophy,
	User,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ActivityTimeline } from "~/components/crm/activity-timeline";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import { api } from "~/trpc/react";

interface DealSheetProps {
	dealId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	onStatusChange?: () => void;
}

export function DealSheet({
	dealId,
	open,
	onOpenChange,
	title,
	onStatusChange,
}: DealSheetProps) {
	const { data: deal, isLoading } = api.deals.getDeal.useQuery(
		{ dealId: dealId ?? "" },
		{ enabled: !!dealId && open },
	);

	const updateStatus = api.deals.updateDealStatus.useMutation({
		onSuccess: () => {
			toast.success("Deal status updated!");
			onStatusChange?.();
			onOpenChange(false);
		},
		onError: (err) => {
			toast.error(`Failed to update status: ${err.message}`);
		},
	});

	const displayTitle = deal?.title || title || "Deal Details";
	const formattedValue = deal
		? `$${(deal.value / 100).toLocaleString(undefined, {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})}`
		: "$0.00";

	return (
		<Sheet onOpenChange={onOpenChange} open={open}>
			<SheetContent className="w-[420px] overflow-y-auto border-border/80 bg-background/95 p-6 backdrop-blur-xl sm:w-[580px]">
				<SheetHeader className="mb-6 space-y-3 border-border/60 border-b pb-5">
					<div className="flex items-start justify-between gap-3">
						<div className="flex flex-col gap-1">
							<div className="flex items-center gap-2">
								<Badge
									className="font-semibold text-xs"
									variant={
										deal?.status === "WON"
											? "default"
											: deal?.status === "LOST"
												? "destructive"
												: "secondary"
									}
								>
									{deal?.status ?? "OPEN"}
								</Badge>
								{deal?.stage?.name && (
									<span className="rounded-md border border-border/70 bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
										{deal.stage.name}
									</span>
								)}
							</div>
							<SheetTitle className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
								{displayTitle}
							</SheetTitle>
							<SheetDescription className="text-muted-foreground text-xs">
								Pipeline Deal & Client Interaction History
							</SheetDescription>
						</div>

						<div className="flex flex-col items-end">
							<span className="font-bold text-emerald-500 text-xl tracking-tight sm:text-2xl">
								{formattedValue}
							</span>
							<span className="text-[11px] text-muted-foreground">
								Target Value
							</span>
						</div>
					</div>

					{/* Action Buttons: Quick Won / Lost */}
					{dealId && (
						<div className="flex gap-2 pt-2">
							<Button
								className="flex-1 gap-2 rounded-xl bg-emerald-600 font-semibold text-white text-xs shadow-xs hover:bg-emerald-700"
								disabled={updateStatus.isPending || deal?.status === "WON"}
								onClick={() => updateStatus.mutate({ dealId, status: "WON" })}
								size="sm"
							>
								<Trophy className="h-4 w-4" />
								<span>Mark as Won</span>
							</Button>
							<Button
								className="flex-1 gap-2 rounded-xl text-xs shadow-xs"
								disabled={updateStatus.isPending || deal?.status === "LOST"}
								onClick={() => updateStatus.mutate({ dealId, status: "LOST" })}
								size="sm"
								variant="destructive"
							>
								<XCircle className="h-4 w-4" />
								<span>Mark as Lost</span>
							</Button>
						</div>
					)}
				</SheetHeader>

				{isLoading ? (
					<div className="flex h-48 items-center justify-center">
						<Loader2 className="h-6 w-6 animate-spin text-primary/70" />
					</div>
				) : (
					<div className="flex flex-col gap-6">
						{/* Key Properties Grid */}
						<div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-2xs">
							<div className="flex flex-col gap-1">
								<span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
									<Building2 className="h-3.5 w-3.5 text-primary" />
									Company / Client
								</span>
								<span className="font-semibold text-foreground text-xs">
									{deal?.company?.name || "No Company Linked"}
								</span>
							</div>

							<div className="flex flex-col gap-1">
								<span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
									<User className="h-3.5 w-3.5 text-primary" />
									Primary Contact
								</span>
								<span className="font-semibold text-foreground text-xs">
									{deal?.contact
										? `${deal.contact.firstName || ""} ${deal.contact.lastName || ""}`.trim()
										: "No Contact Linked"}
								</span>
							</div>

							<div className="flex flex-col gap-1">
								<span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
									<Calendar className="h-3.5 w-3.5 text-primary" />
									Expected Close
								</span>
								<span className="font-semibold text-foreground text-xs">
									{deal?.expectedCloseDate
										? new Date(deal.expectedCloseDate).toLocaleDateString(
												undefined,
												{
													year: "numeric",
													month: "short",
													day: "numeric",
												},
											)
										: "Not Scheduled"}
								</span>
							</div>

							<div className="flex flex-col gap-1">
								<span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
									<Sparkles className="h-3.5 w-3.5 text-amber-500" />
									Lead Score & Status
								</span>
								<div className="flex items-center gap-1.5">
									<span className="font-semibold text-foreground text-xs">
										{deal?.contact?.leadScore ?? 0}
									</span>
									{deal?.contact?.qualificationStatus &&
										deal.contact.qualificationStatus !== "NONE" && (
											<Badge className="h-4 px-1 text-[9px]" variant="outline">
												{deal.contact.qualificationStatus}
											</Badge>
										)}
								</div>
							</div>
						</div>

						{/* Activity Timeline Section */}
						<div className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<h4 className="font-semibold text-foreground text-sm tracking-tight">
									Activity & Notes
								</h4>
								<span className="text-[11px] text-muted-foreground">
									Engagement History
								</span>
							</div>

							{dealId && <ActivityTimeline dealId={dealId} />}
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
