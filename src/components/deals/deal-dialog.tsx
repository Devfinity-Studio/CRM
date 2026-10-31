"use client";

import { DollarSign, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

interface DealDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	dealId?: string;
	defaultPipelineId?: string;
}

export function DealDialog({
	open,
	onOpenChange,
	dealId: _dealId,
	defaultPipelineId,
}: DealDialogProps) {
	const session = useSession()?.data;
	const orgId = session?.user?.organizationId as string;

	const [title, setTitle] = useState("");
	const [value, setValue] = useState("");
	const [stageId, setStageId] = useState("");
	const [pipelineId, setPipelineId] = useState(defaultPipelineId || "");
	const [companyId, setCompanyId] = useState<string>("");
	const [contactId, setContactId] = useState<string>("");
	const [closeDate, setCloseDate] = useState<string>("");

	const { data: pipelines } = api.deals.getPipelines.useQuery(
		{ organizationId: orgId },
		{ enabled: !!orgId && open },
	);

	useEffect(() => {
		if (defaultPipelineId) {
			setPipelineId(defaultPipelineId);
		} else if (pipelines && pipelines.length > 0 && !pipelineId) {
			setPipelineId(pipelines[0]?.id ?? "");
		}
	}, [defaultPipelineId, pipelines, pipelineId]);

	const { data: stages } = api.deals.getStages.useQuery(
		{ pipelineId: pipelineId },
		{ enabled: !!pipelineId && open },
	);

	useEffect(() => {
		if (stages && stages.length > 0 && !stageId) {
			setStageId(stages[0]?.id ?? "");
		}
	}, [stages, stageId]);

	const { data: companies } = api.crm.getCompanies.useQuery(undefined, {
		enabled: open,
	});

	const { data: contacts } = api.crm.getContacts.useQuery(undefined, {
		enabled: open,
	});

	const trpcContext = api.useUtils();

	const createDeal = api.deals.createDeal.useMutation({
		onSuccess: () => {
			toast.success("Deal created successfully");
			trpcContext.deals.getDeals.invalidate();
			trpcContext.deals.getMetricsSummary.invalidate();
			onOpenChange(false);
			resetForm();
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const resetForm = () => {
		setTitle("");
		setValue("");
		setCompanyId("");
		setContactId("");
		setCloseDate("");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!title || !pipelineId || !stageId) return;

		createDeal.mutate({
			organizationId: orgId,
			title,
			value: Math.round(parseFloat(value || "0") * 100), // convert to cents
			pipelineId,
			stageId,
			companyId: companyId || undefined,
			contactId: contactId || undefined,
			expectedCloseDate: closeDate ? new Date(closeDate) : undefined,
		});
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-[500px] rounded-3xl border border-border/80 bg-background/95 p-6 backdrop-blur-xl">
				<DialogHeader className="space-y-1">
					<DialogTitle className="font-bold text-foreground text-xl tracking-tight">
						Create New Deal
					</DialogTitle>
					<DialogDescription className="text-muted-foreground text-xs">
						Add an opportunity to your sales pipeline with stage targets.
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-4 pt-2" onSubmit={handleSubmit}>
					<div className="space-y-1.5">
						<Label className="text-xs" htmlFor="deal-title">
							Deal Title <span className="text-destructive">*</span>
						</Label>
						<Input
							className="h-9 rounded-xl border-border/80 bg-background text-xs"
							id="deal-title"
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. Acme Corp Enterprise Platform"
							required
							value={title}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs" htmlFor="deal-value">
								Value ($)
							</Label>
							<div className="relative">
								<DollarSign className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									className="h-9 rounded-xl border-border/80 bg-background pl-8 text-xs"
									id="deal-value"
									min="0"
									onChange={(e) => setValue(e.target.value)}
									placeholder="15000"
									step="0.01"
									type="number"
									value={value}
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs" htmlFor="close-date">
								Expected Close Date
							</Label>
							<div className="relative">
								<Input
									className="h-9 rounded-xl border-border/80 bg-background text-xs"
									id="close-date"
									onChange={(e) => setCloseDate(e.target.value)}
									type="date"
									value={closeDate}
								/>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs">Pipeline</Label>
							<Select
								disabled={!pipelines || pipelines.length === 0}
								onValueChange={setPipelineId}
								value={pipelineId}
							>
								<SelectTrigger className="h-9 rounded-xl border-border/80 bg-background text-xs">
									<SelectValue placeholder="Select pipeline" />
								</SelectTrigger>
								<SelectContent>
									{pipelines?.map((pipe) => (
										<SelectItem key={pipe.id} value={pipe.id}>
											{pipe.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs">Stage</Label>
							<Select
								disabled={!stages || stages.length === 0}
								onValueChange={setStageId}
								value={stageId}
							>
								<SelectTrigger className="h-9 rounded-xl border-border/80 bg-background text-xs">
									<SelectValue placeholder="Select stage" />
								</SelectTrigger>
								<SelectContent>
									{stages?.map((stage) => (
										<SelectItem key={stage.id} value={stage.id}>
											{stage.name} ({stage.winProbability}%)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs">Client Company</Label>
							<Select onValueChange={setCompanyId} value={companyId}>
								<SelectTrigger className="h-9 rounded-xl border-border/80 bg-background text-xs">
									<SelectValue placeholder="Link company (optional)" />
								</SelectTrigger>
								<SelectContent>
									{companies?.map((comp) => (
										<SelectItem key={comp.id} value={comp.id}>
											{comp.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs">Primary Contact</Label>
							<Select onValueChange={setContactId} value={contactId}>
								<SelectTrigger className="h-9 rounded-xl border-border/80 bg-background text-xs">
									<SelectValue placeholder="Link contact (optional)" />
								</SelectTrigger>
								<SelectContent>
									{contacts?.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.firstName} {c.lastName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter className="pt-3">
						<Button
							className="h-9 rounded-xl text-xs"
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="h-9 rounded-xl bg-primary px-4 font-semibold text-primary-foreground text-xs shadow-xs hover:bg-primary/90"
							disabled={createDeal.isPending || !title || !stageId}
							type="submit"
						>
							{createDeal.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create Opportunity"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
