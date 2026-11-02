"use client";

import { FileSpreadsheet, Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
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

interface GenerateStatementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function GenerateStatementDialog({
	open,
	onOpenChange,
	onSuccess,
}: GenerateStatementDialogProps) {
	const [companyId, setCompanyId] = useState("");
	const [startDate, setStartDate] = useState<string>(
		new Date(new Date().getFullYear(), new Date().getMonth(), 1)
			.toISOString()
			.split("T")[0]!,
	);
	const [endDate, setEndDate] = useState<string>(
		new Date().toISOString().split("T")[0]!,
	);

	const { data: clients } = api.crm.getCompanies.useQuery();

	const generateMutation = api.billing.generateStatement.useMutation({
		onSuccess: () => {
			toast.success("Statement generated successfully.");
			onSuccess();
			onOpenChange(false);
			setCompanyId("");
		},
		onError: (err) => {
			toast.error(`Failed to generate statement: ${err.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!companyId) return toast.error("Please select a client.");
		if (!startDate || !endDate)
			return toast.error("Please select a valid date range.");

		const start = new Date(startDate);
		const end = new Date(endDate);
		end.setHours(23, 59, 59, 999);

		if (start > end) return toast.error("Start date must be before end date.");

		generateMutation.mutate({
			companyId,
			startDate: start,
			endDate: end,
		});
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-[480px] rounded-2xl sm:rounded-3xl border border-border bg-popover text-popover-foreground p-5 sm:p-6 shadow-xl">
				<DialogHeader className="space-y-1">
					<div className="flex items-center gap-2">
						<FileSpreadsheet className="h-5 w-5 text-primary" />
						<DialogTitle className="font-bold text-foreground text-xl tracking-tight">
							Generate Account Statement
						</DialogTitle>
					</div>
					<DialogDescription className="text-muted-foreground text-xs sm:text-sm">
						Compile an immutable ledger statement and balance summary over a date range.
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-4 pt-2" onSubmit={handleSubmit}>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground">
							Client Organization <span className="text-destructive">*</span>
						</Label>
						<Select onValueChange={setCompanyId} value={companyId}>
							<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
								<SelectValue placeholder="Select client organization" />
							</SelectTrigger>
							<SelectContent className="max-h-[260px] bg-popover text-popover-foreground border-border">
								{clients?.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">
								Start Date <span className="text-destructive">*</span>
							</Label>
							<Input
								className="min-h-[44px] bg-background border-border text-foreground"
								onChange={(e) => setStartDate(e.target.value)}
								required
								type="date"
								value={startDate}
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">
								End Date <span className="text-destructive">*</span>
							</Label>
							<Input
								className="min-h-[44px] bg-background border-border text-foreground"
								onChange={(e) => setEndDate(e.target.value)}
								required
								type="date"
								value={endDate}
							/>
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
							disabled={generateMutation.isPending || !companyId}
							type="submit"
						>
							{generateMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Generating Statement...
								</>
							) : (
								"Generate Statement"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
