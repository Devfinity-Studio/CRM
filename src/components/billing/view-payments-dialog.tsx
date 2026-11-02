"use client";

import { format } from "date-fns";
import { History, Loader2, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

interface ViewPaymentsDialogProps {
	invoiceId: string;
	invoiceNumber: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function ViewPaymentsDialog({
	invoiceId,
	invoiceNumber,
	open,
	onOpenChange,
	onSuccess,
}: ViewPaymentsDialogProps) {
	const {
		data: payments,
		isLoading,
		refetch,
	} = api.billing.getPaymentsByInvoice.useQuery(
		{ invoiceId },
		{ enabled: open },
	);

	const voidMutation = api.billing.voidPayment.useMutation({
		onSuccess: () => {
			toast.success("Payment voided successfully.");
			refetch();
			onSuccess();
		},
		onError: (err) => {
			toast.error(`Failed to void payment: ${err.message}`);
		},
	});

	const handleVoid = (paymentId: string) => {
		if (
			confirm(
				"Are you sure you want to void this payment? This will restore the invoice balance.",
			)
		) {
			voidMutation.mutate({ paymentId });
		}
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-2xl rounded-2xl sm:rounded-3xl border border-border bg-popover text-popover-foreground p-5 sm:p-6 shadow-xl">
				<DialogHeader className="space-y-1">
					<div className="flex items-center gap-2">
						<History className="h-5 w-5 text-primary" />
						<DialogTitle className="font-bold text-foreground text-xl tracking-tight">
							Payment History: {invoiceNumber}
						</DialogTitle>
					</div>
					<DialogDescription className="text-muted-foreground text-xs sm:text-sm">
						Review transactions and settlements credited against this invoice.
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex justify-center p-8 text-muted-foreground">
						<Loader2 className="h-6 w-6 animate-spin text-primary" />
					</div>
				) : payments && payments.length > 0 ? (
					<div className="rounded-xl border border-border overflow-hidden mt-3">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="border-border bg-muted/30">
										<TableHead className="text-xs font-semibold text-muted-foreground">Payment Date</TableHead>
										<TableHead className="text-xs font-semibold text-muted-foreground">Method</TableHead>
										<TableHead className="text-xs font-semibold text-muted-foreground">Reference</TableHead>
										<TableHead className="text-right text-xs font-semibold text-muted-foreground">Amount</TableHead>
										<TableHead className="text-right text-xs font-semibold text-muted-foreground">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{payments.map((p) => (
										<TableRow key={p.id} className="border-border hover:bg-muted/20">
											<TableCell className="text-xs text-foreground font-medium">
												{format(new Date(p.paymentDate), "MMM d, yyyy")}
											</TableCell>
											<TableCell>
												<Badge variant="outline" className="text-[10px] font-semibold">
													{p.paymentMethod.replace("_", " ")}
												</Badge>
											</TableCell>
											<TableCell className="text-xs font-mono text-muted-foreground">
												{p.referenceNumber || "—"}
											</TableCell>
											<TableCell className="text-right font-bold text-xs tabular-nums text-foreground">
												{new Intl.NumberFormat("en-US", {
													style: "currency",
													currency: "USD",
												}).format(p.amount / 100)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													className="min-h-[36px] px-2.5 text-xs text-destructive hover:bg-destructive/10"
													disabled={voidMutation.isPending}
													onClick={() => handleVoid(p.id)}
													size="sm"
													variant="ghost"
												>
													<Trash2 className="mr-1.5 h-3.5 w-3.5" />
													Void
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				) : (
					<div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground space-y-1 mt-3">
						<p className="font-semibold text-foreground">No payments recorded yet</p>
						<p>Use &ldquo;Record Payment&rdquo; to add offline settlements.</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
