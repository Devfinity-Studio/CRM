"use client";

import * as React from "react";
import {
	Dialog,
	DialogContent,
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
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Draw Signature</DialogTitle>
				</DialogHeader>
				<div className="py-4">
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
