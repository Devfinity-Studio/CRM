"use client";

import { PenTool } from "lucide-react";
import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { SignaturePad } from "~/components/ui/signature-pad";

interface SignaturePadModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (dataUrl: string) => void;
}

export function SignaturePadModal({
	isOpen,
	onClose,
	onSave,
}: SignaturePadModalProps) {
	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<DialogContent className="sm:max-w-[520px] rounded-2xl sm:rounded-3xl border border-border bg-popover text-popover-foreground p-5 sm:p-6 shadow-xl">
				<DialogHeader className="space-y-1">
					<div className="flex items-center gap-2">
						<PenTool className="h-5 w-5 text-primary" />
						<DialogTitle className="font-bold text-foreground text-xl tracking-tight">
							Authorized Signature
						</DialogTitle>
					</div>
					<DialogDescription className="text-muted-foreground text-xs sm:text-sm">
						Draw your signature below to attach onto quotes and official tax invoice documents.
					</DialogDescription>
				</DialogHeader>
				<div className="py-2">
					<SignaturePad
						onClear={() => {}}
						onSave={(url) => {
							onSave(url);
							onClose();
						}}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
