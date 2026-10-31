"use client";

import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import {
	Calendar,
	DollarSign,
	ExternalLink,
	Loader2,
	MoreHorizontal,
	Plus,
	Sparkles,
	Target,
	Trophy,
	User,
	XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";
import { DealSheet } from "./deal-sheet";

interface DealItem {
	id: string;
	title: string;
	value: number;
	stageId: string;
	orderIndex: number;
	status: "OPEN" | "WON" | "LOST";
	expectedCloseDate?: Date | string | null;
	companyName?: string | null;
	companyLogo?: string | null;
	contactName?: string | null;
	leadScore?: number;
	qualificationStatus?: string;
	assignedUserName?: string | null;
	assignedUserImage?: string | null;
	createdAt?: Date | string;
}

interface KanbanBoardProps {
	pipelineId?: string;
	onNewDeal?: () => void;
}

export function KanbanBoard({
	pipelineId: propPipelineId,
	onNewDeal,
}: KanbanBoardProps) {
	const session = useSession()?.data;
	const orgId = session?.user?.organizationId as string;

	const [selectedDeal, setSelectedDeal] = useState<{
		id: string;
		title: string;
	} | null>(null);

	const { data: pipelines, isLoading: pipelinesLoading } =
		api.deals.getPipelines.useQuery(
			{ organizationId: orgId },
			{ enabled: !!orgId },
		);

	const activePipelineId = propPipelineId || pipelines?.[0]?.id || "";

	const { data: stages, isLoading: stagesLoading } =
		api.deals.getStages.useQuery(
			{ pipelineId: activePipelineId },
			{ enabled: !!activePipelineId },
		);

	const {
		data: deals,
		isLoading: dealsLoading,
		refetch,
	} = api.deals.getDeals.useQuery(
		{ organizationId: orgId, pipelineId: activePipelineId },
		{ enabled: !!activePipelineId && !!orgId },
	);

	const utils = api.useUtils();

	const moveDealMutation = api.deals.moveDeal.useMutation({
		onSuccess: () => {
			utils.deals.getMetricsSummary.invalidate();
			refetch();
		},
		onError: (err) => {
			toast.error(`Error moving deal: ${err.message}`);
			refetch();
		},
	});

	const updateStatusMutation = api.deals.updateDealStatus.useMutation({
		onSuccess: () => {
			toast.success("Deal status updated!");
			utils.deals.getMetricsSummary.invalidate();
			refetch();
		},
		onError: (err) => {
			toast.error(`Failed to update status: ${err.message}`);
		},
	});

	// Local state for optimistic updates during drag
	const [localDeals, setLocalDeals] = useState<DealItem[]>([]);

	useEffect(() => {
		if (deals) {
			setLocalDeals(
				deals.filter((d) => d.status === "OPEN") as unknown as DealItem[],
			);
		}
	}, [deals]);

	const onDragEnd = (result: DropResult) => {
		const { source, destination, draggableId } = result;

		if (!destination) return;
		if (
			source.droppableId === destination.droppableId &&
			source.index === destination.index
		) {
			return;
		}

		const draggedDealId = draggableId;
		const targetStageId = destination.droppableId;
		const newOrderIndex = destination.index;

		// Optimistic update
		const newDeals = Array.from(localDeals);
		const draggedDealIndex = newDeals.findIndex((d) => d.id === draggedDealId);

		if (draggedDealIndex > -1) {
			const item = newDeals[draggedDealIndex];
			if (item) {
				newDeals[draggedDealIndex] = {
					...item,
					stageId: targetStageId,
					orderIndex: newOrderIndex,
				};
				setLocalDeals(newDeals);
			}
		}

		moveDealMutation.mutate({
			dealId: draggedDealId,
			targetStageId,
			newOrderIndex,
		});
	};

	if (pipelinesLoading || stagesLoading || dealsLoading) {
		return (
			<div className="flex h-full min-h-[350px] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary/70" />
			</div>
		);
	}

	if (!stages || stages.length === 0) {
		return (
			<div className="flex h-full min-h-[350px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
				<Target className="h-10 w-10 text-muted-foreground/40" />
				<div>
					<p className="font-semibold text-foreground text-sm">
						No pipeline stages found
					</p>
					<p className="text-xs">
						Create pipeline stages or switch pipelines to view deals.
					</p>
				</div>
			</div>
		);
	}

	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<div className="flex h-full min-w-max gap-4 overflow-x-auto pb-4">
				{stages.map((stage) => {
					const stageDeals = localDeals
						.filter((d) => d.stageId === stage.id)
						.sort((a, b) => a.orderIndex - b.orderIndex);

					const stageTotal = stageDeals.reduce(
						(sum, d) => sum + (d.value || 0),
						0,
					);

					return (
						<div
							className="flex w-[320px] shrink-0 flex-col rounded-2xl border border-border/70 bg-card/60 p-3 shadow-xs backdrop-blur-md"
							key={stage.id}
						>
							{/* Stage Column Header */}
							<div className="mb-3 flex flex-col gap-1.5 border-border/60 border-b pb-2.5">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div
											className="h-2.5 w-2.5 rounded-full ring-2 ring-offset-1"
											style={{
												backgroundColor: stage.color,
												boxShadow: `0 0 8px ${stage.color}80`,
											}}
										/>
										<h3 className="font-semibold text-foreground text-sm tracking-tight">
											{stage.name}
										</h3>
										<span className="rounded-full bg-accent/80 px-2 py-0.5 font-semibold text-[11px] text-muted-foreground">
											{stageDeals.length}
										</span>
									</div>

									<div className="flex items-center gap-1.5">
										<Badge
											className="font-medium text-[10px]"
											variant="outline"
										>
											{stage.winProbability}% Win
										</Badge>
										{onNewDeal && (
											<button
												className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
												onClick={onNewDeal}
												title="Add deal to stage"
												type="button"
											>
												<Plus className="h-3.5 w-3.5" />
											</button>
										)}
									</div>
								</div>

								<div className="flex items-center justify-between px-0.5 text-xs">
									<span className="text-[11px] text-muted-foreground">
										Stage Total
									</span>
									<span className="font-semibold text-foreground text-xs tabular-nums">
										$
										{(stageTotal / 100).toLocaleString(undefined, {
											minimumFractionDigits: 0,
											maximumFractionDigits: 0,
										})}
									</span>
								</div>
							</div>

							{/* Droppable Stage Bucket */}
							<Droppable droppableId={stage.id}>
								{(provided, snapshot) => (
									<div
										{...provided.droppableProps}
										className={`flex-1 rounded-xl p-1 transition-colors ${
											snapshot.isDraggingOver
												? "bg-primary/5 ring-1 ring-primary/20"
												: ""
										}`}
										ref={provided.innerRef}
									>
										<div className="flex min-h-[200px] flex-col gap-3">
											{stageDeals.length === 0 && !snapshot.isDraggingOver && (
												<div className="flex h-32 flex-col items-center justify-center rounded-xl border border-border/40 border-dashed p-4 text-center">
													<p className="text-[11px] text-muted-foreground/60">
														No deals in this stage
													</p>
												</div>
											)}

											{stageDeals.map((deal, index) => {
												const companyInitials = (deal.companyName || "NA")
													.split(" ")
													.map((w) => w[0])
													.join("")
													.toUpperCase()
													.slice(0, 2);

												const userInitials = (deal.assignedUserName || "NA")
													.split(" ")
													.map((w) => w[0])
													.join("")
													.toUpperCase()
													.slice(0, 2);

												// Close date urgency
												let closeUrgency: "normal" | "soon" | "overdue" =
													"normal";
												if (deal.expectedCloseDate) {
													const close = new Date(deal.expectedCloseDate);
													const now = new Date();
													const diffDays = Math.ceil(
														(close.getTime() - now.getTime()) /
															(1000 * 60 * 60 * 24),
													);
													if (diffDays < 0) closeUrgency = "overdue";
													else if (diffDays <= 7) closeUrgency = "soon";
												}

												return (
													<Draggable
														draggableId={deal.id}
														index={index}
														key={deal.id}
													>
														{(provided, snapshot) => (
															<div
																ref={provided.innerRef}
																{...provided.draggableProps}
																{...provided.dragHandleProps}
																style={{
																	...provided.draggableProps.style,
																}}
															>
																{/* biome-ignore lint/a11y/useSemanticElements: card container has nested interactive menu */}
																<div
																	className={`group relative cursor-pointer rounded-xl border border-border/70 bg-card/90 p-3.5 shadow-xs transition-all hover:border-primary/50 hover:shadow-md ${
																		snapshot.isDragging
																			? "rotate-1 scale-[1.02] border-primary shadow-xl ring-2 ring-primary/20"
																			: ""
																	}`}
																	onClick={() =>
																		setSelectedDeal({
																			id: deal.id,
																			title: deal.title,
																		})
																	}
																	onKeyDown={(e) => {
																		if (e.key === "Enter" || e.key === " ") {
																			e.preventDefault();
																			setSelectedDeal({
																				id: deal.id,
																				title: deal.title,
																			});
																		}
																	}}
																	role="button"
																	tabIndex={0}
																>
																	{/* Card Top: Company Avatar & Quick Menu */}
																	<div className="mb-2 flex items-center justify-between gap-2">
																		<div className="flex items-center gap-2 overflow-hidden">
																			<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 font-bold text-[10px] text-primary">
																				{companyInitials}
																			</div>
																			<span className="truncate font-medium text-muted-foreground text-xs">
																				{deal.companyName || "Direct Contact"}
																			</span>
																		</div>

																		<div
																			className="flex items-center gap-1"
																			onPointerDown={(e) => e.stopPropagation()}
																		>
																			{deal.qualificationStatus &&
																				deal.qualificationStatus !== "NONE" && (
																					<span
																						className={`rounded-full px-1.5 py-0.2 font-semibold text-[9px] ${
																							deal.qualificationStatus === "SQL"
																								? "border border-primary/20 bg-primary/10 text-primary"
																								: deal.qualificationStatus ===
																										"MQL"
																									? "border border-blue-500/20 bg-blue-500/10 text-blue-500"
																									: "bg-muted text-muted-foreground"
																						}`}
																					>
																						{deal.qualificationStatus}
																					</span>
																				)}

																			<DropdownMenu>
																				<DropdownMenuTrigger asChild>
																					<button
																						className="h-6 w-6 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
																						type="button"
																					>
																						<MoreHorizontal className="h-4 w-4" />
																					</button>
																				</DropdownMenuTrigger>
																				<DropdownMenuContent
																					align="end"
																					className="w-36 rounded-xl border-border/80 bg-popover/95 text-xs backdrop-blur-md"
																				>
																					<DropdownMenuItem
																						onClick={() =>
																							setSelectedDeal({
																								id: deal.id,
																								title: deal.title,
																							})
																						}
																					>
																						<ExternalLink className="mr-2 h-3.5 w-3.5" />
																						View Details
																					</DropdownMenuItem>
																					<DropdownMenuSeparator />
																					<DropdownMenuItem
																						className="text-emerald-500 hover:text-emerald-600 focus:text-emerald-600"
																						onClick={() =>
																							updateStatusMutation.mutate({
																								dealId: deal.id,
																								status: "WON",
																							})
																						}
																					>
																						<Trophy className="mr-2 h-3.5 w-3.5" />
																						Mark Won
																					</DropdownMenuItem>
																					<DropdownMenuItem
																						className="text-destructive hover:text-destructive focus:text-destructive"
																						onClick={() =>
																							updateStatusMutation.mutate({
																								dealId: deal.id,
																								status: "LOST",
																							})
																						}
																					>
																						<XCircle className="mr-2 h-3.5 w-3.5" />
																						Mark Lost
																					</DropdownMenuItem>
																				</DropdownMenuContent>
																			</DropdownMenu>
																		</div>
																	</div>

																	{/* Deal Title */}
																	<h4 className="line-clamp-2 font-semibold text-foreground text-sm tracking-tight transition-colors group-hover:text-primary">
																		{deal.title}
																	</h4>

																	{/* Middle Metadata: Lead Score / Tags */}
																	{deal.leadScore && deal.leadScore > 0 ? (
																		<div className="mt-2 flex items-center gap-1.5">
																			<div className="flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-500">
																				<Sparkles className="h-3 w-3" />
																				<span className="font-semibold">
																					Score: {deal.leadScore}
																				</span>
																			</div>
																		</div>
																	) : null}

																	{/* Card Bottom: Value, Date, Avatar */}
																	<div className="mt-3 flex items-center justify-between border-border/60 border-t pt-2.5 text-xs">
																		<div className="flex items-center font-bold text-emerald-500 text-sm tabular-nums">
																			<DollarSign className="mr-0.5 h-3.5 w-3.5" />
																			{(deal.value / 100).toLocaleString(
																				undefined,
																				{
																					minimumFractionDigits: 0,
																					maximumFractionDigits: 0,
																				},
																			)}
																		</div>

																		<div className="flex items-center gap-2">
																			{deal.expectedCloseDate && (
																				<div
																					className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] ${
																						closeUrgency === "overdue"
																							? "border border-red-500/20 bg-red-500/10 font-semibold text-red-500"
																							: closeUrgency === "soon"
																								? "border border-amber-500/20 bg-amber-500/10 font-medium text-amber-500"
																								: "text-muted-foreground"
																					}`}
																				>
																					<Calendar className="h-3 w-3" />
																					<span>
																						{new Date(
																							deal.expectedCloseDate,
																						).toLocaleDateString(undefined, {
																							month: "short",
																							day: "numeric",
																						})}
																					</span>
																				</div>
																			)}

																			<div
																				className="flex h-5 w-5 items-center justify-center rounded-full bg-accent font-semibold text-[9px] text-foreground"
																				title={
																					deal.assignedUserName
																						? `Owner: ${deal.assignedUserName}`
																						: "Unassigned"
																				}
																			>
																				{userInitials !== "NA" ? (
																					userInitials
																				) : (
																					<User className="h-3 w-3 text-muted-foreground" />
																				)}
																			</div>
																		</div>
																	</div>
																</div>
															</div>
														)}
													</Draggable>
												);
											})}
											{provided.placeholder}
										</div>
									</div>
								)}
							</Droppable>
						</div>
					);
				})}
			</div>

			<DealSheet
				dealId={selectedDeal?.id || null}
				onOpenChange={(open) => !open && setSelectedDeal(null)}
				onStatusChange={() => {
					utils.deals.getMetricsSummary.invalidate();
					refetch();
				}}
				open={!!selectedDeal}
				title={selectedDeal?.title || ""}
			/>
		</DragDropContext>
	);
}
