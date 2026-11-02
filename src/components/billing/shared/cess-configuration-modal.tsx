"use client";

import { AlertCircle, Coins } from "lucide-react";
import * as React from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
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
			<DialogContent className="sm:max-w-[460px] rounded-2xl sm:rounded-3xl border border-border bg-popover text-popover-foreground p-5 sm:p-6 shadow-xl">
				<DialogHeader className="space-y-1">
					<div className="flex items-center gap-2">
						<Coins className="h-5 w-5 text-primary" />
						<DialogTitle className="font-bold text-foreground text-xl tracking-tight">
							Configure Regulatory Cess
						</DialogTitle>
					</div>
					<DialogDescription className="text-muted-foreground text-xs sm:text-sm">
						Specify supplementary state or central cess surcharges applicable to invoice line items.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<div className="space-y-1.5">
						<Label htmlFor="cess-type" className="text-xs font-semibold text-foreground">
							Cess Authority Classification
						</Label>
						<Select
							onValueChange={(val) =>
								setConfig({ ...config, type: val as "central" | "state" })
							}
							value={config.type}
						>
							<SelectTrigger id="cess-type" className="min-h-[44px] bg-background border-border text-foreground">
								<SelectValue placeholder="Select cess type" />
							</SelectTrigger>
							<SelectContent className="bg-popover text-popover-foreground border-border">
								<SelectItem value="central">Central Cess (National)</SelectItem>
								<SelectItem value="state">State Cess (Territorial)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="cess-name" className="text-xs font-semibold text-foreground">
							Cess Title / Identifier
						</Label>
						<Input
							id="cess-name"
							className="min-h-[44px] bg-background border-border text-foreground"
							onChange={(e) => setConfig({ ...config, name: e.target.value })}
							placeholder="e.g. Special Disaster Relief Cess"
							value={config.name}
						/>
					</div>

					<div className="flex items-center space-x-3 rounded-xl border border-border bg-muted/20 p-3.5 min-h-[44px]">
						<Checkbox
							checked={config.isReverseCharge}
							id="reverse-charge"
							onCheckedChange={(checked) =>
								setConfig({ ...config, isReverseCharge: checked === true })
							}
						/>
						<Label
							className="font-medium text-xs sm:text-sm text-foreground cursor-pointer"
							htmlFor="reverse-charge"
						>
							Apply reverse charge mechanism (RCM)
						</Label>
					</div>
				</div>

				<DialogFooter className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
					<Button
						className="min-h-[44px] text-destructive hover:bg-destructive/10 self-start sm:self-auto"
						onClick={handleRemove}
						variant="ghost"
						type="button"
					>
						Remove Cess
					</Button>
					<div className="flex items-center gap-2">
						<Button onClick={onClose} variant="outline" className="min-h-[44px]" type="button">
							Cancel
						</Button>
						<Button onClick={handleSave} className="min-h-[44px] px-6 font-semibold shadow-xs" type="button">
							Save Configuration
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
