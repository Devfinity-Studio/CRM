"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";
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
			onSuccess(); // To refresh the invoice table balance
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
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Payment History: {invoiceNumber}</DialogTitle>
					<DialogDescription>
						View all payments recorded against this invoice.
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="py-8 text-center text-muted-foreground">
						Loading payments...
					</div>
				) : payments && payments.length > 0 ? (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead>Method</TableHead>
								<TableHead>Reference</TableHead>
								<TableHead className="text-right">Amount</TableHead>
								<TableHead></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{payments.map((p) => (
								<TableRow key={p.id}>
									<TableCell>
										{format(new Date(p.paymentDate), "MMM d, yyyy")}
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											{p.paymentMethod.replace("_", " ")}
										</Badge>
									</TableCell>
									<TableCell>{p.referenceNumber || "-"}</TableCell>
									<TableCell className="text-right font-medium">
										{new Intl.NumberFormat("en-US", {
											style: "currency",
											currency: "USD",
										}).format(p.amount / 100)}
									</TableCell>
									<TableCell className="text-right">
										<Button
											className="h-8 px-2 text-destructive"
											disabled={voidMutation.isPending}
											onClick={() => handleVoid(p.id)}
											size="sm"
											variant="ghost"
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Void
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				) : (
					<div className="rounded-md border py-8 text-center text-muted-foreground">
						No payments have been recorded for this invoice.
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
