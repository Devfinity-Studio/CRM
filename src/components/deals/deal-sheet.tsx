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
			<SheetContent className="w-full max-w-full overflow-y-auto border-border/80 bg-background/95 p-4 sm:p-6 backdrop-blur-xl sm:max-w-xl">
				<SheetHeader className="mb-6 space-y-3 border-border/60 border-b pb-5">
					<div className="flex items-start justify-between gap-3">
						<div className="flex flex-col gap-1">
							<div className="flex items-center gap-2">
								<span className="font-semibold text-primary text-xs uppercase tracking-wider">
									Pipeline Deal
								</span>
								{deal?.status && (
									<Badge
										className="text-[10px]"
										variant={
											deal.status === "WON"
												? "success"
												: deal.status === "LOST"
													? "destructive"
													: "secondary"
										}
									>
										{deal.status}
									</Badge>
								)}
							</div>
							<SheetTitle className="font-bold text-foreground text-xl">
								{displayTitle}
							</SheetTitle>
							<SheetDescription className="text-muted-foreground text-xs">
								Deal ID: {dealId || "N/A"}
							</SheetDescription>
						</div>

						{/* Quick Stage Status Action Buttons */}
						<div className="flex items-center gap-1.5">
							{deal?.status === "OPEN" && (
								<>
									<Button
										className="h-8 gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
										disabled={updateStatus.isPending}
										onClick={() =>
											dealId && updateStatus.mutate({ dealId, status: "WON" })
										}
										size="sm"
										variant="outline"
									>
										<Trophy className="h-3.5 w-3.5" />
										<span>Mark Won</span>
									</Button>
									<Button
										className="h-8 gap-1 border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
										disabled={updateStatus.isPending}
										onClick={() =>
											dealId && updateStatus.mutate({ dealId, status: "LOST" })
										}
										size="sm"
										variant="outline"
									>
										<XCircle className="h-3.5 w-3.5" />
										<span>Mark Lost</span>
									</Button>
								</>
							)}
						</div>
					</div>

					{/* High-Impact Stat Strip */}
					<div className="grid grid-cols-2 gap-3 rounded-xl border border-border/70 bg-card/75 p-3.5 shadow-2xs backdrop-blur-md">
						<div className="flex flex-col">
							<span className="font-medium text-muted-foreground text-xs">
								Deal Value
							</span>
							<span className="font-bold font-mono text-foreground text-xl">
								{formattedValue}
							</span>
						</div>
						<div className="flex flex-col">
							<span className="font-medium text-muted-foreground text-xs">
								Assigned Owner
							</span>
							<span className="font-semibold text-foreground text-sm">
								{deal?.assignedUser?.name || "Unassigned"}
							</span>
						</div>
					</div>
				</SheetHeader>

				{isLoading ? (
					<div className="flex justify-center p-8">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<div className="space-y-6">
						{/* Key Metadata Grid */}
						<div className="grid grid-cols-2 gap-3 text-xs">
							<div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5">
								<Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
								<div className="flex flex-col truncate">
									<span className="text-[10px] text-muted-foreground">
										Company
									</span>
									<span className="truncate font-medium text-foreground">
										{deal?.company?.name || "None"}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5">
								<User className="h-4 w-4 shrink-0 text-muted-foreground" />
								<div className="flex flex-col truncate">
									<span className="text-[10px] text-muted-foreground">
										Primary Contact
									</span>
									<span className="truncate font-medium text-foreground">
										{deal?.contact
											? `${deal.contact.firstName} ${deal.contact.lastName || ""}`
											: "None"}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5">
								<Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
								<div className="flex flex-col truncate">
									<span className="text-[10px] text-muted-foreground">
										Target Close Date
									</span>
									<span className="truncate font-medium text-foreground">
										{deal?.expectedCloseDate
											? new Date(deal.expectedCloseDate).toLocaleDateString()
											: "Not set"}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5">
								<Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
								<div className="flex flex-col truncate">
									<span className="text-[10px] text-muted-foreground">
										Stage Probability
									</span>
									<span className="truncate font-medium text-foreground">
										{deal?.stage?.winProbability ?? 0}% Win Chance
									</span>
								</div>
							</div>
						</div>

						{/* Full Chronological Activity Timeline Component */}
						<div className="border-border/60 border-t pt-5">
							<h4 className="mb-4 font-bold text-foreground text-sm">
								Deal Activity Timeline &amp; Notes
							</h4>
							<ActivityTimeline
								companyId={deal?.companyId ?? undefined}
								dealId={dealId ?? undefined}
							/>
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
