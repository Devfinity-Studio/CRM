"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { ActivityTimeline } from "~/components/crm/activity-timeline";
import { Button } from "~/components/ui/button";
import { Trophy, XCircle } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface DealSheetProps {
  dealId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onStatusChange?: () => void;
}

export function DealSheet({ dealId, open, onOpenChange, title, onStatusChange }: DealSheetProps) {
  const updateStatus = api.deals.updateDealStatus.useMutation({
    onSuccess: () => {
      toast.success("Deal status updated!");
      onStatusChange?.();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(`Failed to update status: ${err.message}`);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>Deal activity and details.</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        {dealId && (
          <>
            <div className="flex gap-3 mb-6">
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
                onClick={() => updateStatus.mutate({ dealId, status: "WON" })}
                disabled={updateStatus.isPending}
              >
                <Trophy className="w-4 h-4 mr-2" /> Mark as Won
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => updateStatus.mutate({ dealId, status: "LOST" })}
                disabled={updateStatus.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" /> Mark as Lost
              </Button>
            </div>
            <ActivityTimeline dealId={dealId} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
