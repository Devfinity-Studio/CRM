"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";

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
				<Button>
					<Plus className="mr-2 h-4 w-4" /> New Automation Rule
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Create Automation Rule</DialogTitle>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label>Rule Name</Label>
						<Input
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. 3 Days Overdue Nudge"
							required
							value={name}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Trigger</Label>
							<Select
								onValueChange={(v: any) => setTriggerType(v)}
								value={triggerType}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="INVOICE_DUE">Invoice Due</SelectItem>
									<SelectItem value="QUOTE_SENT">Quote Sent</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Days Offset</Label>
							<Input
								onChange={(e) => setDaysOffset(e.target.value)}
								required
								type="number"
								value={daysOffset}
							/>
							<p className="text-muted-foreground text-xs">
								Negative for before due, positive for after.
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Action Type</Label>
						<Select
							onValueChange={(v: any) => setActionType(v)}
							value={actionType}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="SEND_EMAIL">Send Email</SelectItem>
								<SelectItem value="INTERNAL_ALERT">
									Internal Staff Alert
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{actionType === "SEND_EMAIL" && (
						<>
							<div className="space-y-2">
								<Label>Email Subject</Label>
								<Input
									onChange={(e) => setSubject(e.target.value)}
									placeholder="Follow up..."
									required
									value={subject}
								/>
							</div>
							<div className="space-y-2">
								<Label>Email Body</Label>
								<Textarea
									onChange={(e) => setBody(e.target.value)}
									placeholder="Hello..."
									required
									value={body}
								/>
							</div>
						</>
					)}

					<div className="flex justify-end pt-4">
						<Button disabled={createRule.isPending} type="submit">
							{createRule.isPending ? "Saving..." : "Create Rule"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
