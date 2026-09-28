"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { api } from "~/trpc/react";
import { KanbanBoard } from "~/components/deals/kanban-board";
import { Button } from "~/components/ui/button";
import { Plus, BarChart3, Loader2 } from "lucide-react";
import Link from "next/link";
import { DealDialog } from "~/components/deals/deal-dialog";

export default function DealsPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId as string;
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);

  // Fetch pipelines to get the default/active pipeline
  const { data: pipelines, isLoading: pipelinesLoading } = api.deals.getPipelines.useQuery(
    { organizationId: orgId },
    { enabled: !!orgId }
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Deals & Pipeline</h2>
            <p className="text-muted-foreground">
              Manage your sales pipeline and track deal progress.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" asChild>
              <Link href="/deals/forecast">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Forecast
              </Link>
            </Button>
            <Button onClick={() => setDealDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Button>
          </div>
        </div>

        {/* Board Area */}
        <div className="h-[calc(100vh-220px)] bg-muted/20 rounded-xl border border-border p-4 overflow-x-auto">
          <KanbanBoard />
        </div>
      </div>
      
      <DealDialog open={dealDialogOpen} onOpenChange={setDealDialogOpen} />
    </DashboardLayout>
  );
}
