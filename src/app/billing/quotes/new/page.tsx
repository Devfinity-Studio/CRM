"use client";

import { Download, FileText, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
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
};

const emailSchema = z.string().email().optional().or(z.literal(""));
const phoneSchema = z
	.string()
	.regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format")
	.optional()
	.or(z.literal(""));

export default function NewQuotePage() {
	const [isClient, setIsClient] = useState(false);
	useEffect(() => setIsClient(true), []);
	const router = useRouter();

	const [date, setDate] = useState<Date | undefined>(new Date());
	const [dueDate, setDueDate] = useState<Date | undefined>();
	const [quoteNumber, setQuoteNumber] = useState("EST-001");
	const [title, setTitle] = useState("Quotation");

	const [items, setItems] = useState<LineItem[]>([]);
	const [quoteData, setQuoteData] = useState<DocumentData>(defaultDocumentData);

	const [signatureModalOpen, setSignatureModalOpen] = useState(false);
	const [emailError, setEmailError] = useState("");
	const [phoneError, setPhoneError] = useState("");

	const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
	const taxAmount = Math.floor(
		subtotal * ((quoteData.taxConfig.percent || 0) / 100),
	);
	const totalAmount = subtotal + taxAmount;

	const { data: userSettings } = api.billing.getUserSettings.useQuery();
	const { data: nextNumberData } = api.billing.getNextDocumentNumber.useQuery(
		{ type: "quote", companyId: quoteData.companyId },
		{ enabled: !!userSettings },
	);

	const createQuote = api.billing.createQuote.useMutation({
		onSuccess: () => {
			toast.success("Quote saved successfully");
		},
		onError: (err) => {
			toast.error(`Error: ${err.message}`);
		},
	});

	useEffect(() => {
		const labels = userSettings?.customLabels as any;
		if (labels?.quoteTitle) {
			setTitle(labels.quoteTitle);
		}
	}, [userSettings]);

	useEffect(() => {
		if (nextNumberData?.nextNumber) {
			setQuoteNumber(nextNumberData.nextNumber);
		}
	}, [nextNumberData?.nextNumber]);

	if (!isClient) return null;

	const handleSave = (action: "draft" | "new" | "continue") => {
		if (!quoteData.companyId) {
			toast.error("Please select a client.");
			return;
		}
		if (!date) {
			toast.error("Please select a date.");
			return;
		}

		createQuote.mutate(
			{
				companyId: quoteData.companyId,
				quoteNumber,
				title,
				date,
				dueDate,
				labels: {},
				customFields: {},
				showTotalInPdf: quoteData.showTotalSection,
				showTotalInWords: quoteData.showTotalInWords,
				lineItems: items,
				taxPercent: quoteData.taxConfig.percent || 0,
				discountType: quoteData.discount.isPercentage ? "PERCENT" : "AMOUNT",
				discountValue: quoteData.discount.amount,
				additionalCharges: quoteData.additionalCharges,
				totalAmount,
				signatureType: "IMAGE",
				signatureData: quoteData.signatureUrl,
				notes: "",
				terms: quoteData.termsList,
				contactEmail: quoteData.contactEmail,
				contactPhone: quoteData.contactPhone,
			},
			{
				onSuccess: () => {
					if (action === "draft" || action === "continue") {
						router.push("/billing/quotes");
					} else if (action === "new") {
						window.location.reload();
					}
				},
			},
		);
	};

	return (
		<DashboardLayout>
			<div className="mx-auto max-w-5xl px-3 pt-6 pb-28 sm:px-6 sm:pt-8">
				<div className="mb-6 flex flex-col gap-2 border-border/70 border-b pb-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
							Create Quotation
						</h2>
						<p className="mt-1 text-muted-foreground text-xs sm:text-sm">
							Build a professional quotation or estimate.
						</p>
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border border-border/70 bg-card/85 shadow-sm backdrop-blur-md">
					<div className="border-border/70 border-b p-4 sm:p-8 pb-6">
						<div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
							<div className="flex-1 space-y-6">
								<Input
									className="-ml-1 h-12 w-full max-w-sm border-dashed bg-transparent px-2 font-bold text-2xl uppercase tracking-tight hover:bg-accent/40 sm:text-3xl"
									onChange={(e) => setTitle(e.target.value)}
									value={title}
								/>

								<div className="flex w-full max-w-md flex-col gap-1.5">
									<Label className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Quote For
									</Label>
									<ClientDropdown
										onChange={(val) =>
											setQuoteData({ ...quoteData, companyId: val })
										}
										value={quoteData.companyId || ""}
									/>
									<div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
										<div className="space-y-1">
											<Label className="text-muted-foreground text-xs">
												Contact Email
											</Label>
											<Input
												className={`h-10 text-sm ${emailError ? "border-destructive" : ""}`}
												onBlur={(e) => {
													const res = emailSchema.safeParse(e.target.value);
													if (!res.success)
														setEmailError(res.error.errors[0]?.message || "Invalid email");
												}}
												onChange={(e) => {
													setQuoteData({
														...quoteData,
														contactEmail: e.target.value,
													});
													if (emailError) setEmailError("");
												}}
												placeholder="Email address"
												value={quoteData.contactEmail || ""}
											/>
											{emailError && (
												<p className="text-[10px] text-destructive">{emailError}</p>
											)}
										</div>
										<div className="space-y-1">
											<Label className="text-muted-foreground text-xs">
												Contact Phone
											</Label>
											<Input
												className={`h-10 text-sm ${phoneError ? "border-destructive" : ""}`}
												onBlur={(e) => {
													const res = phoneSchema.safeParse(e.target.value);
													if (!res.success)
														setPhoneError(res.error.errors[0]?.message || "Invalid phone");
												}}
												onChange={(e) => {
													setQuoteData({
														...quoteData,
														contactPhone: e.target.value,
													});
													if (phoneError) setPhoneError("");
												}}
												placeholder="Phone number"
												value={quoteData.contactPhone || ""}
											/>
											{phoneError && (
												<p className="text-[10px] text-destructive">{phoneError}</p>
											)}
										</div>
									</div>
								</div>
							</div>

							<div className="w-full lg:max-w-xs space-y-4">
								<FileUploadDropzone
									className="h-24 w-full"
									currentImageUrl={quoteData.logoUrl}
									folder="logos"
									onRemove={() =>
										setQuoteData({ ...quoteData, logoUrl: undefined })
									}
									onUploadSuccess={(url) =>
										setQuoteData({ ...quoteData, logoUrl: url })
									}
								/>

								<div className="grid grid-cols-[100px_1fr] items-start gap-2">
									<Label className="mt-2 font-medium text-muted-foreground text-sm">
										Quote #
									</Label>
									<div className="space-y-1">
										<Input
											className="h-9 text-sm"
											onChange={(e) => setQuoteNumber(e.target.value)}
											value={quoteNumber}
										/>
										{nextNumberData?.lastDocument && (
											<p className="text-[10px] text-muted-foreground">
												Last Quote: {nextNumberData.lastDocument.number} (
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
										Expiry Date
									</Label>
									<DatePicker date={dueDate} setDate={setDueDate} />
								</div>
							</div>
						</div>
					</div>

					<div className="p-4 sm:p-8 pb-4">
						<LineItemsTable
							currencySymbol="₹"
							items={items}
							onChange={setItems}
						/>
					</div>

					<div className="p-4 sm:px-8 pb-4">
						<PricingSummarySection
							data={quoteData}
							onChange={setQuoteData}
							subtotal={subtotal}
						/>
					</div>

					<div className="p-4 sm:px-8 pb-8">
						<TermsAndConditionsSection
							data={quoteData}
							onChange={setQuoteData}
						/>
					</div>

					<div className="mt-8 flex flex-col items-end border-border/70 border-t p-4 sm:px-8 pt-8 pb-8">
						{quoteData.signatureUrl ? (
							<div className="flex flex-col items-center gap-2">
								<img
									alt="Signature"
									className="h-24 rounded-lg border border-border/70 object-contain p-2"
									src={quoteData.signatureUrl}
								/>
								<Button
									className="min-h-[44px] sm:min-h-0"
									onClick={() =>
										setQuoteData({ ...quoteData, signatureUrl: undefined })
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

				<div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
					<Button
						className="min-h-[44px] sm:min-h-0"
						disabled={createQuote.isPending}
						onClick={() => handleSave("draft")}
						variant="outline"
					>
						<Save className="mr-2 h-4 w-4" /> Save to Draft
					</Button>
					<Button
						className="min-h-[44px] sm:min-h-0"
						disabled={createQuote.isPending}
						onClick={() => handleSave("new")}
						variant="outline"
					>
						<FileText className="mr-2 h-4 w-4" /> Save & Create New
					</Button>
					<Button
						className="min-h-[44px] sm:min-h-0"
						disabled={createQuote.isPending}
						onClick={() => handleSave("continue")}
					>
						<Send className="mr-2 h-4 w-4" /> Save & Continue
					</Button>
				</div>
			</div>

			<SignaturePadModal
				isOpen={signatureModalOpen}
				onClose={() => setSignatureModalOpen(false)}
				onSave={(url) => setQuoteData({ ...quoteData, signatureUrl: url })}
			/>
		</DashboardLayout>
	);
}
