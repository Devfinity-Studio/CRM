"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { ActivityTimeline } from "~/components/crm/activity-timeline";

interface DealSheetProps {
  dealId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
}

export function DealSheet({ dealId, open, onOpenChange, title }: DealSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Deal activity and details.
          </SheetDescription>
        </SheetHeader>
        
        {dealId && (
          <ActivityTimeline dealId={dealId} />
        )}
      </SheetContent>
    </Sheet>
  );
}
