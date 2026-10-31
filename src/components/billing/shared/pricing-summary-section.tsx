"use client";

import { Eye, EyeOff, IndianRupee, Percent, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import type { DiscountType, DocumentData } from "~/types/document";
import { CessConfigurationModal } from "./cess-configuration-modal";
import { TaxConfigurationModal } from "./tax-configuration-modal";

interface PricingSummarySectionProps {
	data: DocumentData;
	onChange: (data: DocumentData) => void;
	subtotal: number;
}

export function PricingSummarySection({
	data,
	onChange,
	subtotal,
}: PricingSummarySectionProps) {
	const [taxModalOpen, setTaxModalOpen] = React.useState(false);
	const [cessModalOpen, setCessModalOpen] = React.useState(false);

	// Handlers for Eye toggles
	const toggleTotalSection = () =>
		onChange({ ...data, showTotalSection: !data.showTotalSection });
	const toggleTotalInWords = () =>
		onChange({ ...data, showTotalInWords: !data.showTotalInWords });

	// Capitalize first letter of each word
	const handleWordsChange = (val: string) => {
		const capitalized = val.replace(/\b\w/g, (char) => char.toUpperCase());
		onChange({ ...data, totalInWordsValue: capitalized });
	};

	return (
		<div className="mt-8 space-y-8">
			{/* TOTAL SECTION */}
			<div>
				<div className="mb-4 flex items-center gap-2">
					<Button
						className="h-auto p-0 text-muted-foreground hover:text-foreground"
						onClick={toggleTotalSection}
						size="sm"
						variant="ghost"
					>
						{data.showTotalSection ? (
							<Eye className="mr-2 h-4 w-4" />
						) : (
							<EyeOff className="mr-2 h-4 w-4" />
						)}
						Show Total in PDF
					</Button>
				</div>

				<div
					className={cn(
						"rounded-lg border bg-card p-6 transition-all duration-300",
						!data.showTotalSection &&
							"pointer-events-none opacity-50 grayscale",
					)}
				>
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
						{/* Left Column: Action Buttons & Configurations */}
						<div className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Button
									onClick={() => setTaxModalOpen(true)}
									size="sm"
									variant="outline"
								>
									<Percent className="mr-2 h-4 w-4" />
									{data.taxConfig.type && data.taxConfig.type !== "none"
										? `Tax: ${data.taxConfig.type}`
										: "Add GST/Tax"}
								</Button>

								<Button
									onClick={() => setCessModalOpen(true)}
									size="sm"
									variant="outline"
								>
									<Plus className="mr-2 h-4 w-4" />
									{data.cessConfig?.enabled
										? `Cess: ${data.cessConfig.name}`
										: "Add Cess"}
								</Button>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size="sm" variant="outline">
											<Plus className="mr-2 h-4 w-4" /> Add Discount
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem
											onClick={() =>
												onChange({
													...data,
													discount: { ...data.discount, type: "total" },
												})
											}
										>
											Discount on Total
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												onChange({
													...data,
													discount: { ...data.discount, type: "item" },
												})
											}
										>
											Item-wise Discount
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>

								{!data.additionalCharges.amount &&
									data.additionalCharges.amount !== 0 && (
										<Button
											onClick={() =>
												onChange({
													...data,
													additionalCharges: {
														...data.additionalCharges,
														amount: 0,
													},
												})
											}
											size="sm"
											variant="outline"
										>
											<Plus className="mr-2 h-4 w-4" /> Add Additional Charges
										</Button>
									)}
							</div>

							{/* Configurations Summary Text */}
							{data.taxConfig.type === "GST (India)" && (
								<div className="mt-2 rounded bg-slate-50 p-2 text-muted-foreground text-sm">
									<p>
										<strong>GST Type:</strong> {data.taxConfig.gstType}
									</p>
									<p>
										<strong>Place of Supply:</strong>{" "}
										{data.taxConfig.placeOfSupply}
									</p>
								</div>
							)}
						</div>

						{/* Right Column: Calculations & Totals */}
						<div className="space-y-3">
							<div className="flex items-center justify-between py-2 text-sm">
								<span className="text-muted-foreground">Subtotal</span>
								<span className="font-medium">₹ {subtotal.toFixed(2)}</span>
							</div>

							{/* Discount Row */}
							{data.discount.type !== "none" && (
								<div className="flex flex-col gap-2 border-t py-2">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											Discount ({data.discount.type})
										</span>
										<div className="flex items-center gap-1">
											<Input
												className="h-8 w-24 text-right"
												onChange={(e) =>
													onChange({
														...data,
														discount: {
															...data.discount,
															amount: parseFloat(e.target.value) || 0,
														},
													})
												}
												type="number"
												value={data.discount.amount || ""}
											/>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														className="h-8 w-10 px-0"
														size="sm"
														variant="outline"
													>
														{data.discount.isPercentage ? (
															<Percent className="h-3 w-3" />
														) : (
															<IndianRupee className="h-3 w-3" />
														)}
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															onChange({
																...data,
																discount: {
																	...data.discount,
																	isPercentage: false,
																},
															})
														}
													>
														Amount (₹)
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															onChange({
																...data,
																discount: {
																	...data.discount,
																	isPercentage: true,
																},
															})
														}
													>
														Percentage (%)
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								</div>
							)}

							{/* Additional Charges Row */}
							{data.additionalCharges.amount !== undefined && (
								<div className="flex flex-col gap-2 border-t py-2">
									<div className="flex items-center justify-between text-sm">
										<Input
											className="h-8 w-32 border-dashed bg-transparent font-medium hover:bg-slate-50"
											onChange={(e) =>
												onChange({
													...data,
													additionalCharges: {
														...data.additionalCharges,
														title: e.target.value,
													},
												})
											}
											value={data.additionalCharges.title}
										/>
										<div className="flex items-center gap-1">
											<Input
												className="h-8 w-24 text-right"
												onChange={(e) =>
													onChange({
														...data,
														additionalCharges: {
															...data.additionalCharges,
															amount: parseFloat(e.target.value) || 0,
														},
													})
												}
												type="number"
												value={data.additionalCharges.amount || ""}
											/>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														className="h-8 w-10 px-0"
														size="sm"
														variant="outline"
													>
														{data.additionalCharges.isPercentage ? (
															<Percent className="h-3 w-3" />
														) : (
															<IndianRupee className="h-3 w-3" />
														)}
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															onChange({
																...data,
																additionalCharges: {
																	...data.additionalCharges,
																	isPercentage: false,
																},
															})
														}
													>
														Amount (₹)
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															onChange({
																...data,
																additionalCharges: {
																	...data.additionalCharges,
																	isPercentage: true,
																},
															})
														}
													>
														Percentage (%)
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>
								</div>
							)}

							{/* TOTAL ROW */}
							<div className="mt-2 flex items-center justify-between border-slate-200 border-t-2 py-4">
								<Input
									className="h-8 w-32 border-dashed bg-transparent px-1 font-bold text-lg hover:bg-slate-50"
									onChange={(e) =>
										onChange({ ...data, totalLabel: e.target.value })
									}
									value={data.totalLabel}
								/>
								<span className="font-bold text-xl">
									{/* Calculation would go here, currently just subtotal for visual */}
									₹ {subtotal.toFixed(2)}
								</span>
							</div>

							<div className="flex items-center space-x-2 pt-2">
								<Checkbox
									checked={data.summariseQuantity}
									id="summarise-qty"
									onCheckedChange={(checked) =>
										onChange({ ...data, summariseQuantity: checked === true })
									}
								/>
								<Label className="font-normal text-sm" htmlFor="summarise-qty">
									Summarise Total Quantity
								</Label>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* TOTAL IN WORDS SECTION */}
			<div>
				<div className="mb-4 flex items-center gap-2">
					<Button
						className="h-auto p-0 text-muted-foreground hover:text-foreground"
						onClick={toggleTotalInWords}
						size="sm"
						variant="ghost"
					>
						{data.showTotalInWords ? (
							<Eye className="mr-2 h-4 w-4" />
						) : (
							<EyeOff className="mr-2 h-4 w-4" />
						)}
						Show Total in Words
					</Button>
				</div>

				<div
					className={cn(
						"rounded-lg border bg-card p-6 transition-all duration-300",
						!data.showTotalInWords &&
							"pointer-events-none opacity-50 grayscale",
					)}
				>
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-4">
							<Input
								className="max-w-[200px] border-dashed bg-transparent font-medium hover:bg-slate-50"
								onChange={(e) =>
									onChange({ ...data, totalInWordsLabel: e.target.value })
								}
								value={data.totalInWordsLabel}
							/>
							<Input
								className="flex-1"
								onChange={(e) => handleWordsChange(e.target.value)}
								placeholder="e.g. One Thousand Five Hundred Only"
								value={data.totalInWordsValue}
							/>
						</div>
					</div>
				</div>
			</div>

			<TaxConfigurationModal
				isOpen={taxModalOpen}
				onClose={() => setTaxModalOpen(false)}
				onSave={(cfg) => onChange({ ...data, taxConfig: cfg })}
				taxConfig={data.taxConfig}
			/>

			<CessConfigurationModal
				cessConfig={
					data.cessConfig || {
						enabled: false,
						type: "central",
						name: "",
						isReverseCharge: false,
					}
				}
				isOpen={cessModalOpen}
				onClose={() => setCessModalOpen(false)}
				onSave={(cfg) => onChange({ ...data, cessConfig: cfg })}
			/>
		</div>
	);
}
