"use client";

import { Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { ClientCreationForm } from "./client-creation-form";

interface ClientCreationModalProps {
	onSuccess?: (client: any) => void;
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function ClientCreationModal({
	onSuccess,
	trigger,
	open,
	onOpenChange,
}: ClientCreationModalProps) {
	const [internalOpen, setInternalOpen] = useState(false);
	const isControlled = open !== undefined;
	const isOpen = isControlled ? open : internalOpen;
	const setOpen = isControlled && onOpenChange ? onOpenChange : setInternalOpen;

	const handleSuccess = (client: any) => {
		setOpen(false);
		if (onSuccess) {
			onSuccess(client);
		}
	};

	return (
		<Dialog onOpenChange={setOpen} open={isOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button className="flex h-8 gap-1" size="sm" variant="outline">
						<Plus className="h-4 w-4" /> Add New Client
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-slate-800 bg-slate-950 text-white">
				<DialogHeader className="mb-0">
					<DialogTitle className="sr-only">Add New Client</DialogTitle>
				</DialogHeader>
				<div className="mt-[-24px]">
					{/* We hide the title above since the form has its own header, or we can let the form render it */}
					<ClientCreationForm isModal onSuccess={handleSuccess} />
				</div>
			</DialogContent>
		</Dialog>
	);
}
