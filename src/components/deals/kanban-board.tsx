"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Loader2, DollarSign } from "lucide-react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { DealSheet } from "./deal-sheet";

export function KanbanBoard() {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId as string;

  const [selectedDeal, setSelectedDeal] = useState<{id: string, title: string} | null>(null);

  const { data: pipelines, isLoading: pipelinesLoading } = api.deals.getPipelines.useQuery(
    { organizationId: orgId },
    { enabled: !!orgId }
  );

  const pipelineId = pipelines?.[0]?.id;

  const { data: stages, isLoading: stagesLoading } = api.deals.getStages.useQuery(
    { pipelineId: pipelineId! },
    { enabled: !!pipelineId }
  );

  const { data: deals, isLoading: dealsLoading, refetch } = api.deals.getDeals.useQuery(
    { organizationId: orgId, pipelineId: pipelineId! },
    { enabled: !!pipelineId && !!orgId }
  );

  const moveDealMutation = api.deals.moveDeal.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (err) => {
      toast.error(`Error moving deal: ${err.message}`);
      refetch();
    }
  });

  // Local state for optimistic updates during drag
  const [localDeals, setLocalDeals] = useState<any[]>([]);

  useEffect(() => {
    if (deals) {
      setLocalDeals(deals);
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
    const draggedDealIndex = newDeals.findIndex(d => d.id === draggedDealId);
    
    if (draggedDealIndex > -1) {
      newDeals[draggedDealIndex] = {
        ...newDeals[draggedDealIndex],
        stageId: targetStageId,
        orderIndex: newOrderIndex
      };
      // Simple sorting could be applied here if needed
      setLocalDeals(newDeals);
    }

    moveDealMutation.mutate({
      dealId: draggedDealId,
      targetStageId,
      newOrderIndex
    });
  };

  if (pipelinesLoading || stagesLoading || dealsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No pipeline stages found. Please set up a pipeline first.
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full min-w-max pb-4">
        {stages.map((stage) => {
          const stageDeals = localDeals
            .filter((d) => d.stageId === stage.id)
            .sort((a, b) => a.orderIndex - b.orderIndex);

          const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

          return (
            <div key={stage.id} className="flex flex-col w-80 shrink-0">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-semibold text-sm">{stage.name}</h3>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {stageDeals.length}
                  </Badge>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  ${(stageTotal / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 rounded-md transition-colors ${
                      snapshot.isDraggingOver ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3 min-h-[150px]">
                      {stageDeals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                // Add styling for dragging state if needed
                              }}
                            >
                              <Card 
                                className={`shadow-sm cursor-pointer hover:border-primary/50 transition-colors ${snapshot.isDragging ? 'shadow-md border-primary/50' : ''}`}
                                onClick={() => setSelectedDeal({ id: deal.id, title: deal.title })}
                              >
                                <CardContent className="p-3">
                                  <div className="font-medium text-sm mb-2 flex items-start justify-between gap-2">
                                    <span>{deal.title}</span>
                                    {deal.qualificationStatus && deal.qualificationStatus !== "NONE" && (
                                      <Badge variant={deal.qualificationStatus === "SQL" ? "default" : deal.qualificationStatus === "MQL" ? "secondary" : "destructive"} className="text-[9px] h-4 px-1 shrink-0">
                                        {deal.qualificationStatus}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-xs mb-3">
                                    {deal.companyId ? (
                                      <div className="text-muted-foreground truncate max-w-[120px]">
                                        Client: {deal.companyId}
                                      </div>
                                    ) : <div />}
                                    {deal.leadScore > 0 && (
                                      <div className="text-blue-500 font-medium">Score: {deal.leadScore}</div>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs">
                                    <div className="flex items-center font-medium text-emerald-600 dark:text-emerald-400">
                                      <DollarSign className="w-3 h-3 mr-0.5" />
                                      {(deal.value / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {new Date(deal.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
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
        title={selectedDeal?.title || ""}
        open={!!selectedDeal}
        onOpenChange={(open) => !open && setSelectedDeal(null)}
      />
    </DragDropContext>
  );
}
