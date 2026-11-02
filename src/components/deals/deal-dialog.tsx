"use client";

import { DollarSign, Loader2, Sparkles } from "lucide-react";
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
	defaultCompanyId?: string;
}

export function DealDialog({
	open,
	onOpenChange,
	dealId: _dealId,
	defaultPipelineId,
	defaultCompanyId,
}: DealDialogProps) {
	const session = useSession()?.data;
	const orgId = session?.user?.organizationId as string;

	const [title, setTitle] = useState("");
	const [value, setValue] = useState("");
	const [stageId, setStageId] = useState("");
	const [pipelineId, setPipelineId] = useState(defaultPipelineId || "");
	const [companyId, setCompanyId] = useState<string>(defaultCompanyId || "");
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

	useEffect(() => {
		if (defaultCompanyId && !companyId) {
			setCompanyId(defaultCompanyId);
		}
	}, [defaultCompanyId, companyId]);

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
			if (companyId) {
				trpcContext.deals.getDealsByCompanyId.invalidate({ companyId });
			}
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
		setCompanyId(defaultCompanyId || "");
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
			companyId: companyId && companyId !== "none" ? companyId : undefined,
			contactId: contactId && contactId !== "none" ? contactId : undefined,
			expectedCloseDate: closeDate ? new Date(closeDate) : undefined,
		});
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-[540px] rounded-2xl sm:rounded-3xl border border-border bg-popover text-popover-foreground p-5 sm:p-6 shadow-xl">
				<DialogHeader className="space-y-1">
					<div className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary" />
						<DialogTitle className="font-bold text-foreground text-xl tracking-tight">
							Create New Opportunity
						</DialogTitle>
					</div>
					<DialogDescription className="text-muted-foreground text-xs sm:text-sm">
						Add a sales deal to your pipeline and configure targeted close projections.
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-4 pt-2" onSubmit={handleSubmit}>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground" htmlFor="deal-title">
							Deal Title <span className="text-destructive">*</span>
						</Label>
						<Input
							className="min-h-[44px] bg-background border-border text-foreground"
							id="deal-title"
							onChange={(e) => setTitle(e.target.value)}
							placeholder="e.g. Acme Corp Enterprise Platform Expansion"
							required
							value={title}
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground" htmlFor="deal-value">
								Estimated Value ($)
							</Label>
							<div className="relative">
								<DollarSign className="absolute top-3.5 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									className="min-h-[44px] pl-9 bg-background border-border text-foreground tabular-nums"
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
							<Label className="text-xs font-semibold text-foreground" htmlFor="close-date">
								Target Close Date
							</Label>
							<Input
								className="min-h-[44px] bg-background border-border text-foreground"
								id="close-date"
								onChange={(e) => setCloseDate(e.target.value)}
								type="date"
								value={closeDate}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">Pipeline <span className="text-destructive">*</span></Label>
							<Select
								disabled={!pipelines || pipelines.length === 0}
								onValueChange={setPipelineId}
								value={pipelineId}
							>
								<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
									<SelectValue placeholder="Select pipeline" />
								</SelectTrigger>
								<SelectContent className="bg-popover text-popover-foreground border-border">
									{pipelines?.map((pipe) => (
										<SelectItem key={pipe.id} value={pipe.id}>
											{pipe.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">Initial Stage <span className="text-destructive">*</span></Label>
							<Select
								disabled={!stages || stages.length === 0}
								onValueChange={setStageId}
								value={stageId}
							>
								<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
									<SelectValue placeholder="Select stage" />
								</SelectTrigger>
								<SelectContent className="bg-popover text-popover-foreground border-border">
									{stages?.map((stage) => (
										<SelectItem key={stage.id} value={stage.id}>
											{stage.name} ({stage.winProbability}%)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">Client Organization</Label>
							<Select onValueChange={setCompanyId} value={companyId}>
								<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
									<SelectValue placeholder="Link company (optional)" />
								</SelectTrigger>
								<SelectContent className="max-h-[220px] bg-popover text-popover-foreground border-border">
									<SelectItem value="none">None (Individual Deal)</SelectItem>
									{companies?.map((comp) => (
										<SelectItem key={comp.id} value={comp.id}>
											{comp.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">Designated Contact</Label>
							<Select onValueChange={setContactId} value={contactId}>
								<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
									<SelectValue placeholder="Link contact (optional)" />
								</SelectTrigger>
								<SelectContent className="max-h-[220px] bg-popover text-popover-foreground border-border">
									<SelectItem value="none">None (No primary contact)</SelectItem>
									{contacts?.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.firstName} {c.lastName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
						<Button
							className="min-h-[44px] px-4"
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="min-h-[44px] px-6 font-semibold shadow-xs"
							disabled={createDeal.isPending || !title || !stageId}
							type="submit"
						>
							{createDeal.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating Opportunity...
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
