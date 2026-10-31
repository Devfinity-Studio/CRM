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
			<DialogContent className="max-w-[460px] rounded-3xl border border-border/80 bg-background/95 p-6 backdrop-blur-xl">
				<DialogHeader className="space-y-1">
					<DialogTitle className="flex items-center gap-2 font-bold text-foreground text-xl tracking-tight">
						<UserPlus className="h-5 w-5 text-primary" />
						Add Point of Contact
					</DialogTitle>
					<DialogDescription className="text-muted-foreground text-xs">
						Create and link a designated contact person for this client company.
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-4 pt-2" onSubmit={handleSubmit}>
					<div className="grid grid-cols-4 gap-2.5">
						<div className="col-span-1 space-y-1.5">
							<Label className="text-xs" htmlFor="poc-salutation">
								Title
							</Label>
							<Select onValueChange={setSalutation} value={salutation}>
								<SelectTrigger
									className="h-9 rounded-xl border-border/80 bg-background text-xs"
									id="poc-salutation"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Mr.">Mr.</SelectItem>
									<SelectItem value="Ms.">Ms.</SelectItem>
									<SelectItem value="Mrs.">Mrs.</SelectItem>
									<SelectItem value="Dr.">Dr.</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="col-span-3 space-y-1.5">
							<Label className="text-xs" htmlFor="poc-first-name">
								First Name <span className="text-destructive">*</span>
							</Label>
							<Input
								className="h-9 rounded-xl border-border/80 bg-background text-xs"
								id="poc-first-name"
								onChange={(e) => setFirstName(e.target.value)}
								placeholder="e.g. Jane"
								required
								value={firstName}
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs" htmlFor="poc-last-name">
							Last Name
						</Label>
						<Input
							className="h-9 rounded-xl border-border/80 bg-background text-xs"
							id="poc-last-name"
							onChange={(e) => setLastName(e.target.value)}
							placeholder="e.g. Smith"
							value={lastName}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs" htmlFor="poc-email">
								Work Email
							</Label>
							<Input
								className="h-9 rounded-xl border-border/80 bg-background text-xs"
								id="poc-email"
								onChange={(e) => setEmail(e.target.value)}
								placeholder="jane@company.com"
								type="email"
								value={email}
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs" htmlFor="poc-phone">
								Phone Number
							</Label>
							<Input
								className="h-9 rounded-xl border-border/80 bg-background text-xs"
								id="poc-phone"
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+1 (555) 000-0000"
								value={phone}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs" htmlFor="poc-score">
								Lead Score
							</Label>
							<Input
								className="h-9 rounded-xl border-border/80 bg-background text-xs"
								id="poc-score"
								min="0"
								onChange={(e) => setLeadScore(Number(e.target.value) || 0)}
								placeholder="0"
								type="number"
								value={leadScore}
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs">Qualification Status</Label>
							<Select
								onValueChange={(val: "NONE" | "MQL" | "SQL") =>
									setQualificationStatus(val)
								}
								value={qualificationStatus}
							>
								<SelectTrigger className="h-9 rounded-xl border-border/80 bg-background text-xs">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="NONE">Unqualified</SelectItem>
									<SelectItem value="MQL">MQL (Marketing Qualified)</SelectItem>
									<SelectItem value="SQL">SQL (Sales Qualified)</SelectItem>
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
							disabled={createContact.isPending || !firstName.trim()}
							type="submit"
						>
							{createContact.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Adding...
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
