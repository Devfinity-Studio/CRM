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
					<Button className="flex min-h-[40px] gap-1.5" size="sm" variant="outline">
						<Plus className="h-4 w-4 text-primary" /> Add New Client
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border border-border bg-popover text-popover-foreground p-4 sm:p-6 shadow-2xl rounded-2xl sm:rounded-3xl">
				<DialogHeader className="mb-0 sr-only">
					<DialogTitle>Add New Client Profile</DialogTitle>
				</DialogHeader>
				<div>
					<ClientCreationForm isModal onSuccess={handleSuccess} />
				</div>
			</DialogContent>
		</Dialog>
	);
}
