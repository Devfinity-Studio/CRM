"use client";

import * as React from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import type { GstType, TaxType } from "~/types/document";

interface TaxConfig {
	type: TaxType;
	placeOfSupply?: string;
	gstType?: GstType;
}

interface TaxConfigurationModalProps {
	isOpen: boolean;
	onClose: () => void;
	taxConfig: TaxConfig;
	onSave: (config: TaxConfig) => void;
}

const DEFAULT_TAX_OPTIONS = [
	"none",
	"GST (India)",
	"VAT",
	"PPN",
	"SST",
	"HST",
	"TAX",
];

export function TaxConfigurationModal({
	isOpen,
	onClose,
	taxConfig,
	onSave,
}: TaxConfigurationModalProps) {
	const [config, setConfig] = React.useState<TaxConfig>(taxConfig);
	const [customTax, setCustomTax] = React.useState("");
	const [isAddingCustom, setIsAddingCustom] = React.useState(false);

	// Sync state when modal opens
	React.useEffect(() => {
		if (isOpen) {
			setConfig(taxConfig);
			setIsAddingCustom(false);
			setCustomTax("");
		}
	}, [isOpen, taxConfig]);

	const handleSave = () => {
		onSave(config);
		onClose();
	};

	const isGst = config.type === "GST (India)";

	const handleTaxTypeChange = (value: string) => {
		if (value === "add_new") {
			setIsAddingCustom(true);
			setConfig({ ...config, type: "" });
		} else {
			setIsAddingCustom(false);
			setConfig({
				...config,
				type: value,
				placeOfSupply:
					value === "GST (India)" ? config.placeOfSupply || "" : undefined,
				gstType: value === "GST (India)" ? config.gstType || "IGST" : undefined,
			});
		}
	};

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Configure Tax</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="tax-type">Select Tax Type</Label>
						{!isAddingCustom ? (
							<Select onValueChange={handleTaxTypeChange} value={config.type}>
								<SelectTrigger id="tax-type">
									<SelectValue placeholder="Select tax type" />
								</SelectTrigger>
								<SelectContent>
									{DEFAULT_TAX_OPTIONS.map((opt) => (
										<SelectItem key={opt} value={opt}>
											{opt === "none" ? "None" : opt}
										</SelectItem>
									))}
									{/* If current type is not in defaults, show it */}
									{config.type &&
										!DEFAULT_TAX_OPTIONS.includes(config.type) &&
										config.type !== "none" && (
											<SelectItem value={config.type}>{config.type}</SelectItem>
										)}
									<SelectItem
										className="font-medium text-blue-600"
										value="add_new"
									>
										+ Create New Tax
									</SelectItem>
								</SelectContent>
							</Select>
						) : (
							<div className="flex gap-2">
								<Input
									autoFocus
									onChange={(e) => {
										setCustomTax(e.target.value);
										setConfig({ ...config, type: e.target.value });
									}}
									placeholder="Enter custom tax name"
									value={customTax}
								/>
								<Button
									onClick={() => setIsAddingCustom(false)}
									type="button"
									variant="outline"
								>
									Cancel
								</Button>
							</div>
						)}
					</div>

					{isGst && (
						<>
							<div className="grid gap-2">
								<Label htmlFor="place-of-supply">Place of Supply *</Label>
								<Input
									id="place-of-supply"
									onChange={(e) =>
										setConfig({ ...config, placeOfSupply: e.target.value })
									}
									placeholder="e.g. Maharashtra"
									required
									value={config.placeOfSupply || ""}
								/>
							</div>

							<div className="grid gap-3 pt-2">
								<Label>GST Type *</Label>
								<RadioGroup
									className="flex flex-col gap-2"
									onValueChange={(val) =>
										setConfig({ ...config, gstType: val as GstType })
									}
									value={config.gstType || "IGST"}
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem id="igst" value="IGST" />
										<Label
											className="cursor-pointer font-normal"
											htmlFor="igst"
										>
											IGST (Inter-state)
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem id="cgst" value="CGST & SGST" />
										<Label
											className="cursor-pointer font-normal"
											htmlFor="cgst"
										>
											CGST & SGST (Intra-state)
										</Label>
									</div>
								</RadioGroup>
							</div>
						</>
					)}
				</div>
				<DialogFooter>
					<Button onClick={onClose} variant="outline">
						Cancel
					</Button>
					<Button
						disabled={isGst && (!config.placeOfSupply || !config.gstType)}
						onClick={handleSave}
					>
						Save Tax Configuration
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
