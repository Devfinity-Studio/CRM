"use client";

import { FileText, Save, Send } from "lucide-react";
import React, { useEffect, useState } from "react";
import { ClientDropdown } from "~/components/billing/shared/client-dropdown";
import { PricingSummarySection } from "~/components/billing/shared/pricing-summary-section";
import { SignaturePadModal } from "~/components/billing/shared/signature-pad-modal";
import { TermsAndConditionsSection } from "~/components/billing/shared/terms-and-conditions-section";
import type { LineItem } from "~/components/clients/line-items-table";
import { LineItemsTable } from "~/components/clients/line-items-table";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Button } from "~/components/ui/button";
import { DatePicker } from "~/components/ui/date-picker";
import { FileUploadDropzone } from "~/components/ui/file-upload-dropzone";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import type { DocumentData } from "~/types/document";

const defaultDocumentData: DocumentData = {
	logoUrl: "",
	companyId: "",
	showTotalSection: true,
	showTotalInWords: false,
	summariseQuantity: false,
	taxConfig: { type: "none" },
	discount: { type: "total", amount: 0, isPercentage: true },
	additionalCharges: { title: "Extra Charges", amount: 0, isPercentage: false },
	totalLabel: "TOTAL",
	totalInWordsLabel: "Total (in words)",
	totalInWordsValue: "",
	termsTitle: "Terms and conditions",
	termsList: [],
	poNumber: "",
	paymentTerms: "Net 15",
};

