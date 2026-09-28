"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // If dealId is provided, edit mode. Otherwise, create mode.
  dealId?: string;
}

export function DealDialog({ open, onOpenChange, dealId }: DealDialogProps) {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId as string;

  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stageId, setStageId] = useState("");
  const [pipelineId, setPipelineId] = useState("");

  const { data: pipelines } = api.deals.getPipelines.useQuery(
    { organizationId: orgId },
    { enabled: !!orgId && open }
  );

  useEffect(() => {
    if (pipelines && pipelines.length > 0 && !pipelineId) {
      setPipelineId(pipelines[0].id);
    }
  }, [pipelines, pipelineId]);

  const { data: stages } = api.deals.getStages.useQuery(
    { pipelineId: pipelineId },
    { enabled: !!pipelineId && open }
  );

  useEffect(() => {
    if (stages && stages.length > 0 && !stageId) {
      setStageId(stages[0].id);
    }
  }, [stages, stageId]);

  const trpcContext = api.useUtils();

  const createDeal = api.deals.createDeal.useMutation({
    onSuccess: () => {
      toast.success("Deal created successfully");
      trpcContext.deals.getDeals.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const resetForm = () => {
    setTitle("");
    setValue("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pipelineId || !stageId) return;

    createDeal.mutate({
      organizationId: orgId,
      title,
      value: parseInt(value || "0") * 100, // convert to cents
      pipelineId,
      stageId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
          <DialogDescription>
            Add a new deal to your pipeline to track potential revenue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Deal Title</Label>
            <Input
              id="title"
              placeholder="e.g. Acme Corp Enterprise Plan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value ($)</Label>
            <Input
              id="value"
              type="number"
              placeholder="1000"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={stageId} onValueChange={setStageId} disabled={!stages || stages.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {stages?.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDeal.isPending || !title || !stageId}>
              {createDeal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
