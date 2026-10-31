"use client";

import * as React from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
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

interface CessConfig {
	enabled: boolean;
	type: "central" | "state";
	name: string;
	isReverseCharge: boolean;
}

interface CessConfigurationModalProps {
	isOpen: boolean;
	onClose: () => void;
	cessConfig: CessConfig;
	onSave: (config: CessConfig) => void;
}

export function CessConfigurationModal({
	isOpen,
	onClose,
	cessConfig,
	onSave,
}: CessConfigurationModalProps) {
	const [config, setConfig] = React.useState<CessConfig>(cessConfig);

	React.useEffect(() => {
		if (isOpen) {
			// Default enabled to true when opening this modal
			setConfig({ ...cessConfig, enabled: true });
		}
	}, [isOpen, cessConfig]);

	const handleSave = () => {
		onSave(config);
		onClose();
	};

	const handleRemove = () => {
		onSave({ ...config, enabled: false, name: "" });
		onClose();
	};

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Configure Cess</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="cess-type">Cess Type</Label>
						<Select
							onValueChange={(val) =>
								setConfig({ ...config, type: val as "central" | "state" })
							}
							value={config.type}
						>
							<SelectTrigger id="cess-type">
								<SelectValue placeholder="Select cess type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="central">Central Cess</SelectItem>
								<SelectItem value="state">State Cess</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="cess-name">Cess Name</Label>
						<Input
							id="cess-name"
							onChange={(e) => setConfig({ ...config, name: e.target.value })}
							placeholder="e.g. Kerala Flood Cess"
							value={config.name}
						/>
					</div>

					<div className="flex items-center space-x-2 pt-2">
						<Checkbox
							checked={config.isReverseCharge}
							id="reverse-charge"
							onCheckedChange={(checked) =>
								setConfig({ ...config, isReverseCharge: checked === true })
							}
						/>
						<Label
							className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							htmlFor="reverse-charge"
						>
							Is reverse charge applicable?
						</Label>
					</div>
				</div>
				<DialogFooter className="flex w-full items-center justify-between sm:justify-between">
					<Button
						className="text-red-600 hover:bg-red-50 hover:text-red-700"
						onClick={handleRemove}
						variant="ghost"
					>
						Remove Cess
					</Button>
					<div className="flex gap-2">
						<Button onClick={onClose} variant="outline">
							Cancel
						</Button>
						<Button onClick={handleSave}>Save</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