export default function NewInvoicePage() {
	const [isClient, setIsClient] = useState(false);
	useEffect(() => setIsClient(true), []);

	const [date, setDate] = useState<Date | undefined>(new Date());
	const [dueDate, setDueDate] = useState<Date | undefined>();
	const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
	const [title, setTitle] = useState("Invoice");

	const [items, setItems] = useState<LineItem[]>([]);
	const [invoiceData, setInvoiceData] =
		useState<DocumentData>(defaultDocumentData);

	const [signatureModalOpen, setSignatureModalOpen] = useState(false);

	// Calculate subtotal
	const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

	const { data: userSettings } = api.billing.getUserSettings.useQuery();
	const { data: nextNumberData } = api.billing.getNextDocumentNumber.useQuery(
		{ type: "invoice", companyId: invoiceData.companyId },
		{ enabled: !!userSettings }, // Wait for settings to load first
	);

	// Initialize from settings
	useEffect(() => {
		const labels = userSettings?.customLabels as any;
		if (labels?.invoiceTitle) {
			setTitle(labels.invoiceTitle);
		}
	}, [userSettings]);

	useEffect(() => {
		if (nextNumberData?.nextNumber) {
			setInvoiceNumber(nextNumberData.nextNumber);
		}
	}, [nextNumberData?.nextNumber]);

	if (!isClient) return null;

	return (
		<DashboardLayout>
			<div className="mx-auto max-w-5xl px-3 pt-6 pb-28 sm:px-6 sm:pt-8">
				<div className="mb-6 flex flex-col gap-2 border-border/70 border-b pb-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
							Create Invoice
						</h2>
						<p className="mt-1 text-muted-foreground text-xs sm:text-sm">
							Build a professional invoice and get paid.
						</p>
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border border-border/70 bg-card/85 shadow-sm backdrop-blur-md">
					{/* Header Section */}
					<div className="border-border/70 border-b p-4 sm:p-8 pb-6">
						<div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
							{/* Left Side: Title and Client */}
							<div className="flex-1 space-y-6">
								<Input
									className="-ml-1 h-12 w-full max-w-sm border-dashed bg-transparent px-2 font-bold text-2xl uppercase tracking-tight hover:bg-accent/40 sm:text-3xl"
									onChange={(e) => setTitle(e.target.value)}
									value={title}
								/>

								<div className="flex w-full max-w-md flex-col gap-1.5">
									<Label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Invoice To
									</Label>
									<ClientDropdown
										onChange={(val) =>
											setInvoiceData({ ...invoiceData, companyId: val })
										}
										value={invoiceData.companyId || ""}
									/>
									<div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
										<div className="space-y-1">
											<Label className="text-muted-foreground text-xs">
												Contact Email
											</Label>
											<Input
												className="h-10 text-sm"
												onChange={(e) =>
													setInvoiceData({
														...invoiceData,
														contactEmail: e.target.value,
													})
												}
												placeholder="Email address"
												value={invoiceData.contactEmail || ""}
											/>
										</div>
										<div className="space-y-1">
											<Label className="text-muted-foreground text-xs">
												Contact Phone
											</Label>
											<Input
												className="h-10 text-sm"
												onChange={(e) =>
													setInvoiceData({
														...invoiceData,
														contactPhone: e.target.value,
													})
												}
												placeholder="Phone number"
												value={invoiceData.contactPhone || ""}
											/>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-md">
									<div className="flex flex-col gap-1">
										<Label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											PO Number
										</Label>
										<Input
											className="h-10 text-sm"
											onChange={(e) =>
												setInvoiceData({
													...invoiceData,
													poNumber: e.target.value,
												})
											}
											placeholder="e.g. PO-10293"
											value={invoiceData.poNumber || ""}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Payment Terms
										</Label>
										<Select
											onValueChange={(val) =>
												setInvoiceData({ ...invoiceData, paymentTerms: val })
											}
											value={invoiceData.paymentTerms || "Net 15"}
										>
											<SelectTrigger className="h-10">
												<SelectValue placeholder="Select terms" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Due on Receipt">
													Due on Receipt
												</SelectItem>
												<SelectItem value="Net 15">Net 15</SelectItem>
												<SelectItem value="Net 30">Net 30</SelectItem>
												<SelectItem value="Net 45">Net 45</SelectItem>
												<SelectItem value="Net 60">Net 60</SelectItem>
												<SelectItem value="Custom">Custom</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>

							{/* Right Side: Meta Data & Logo */}
							<div className="w-full lg:max-w-xs space-y-4">
								{/* Logo Upload Dropzone */}
								<FileUploadDropzone
									className="h-24 w-full"
									currentImageUrl={invoiceData.logoUrl}
									folder="logos"
									onRemove={() =>
										setInvoiceData({ ...invoiceData, logoUrl: undefined })
									}
									onUploadSuccess={(url) =>
										setInvoiceData({ ...invoiceData, logoUrl: url })
									}
								/>

								<div className="grid grid-cols-[100px_1fr] items-start gap-2">
									<Label className="mt-2 font-medium text-muted-foreground text-sm">
										Invoice #
									</Label>
									<div className="space-y-1">
										<Input
											className="h-9 text-sm"
											onChange={(e) => setInvoiceNumber(e.target.value)}
											value={invoiceNumber}
										/>
										{nextNumberData?.lastDocument && (
											<p className="text-[10px] text-muted-foreground">
												Last Invoice: {nextNumberData.lastDocument.number} (
												{new Date(
													nextNumberData.lastDocument.date,
												).toLocaleDateString()}
												)
											</p>
										)}
									</div>
								</div>
								<div className="grid grid-cols-[100px_1fr] items-center gap-2">
									<Label className="font-medium text-muted-foreground text-sm">
										Date
									</Label>
									<DatePicker date={date} setDate={setDate} />
								</div>
								<div className="grid grid-cols-[100px_1fr] items-center gap-2">
									<Label className="font-medium text-muted-foreground text-sm">
										Due Date
									</Label>
									<DatePicker date={dueDate} setDate={setDueDate} />
								</div>
							</div>
						</div>
					</div>

					{/* Line Items Table */}
					<div className="p-4 sm:p-8 pb-4">
						<LineItemsTable
							currencySymbol="₹"
							items={items}
							onChange={setItems}
						/>
					</div>

					{/* Pricing Summary */}
					<div className="p-4 sm:px-8 pb-4">
						<PricingSummarySection
							data={invoiceData}
							onChange={setInvoiceData}
							subtotal={subtotal}
						/>
					</div>

					{/* T&C and Rich Text Blocks */}
					<div className="p-4 sm:px-8 pb-8">
						<TermsAndConditionsSection
							data={invoiceData}
							onChange={setInvoiceData}
						/>
					</div>

					{/* Signatures */}
					<div className="mt-8 flex flex-col items-end border-border/70 border-t p-4 sm:px-8 pt-8 pb-8">
						{invoiceData.signatureUrl ? (
							<div className="flex flex-col items-center gap-2">
								<img
									alt="Signature"
									className="h-24 rounded-lg border border-border/70 object-contain p-2"
									src={invoiceData.signatureUrl}
								/>
								<Button
									className="min-h-[44px] sm:min-h-0"
									onClick={() =>
										setInvoiceData({ ...invoiceData, signatureUrl: undefined })
									}
									size="sm"
									variant="ghost"
								>
									Remove Signature
								</Button>
							</div>
						) : (
							<Button
								className="min-h-[44px] sm:min-h-0"
								onClick={() => setSignatureModalOpen(true)}
								variant="outline"
							>
								Add Signature
							</Button>
						)}
					</div>
				</div>

				{/* Action Buttons at Bottom */}
				<div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
					<Button className="min-h-[44px] sm:min-h-0" variant="outline">
						<Save className="mr-2 h-4 w-4" /> Save Draft
					</Button>
					<Button className="min-h-[44px] sm:min-h-0" variant="secondary">
						<FileText className="mr-2 h-4 w-4" /> Save as Proforma
					</Button>
					<Button className="min-h-[44px] sm:min-h-0">
						<Send className="mr-2 h-4 w-4" /> Save & Send
					</Button>
				</div>
			</div>

			<SignaturePadModal
				isOpen={signatureModalOpen}
				onClose={() => setSignatureModalOpen(false)}
				onSave={(url) => setInvoiceData({ ...invoiceData, signatureUrl: url })}
			/>
		</DashboardLayout>
	);
}
