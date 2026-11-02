"use client";

import { CheckCircle2, Eraser, PenLine, ShieldCheck } from "lucide-react";
import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { toast } from "sonner";
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
import { api } from "~/trpc/react";

interface QuoteSignDialogProps {
	quoteId: string;
	quoteNumber?: string;
	totalAmountFormatted: string;
	onSigned?: (signatureData: string, signatureName: string) => void;
}

export function QuoteSignDialog({
	quoteId,
	quoteNumber,
	totalAmountFormatted,
	onSigned,
}: QuoteSignDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [signerName, setSignerName] = useState("");
	const [signerEmail, setSignerEmail] = useState("");
	const [isAgreed, setIsAgreed] = useState(false);
	const [isEmptyCanvas, setIsEmptyCanvas] = useState(true);

	const sigPadRef = useRef<SignatureCanvas | null>(null);

	const signQuote = api.public.signQuote.useMutation({
		onSuccess: (res) => {
			toast.success("Quote accepted and digitally signed!");
			setIsOpen(false);
			if (res.quote) {
				onSigned?.(res.quote.signatureData || "", res.quote.signatureName || "");
			}
		},
		onError: (err) => {
			toast.error(err.message || "Failed to sign quote");
		},
	});

	const handleClear = () => {
		sigPadRef.current?.clear();
		setIsEmptyCanvas(true);
	};

	const handleSubmit = () => {
		if (!signerName.trim()) {
			toast.error("Please enter your full legal name");
			return;
		}

		if (sigPadRef.current?.isEmpty()) {
			toast.error("Please draw your signature in the signature area");
			return;
		}

		const dataUrl = sigPadRef.current?.toDataURL("image/png");
		if (!dataUrl) {
			toast.error("Signature capture failed");
			return;
		}

		signQuote.mutate({
			id: quoteId,
			signatureData: dataUrl,
			signatureName: signerName.trim(),
			signerEmail: signerEmail.trim() || undefined,
		});
	};

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger asChild>
				<Button className="min-h-[44px] gap-2 bg-emerald-600 px-5 text-white shadow-md hover:bg-emerald-700">
					<PenLine className="h-4 w-4" />
					Accept & Sign Proposal
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-lg p-6">
				<DialogHeader>
					<div className="flex items-center gap-2 text-emerald-600">
						<ShieldCheck className="h-5 w-5" />
						<span className="font-semibold text-xs tracking-wider uppercase">
							Legally Binding E-Signature
						</span>
					</div>
					<DialogTitle className="text-xl">
						Accept Proposal {quoteNumber ? `#${quoteNumber}` : ""}
					</DialogTitle>
					<DialogDescription>
						Please review the contract total of{" "}
						<strong className="text-foreground">{totalAmountFormatted}</strong> and draw
						your signature below to digitally accept this proposal.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="grid gap-2">
						<Label htmlFor="signer-name">
							Full Legal Name <span className="text-destructive">*</span>
						</Label>
						<Input
							id="signer-name"
							onChange={(e) => setSignerName(e.target.value)}
							placeholder="e.g. Jane Doe"
							value={signerName}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="signer-email">Email Address (Optional)</Label>
						<Input
							id="signer-email"
							onChange={(e) => setSignerEmail(e.target.value)}
							placeholder="jane@company.com"
							type="email"
							value={signerEmail}
						/>
					</div>

					<div className="grid gap-2">
						<div className="flex items-center justify-between">
							<Label>
								Draw Your Signature <span className="text-destructive">*</span>
							</Label>
							<Button
								className="h-7 text-xs text-muted-foreground hover:text-foreground"
								onClick={handleClear}
								size="sm"
								type="button"
								variant="ghost"
							>
								<Eraser className="mr-1 h-3 w-3" />
								Clear
							</Button>
						</div>
						<div className="overflow-hidden rounded-xl border border-border bg-white shadow-xs">
							<SignatureCanvas
								backgroundColor="#ffffff"
								canvasProps={{
									className: "w-full h-36 cursor-crosshair touch-none",
								}}
								onBegin={() => setIsEmptyCanvas(false)}
								penColor="#000000"
								ref={(ref) => {
									sigPadRef.current = ref;
								}}
							/>
						</div>
						<p className="text-[11px] text-muted-foreground">
							Use your stylus, mouse, or touch device to sign within the box.
						</p>
					</div>

					<div className="flex items-start gap-2.5 pt-1">
						<input
							checked={isAgreed}
							className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
							id="legal-consent"
							onChange={(e) => setIsAgreed(e.target.checked)}
							type="checkbox"
						/>
						<Label
							className="font-normal text-xs leading-relaxed text-muted-foreground"
							htmlFor="legal-consent"
						>
							I confirm that I am authorized to accept this proposal on behalf of
							my organization and understand that this digital signature is legally
							binding under the ESIGN Act and applicable e-signature laws.
						</Label>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-0">
					<Button
						onClick={() => setIsOpen(false)}
						type="button"
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
						disabled={
							signQuote.isPending || !signerName.trim() || !isAgreed || isEmptyCanvas
						}
						onClick={handleSubmit}
						type="button"
					>
						<CheckCircle2 className="h-4 w-4" />
						{signQuote.isPending ? "Signing..." : "Confirm & Sign"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

