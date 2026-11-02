"use client";

import { Loader2, UserPlus } from "lucide-react";
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

interface AddPocDialogProps {
	companyId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddPocDialog({
	companyId,
	open,
	onOpenChange,
}: AddPocDialogProps) {
	const [salutation, setSalutation] = useState("Mr.");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [leadScore, setLeadScore] = useState<number>(0);
	const [qualificationStatus, setQualificationStatus] = useState<
		"NONE" | "MQL" | "SQL"
	>("NONE");

	const utils = api.useUtils();

	const createContact = api.crm.createContact.useMutation({
		onSuccess: () => {
			toast.success("Point of Contact added successfully");
			utils.crm.getPOCsByCompanyId.invalidate({ companyId });
			onOpenChange(false);
			resetForm();
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const resetForm = () => {
		setSalutation("Mr.");
		setFirstName("");
		setLastName("");
		setEmail("");
		setPhone("");
		setLeadScore(0);
		setQualificationStatus("NONE");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!firstName.trim()) return;

		createContact.mutate({
			companyId,
			salutation,
			firstName: firstName.trim(),
			lastName: lastName.trim() || undefined,
			email: email.trim() || undefined,
			phone: phone.trim() || undefined,
			leadScore: Number(leadScore) || 0,
			qualificationStatus,
		});
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-[480px] rounded-2xl sm:rounded-3xl border border-border bg-popover text-popover-foreground p-5 sm:p-6 shadow-xl">
				<DialogHeader className="space-y-1">
					<div className="flex items-center gap-2">
						<UserPlus className="h-5 w-5 text-primary" />
						<DialogTitle className="font-bold text-foreground text-xl tracking-tight">
							Add Point of Contact
						</DialogTitle>
					</div>
					<DialogDescription className="text-muted-foreground text-xs sm:text-sm">
						Create and link a designated contact person for this client company.
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-4 pt-2" onSubmit={handleSubmit}>
					<div className="grid grid-cols-4 gap-2.5">
						<div className="col-span-1 space-y-1.5">
							<Label className="text-xs font-semibold text-foreground" htmlFor="poc-salutation">
								Title
							</Label>
							<Select onValueChange={setSalutation} value={salutation}>
								<SelectTrigger
									className="min-h-[44px] bg-background border-border text-foreground"
									id="poc-salutation"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-popover text-popover-foreground border-border">
									<SelectItem value="Mr.">Mr.</SelectItem>
									<SelectItem value="Ms.">Ms.</SelectItem>
									<SelectItem value="Mrs.">Mrs.</SelectItem>
									<SelectItem value="Dr.">Dr.</SelectItem>
									<SelectItem value="Prof.">Prof.</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="col-span-3 space-y-1.5">
							<Label className="text-xs font-semibold text-foreground" htmlFor="poc-first-name">
								First Name <span className="text-destructive">*</span>
							</Label>
							<Input
								className="min-h-[44px] bg-background border-border text-foreground"
								id="poc-first-name"
								onChange={(e) => setFirstName(e.target.value)}
								placeholder="e.g. Jane"
								required
								value={firstName}
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground" htmlFor="poc-last-name">
							Last Name
						</Label>
						<Input
							className="min-h-[44px] bg-background border-border text-foreground"
							id="poc-last-name"
							onChange={(e) => setLastName(e.target.value)}
							placeholder="e.g. Smith"
							value={lastName}
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground" htmlFor="poc-email">
								Work Email
							</Label>
							<Input
								className="min-h-[44px] bg-background border-border text-foreground"
								id="poc-email"
								onChange={(e) => setEmail(e.target.value)}
								placeholder="jane@company.com"
								type="email"
								value={email}
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground" htmlFor="poc-phone">
								Phone Number
							</Label>
							<Input
								className="min-h-[44px] bg-background border-border text-foreground"
								id="poc-phone"
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+1 (555) 000-0000"
								value={phone}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground" htmlFor="poc-score">
								Lead Score
							</Label>
							<Input
								className="min-h-[44px] bg-background border-border text-foreground tabular-nums"
								id="poc-score"
								min="0"
								onChange={(e) => setLeadScore(Number(e.target.value) || 0)}
								placeholder="0"
								type="number"
								value={leadScore}
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">Qualification Status</Label>
							<Select
								onValueChange={(val: "NONE" | "MQL" | "SQL") =>
									setQualificationStatus(val)
								}
								value={qualificationStatus}
							>
								<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-popover text-popover-foreground border-border">
									<SelectItem value="NONE">Unqualified</SelectItem>
									<SelectItem value="MQL">MQL (Marketing Qualified)</SelectItem>
									<SelectItem value="SQL">SQL (Sales Qualified)</SelectItem>
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
							disabled={createContact.isPending || !firstName.trim()}
							type="submit"
						>
							{createContact.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Adding Contact...
								</>
							) : (
								"Add Contact"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
