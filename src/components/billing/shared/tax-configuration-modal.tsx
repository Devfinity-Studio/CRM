"use client";

import { Percent } from "lucide-react";
import * as React from "react";
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
			<DialogContent className="sm:max-w-[460px] rounded-2xl sm:rounded-3xl border border-border bg-popover text-popover-foreground p-5 sm:p-6 shadow-xl">
				<DialogHeader className="space-y-1">
					<div className="flex items-center gap-2">
						<Percent className="h-5 w-5 text-primary" />
						<DialogTitle className="font-bold text-foreground text-xl tracking-tight">
							Configure Tax Regime
						</DialogTitle>
					</div>
					<DialogDescription className="text-muted-foreground text-xs sm:text-sm">
						Set billing tax classification, place of supply, and inter/intra-state rules.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label htmlFor="tax-type" className="text-xs font-semibold text-foreground">
							Select Tax Type <span className="text-destructive">*</span>
						</Label>
						{!isAddingCustom ? (
							<Select onValueChange={handleTaxTypeChange} value={config.type}>
								<SelectTrigger id="tax-type" className="min-h-[44px] bg-background border-border text-foreground">
									<SelectValue placeholder="Select tax type" />
								</SelectTrigger>
								<SelectContent className="bg-popover text-popover-foreground border-border">
									{DEFAULT_TAX_OPTIONS.map((opt) => (
										<SelectItem key={opt} value={opt}>
											{opt === "none" ? "None (Zero-rated / Export)" : opt}
										</SelectItem>
									))}
									{config.type &&
										!DEFAULT_TAX_OPTIONS.includes(config.type) &&
										config.type !== "none" && (
											<SelectItem value={config.type}>{config.type}</SelectItem>
										)}
									<SelectItem
										className="font-semibold text-primary"
										value="add_new"
									>
										+ Create Custom Tax Type
									</SelectItem>
								</SelectContent>
							</Select>
						) : (
							<div className="flex gap-2">
								<Input
									autoFocus
									className="min-h-[44px] bg-background border-border text-foreground flex-1"
									onChange={(e) => {
										setCustomTax(e.target.value);
										setConfig({ ...config, type: e.target.value });
									}}
									placeholder="e.g. Sales Tax (California)"
									value={customTax}
								/>
								<Button
									className="min-h-[44px]"
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
						<div className="space-y-4 pt-2 border-t border-border">
							<div className="space-y-1.5">
								<Label htmlFor="place-of-supply" className="text-xs font-semibold text-foreground">
									Place of Supply (State / Territory) <span className="text-destructive">*</span>
								</Label>
								<Input
									id="place-of-supply"
									className="min-h-[44px] bg-background border-border text-foreground"
									onChange={(e) =>
										setConfig({ ...config, placeOfSupply: e.target.value })
									}
									placeholder="e.g. Maharashtra, Karnataka, Delhi"
									required
									value={config.placeOfSupply || ""}
								/>
							</div>

							<div className="space-y-2">
								<Label className="text-xs font-semibold text-foreground">
									GST Application Mode <span className="text-destructive">*</span>
								</Label>
								<RadioGroup
									className="flex flex-col gap-2 pt-1"
									onValueChange={(val) =>
										setConfig({ ...config, gstType: val as GstType })
									}
									value={config.gstType || "IGST"}
								>
									<Label
										className="flex items-center space-x-3 rounded-xl border border-border bg-muted/20 p-3 hover:bg-muted/40 cursor-pointer min-h-[44px]"
										htmlFor="igst"
									>
										<RadioGroupItem id="igst" value="IGST" />
										<div>
											<span className="font-semibold text-xs sm:text-sm text-foreground block">
												IGST (Inter-state Supply)
											</span>
											<span className="text-[11px] text-muted-foreground">
												Combined integrated goods and services tax rate.
											</span>
										</div>
									</Label>
									<Label
										className="flex items-center space-x-3 rounded-xl border border-border bg-muted/20 p-3 hover:bg-muted/40 cursor-pointer min-h-[44px]"
										htmlFor="cgst"
									>
										<RadioGroupItem id="cgst" value="CGST & SGST" />
										<div>
											<span className="font-semibold text-xs sm:text-sm text-foreground block">
												CGST & SGST (Intra-state Supply)
											</span>
											<span className="text-[11px] text-muted-foreground">
												Split equally between central and state tax authorities.
											</span>
										</div>
									</Label>
								</RadioGroup>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
					<Button onClick={onClose} variant="outline" className="min-h-[44px]">
						Cancel
					</Button>
					<Button
						className="min-h-[44px] px-6 font-semibold shadow-xs"
						disabled={isGst && (!config.placeOfSupply || !config.gstType)}
						onClick={handleSave}
					>
						Save Configuration
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
