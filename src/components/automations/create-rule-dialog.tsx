"use client";

import { Loader2, Plus, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

export function CreateRuleDialog() {
	const [open, setOpen] = useState(false);
	const router = useRouter();

	const [name, setName] = useState("");
	const [triggerType, setTriggerType] = useState<"INVOICE_DUE" | "QUOTE_SENT">(
		"INVOICE_DUE",
	);
	const [daysOffset, setDaysOffset] = useState("0");
	const [actionType, setActionType] = useState<"SEND_EMAIL" | "INTERNAL_ALERT">(
		"SEND_EMAIL",
	);
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");

	const utils = api.useUtils();
	const createRule = api.automations.createRule.useMutation({
		onSuccess: () => {
			utils.automations.getRules.invalidate();
			setOpen(false);
			setName("");
			setSubject("");
			setBody("");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createRule.mutate({
			name,
			triggerType,
			daysOffset: parseInt(daysOffset, 10),
			actionType,
			actionPayload: { subject, body },
		});
	};

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button className="min-h-[44px] gap-2 font-semibold shadow-xs">
					<Plus className="h-4 w-4" /> New Automation Rule
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-[480px] rounded-2xl sm:rounded-3xl border border-border bg-popover text-popover-foreground p-5 sm:p-6 shadow-xl">
				<DialogHeader className="space-y-1">
					<div className="flex items-center gap-2">
						<Zap className="h-5 w-5 text-primary" />
						<DialogTitle className="font-bold text-foreground text-xl tracking-tight">
							Create Automation Rule
						</DialogTitle>
					</div>
					<DialogDescription className="text-muted-foreground text-xs sm:text-sm">
						Set up event triggers for automated client follow-ups and internal staff notifications.
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-4 pt-2" onSubmit={handleSubmit}>
					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground">
							Rule Name <span className="text-destructive">*</span>
						</Label>
						<Input
							className="min-h-[44px] bg-background border-border text-foreground"
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. 3 Days Overdue Payment Reminder"
							required
							value={name}
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">Trigger Event</Label>
							<Select
								onValueChange={(v: any) => setTriggerType(v)}
								value={triggerType}
							>
								<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-popover text-popover-foreground border-border">
									<SelectItem value="INVOICE_DUE">Invoice Due Date</SelectItem>
									<SelectItem value="QUOTE_SENT">Quote Delivered</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">Days Offset</Label>
							<Input
								className="min-h-[44px] bg-background border-border text-foreground tabular-nums"
								onChange={(e) => setDaysOffset(e.target.value)}
								required
								type="number"
								value={daysOffset}
							/>
							<p className="text-[11px] text-muted-foreground">
								Negative = days before; Positive = days after.
							</p>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground">Action Type</Label>
						<Select
							onValueChange={(v: any) => setActionType(v)}
							value={actionType}
						>
							<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="bg-popover text-popover-foreground border-border">
								<SelectItem value="SEND_EMAIL">Send Automated Email</SelectItem>
								<SelectItem value="INTERNAL_ALERT">
									Internal Staff Notification
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{actionType === "SEND_EMAIL" && (
						<div className="space-y-3 pt-1 border-t border-border">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-foreground">
									Email Subject <span className="text-destructive">*</span>
								</Label>
								<Input
									className="min-h-[44px] bg-background border-border text-foreground"
									onChange={(e) => setSubject(e.target.value)}
									placeholder="Friendly reminder regarding your invoice..."
									required
									value={subject}
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold text-foreground">
									Email Template Body <span className="text-destructive">*</span>
								</Label>
								<Textarea
									className="min-h-[100px] bg-background border-border text-foreground text-xs resize-none"
									onChange={(e) => setBody(e.target.value)}
									placeholder="Dear customer, this is an automated notification regarding..."
									required
									value={body}
								/>
							</div>
						</div>
					)}

					<DialogFooter className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
						<Button
							className="min-h-[44px] px-4"
							onClick={() => setOpen(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							className="min-h-[44px] px-6 font-semibold shadow-xs"
							disabled={createRule.isPending}
							type="submit"
						>
							{createRule.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving Rule...
								</>
							) : (
								"Create Rule"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
