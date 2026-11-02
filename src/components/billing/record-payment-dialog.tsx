"use client";

import { CreditCard, Loader2 } from "lucide-react";
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
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

interface RecordPaymentDialogProps {
	invoiceId: string;
	invoiceNumber: string;
	balanceDue: number; // in cents
	currency: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function RecordPaymentDialog({
	invoiceId,
	invoiceNumber,
	balanceDue,
	currency,
	open,
	onOpenChange,
	onSuccess,
}: RecordPaymentDialogProps) {
	const [amount, setAmount] = useState<string>((balanceDue / 100).toString());
	const [paymentDate, setPaymentDate] = useState<string>(
		new Date().toISOString().split("T")[0]!,
	);
	const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
	const [referenceNumber, setReferenceNumber] = useState("");
	const [notes, setNotes] = useState("");

	const recordMutation = api.billing.recordPayment.useMutation({
		onSuccess: () => {
			toast.success("Payment recorded successfully.");
			onSuccess();
			onOpenChange(false);

			// Reset form
			setAmount((balanceDue / 100).toString());
			setPaymentMethod("BANK_TRANSFER");
			setReferenceNumber("");
			setNotes("");
		},
		onError: (err) => {
			toast.error(`Failed to record payment: ${err.message}`);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const amountInCents = Math.round(parseFloat(amount) * 100);
		if (isNaN(amountInCents) || amountInCents <= 0) {
			return toast.error("Please enter a valid amount.");
		}
		if (amountInCents > balanceDue) {
			return toast.error("Amount cannot exceed the balance due.");
		}

		recordMutation.mutate({
			invoiceId,
			amount: amountInCents,
			paymentDate: new Date(paymentDate),
			paymentMethod,
			referenceNumber: referenceNumber || undefined,
			notes: notes || undefined,
		});
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-[500px] rounded-2xl sm:rounded-3xl border border-border bg-popover text-popover-foreground p-5 sm:p-6 shadow-xl">
				<DialogHeader className="space-y-1">
					<div className="flex items-center gap-2">
						<CreditCard className="h-5 w-5 text-primary" />
						<DialogTitle className="font-bold text-foreground text-xl tracking-tight">
							Record Payment: {invoiceNumber}
						</DialogTitle>
					</div>
					<DialogDescription className="text-muted-foreground text-xs sm:text-sm">
						Capture offline or external payment against this invoice. Outstanding balance:{" "}
						<strong className="text-foreground font-semibold">
							{new Intl.NumberFormat("en-US", {
								style: "currency",
								currency,
							}).format(balanceDue / 100)}
						</strong>
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-4 pt-2" onSubmit={handleSubmit}>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">
								Amount Received <span className="text-destructive">*</span>
							</Label>
							<Input
								className="min-h-[44px] bg-background border-border text-foreground font-semibold tabular-nums"
								max={balanceDue / 100}
								min="0.01"
								onChange={(e) => setAmount(e.target.value)}
								required
								step="0.01"
								type="number"
								value={amount}
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">
								Payment Date <span className="text-destructive">*</span>
							</Label>
							<Input
								className="min-h-[44px] bg-background border-border text-foreground"
								onChange={(e) => setPaymentDate(e.target.value)}
								required
								type="date"
								value={paymentDate}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">Payment Method</Label>
							<Select onValueChange={setPaymentMethod} value={paymentMethod}>
								<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
									<SelectValue placeholder="Select method" />
								</SelectTrigger>
								<SelectContent className="bg-popover text-popover-foreground border-border">
									<SelectItem value="BANK_TRANSFER">Bank Wire / Transfer</SelectItem>
									<SelectItem value="CASH">Cash Deposit</SelectItem>
									<SelectItem value="CREDIT_CARD">Credit / Debit Card</SelectItem>
									<SelectItem value="CHECK">Commercial Cheque</SelectItem>
									<SelectItem value="OTHER">Other / Alternative</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold text-foreground">Reference / Transaction ID</Label>
							<Input
								className="min-h-[44px] bg-background border-border text-foreground font-mono"
								onChange={(e) => setReferenceNumber(e.target.value)}
								placeholder="e.g. TXN-948194"
								value={referenceNumber}
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs font-semibold text-foreground">Internal Notes (Optional)</Label>
						<Textarea
							className="min-h-[80px] bg-background border-border text-foreground text-xs resize-none"
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Payer confirmation details, bank ref, or settlement notes..."
							value={notes}
						/>
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
							disabled={recordMutation.isPending}
							type="submit"
						>
							{recordMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Recording...
								</>
							) : (
								"Record Payment"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
