"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { City, Country, State } from "country-state-city";
import {
	ArrowLeft,
	ArrowRight,
	Building2,
	CheckCircle2,
	Download,
	FileText,
	Info,
	Link as LinkIcon,
	Loader2,
	MapPin,
	Plus,
	ShieldCheck,
	Trash2,
	UploadCloud,
	UserCheck,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PhoneInput } from "~/components/ui/phone-input";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

const contactSchema = z.object({
	// Section 1: Basic Info
	logo: z.string().optional(),
	name: z.string().min(1, "Business Name is required"),
	industry: z.string().optional(),
	country: z.string().min(1, "Country is required"),
	city: z.string().optional(),

	// Section 2: Tax Info
	hasGst: z.boolean().default(false),
	gstin: z
		.union([
			z.literal(""),
			z
				.string()
				.regex(
					/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
					"Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)",
				),
		])
		.optional(),
	businessPan: z
		.union([
			z.literal(""),
			z
				.string()
				.regex(
					/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
					"Invalid PAN format (e.g. AAAAA0000A)",
				),
		])
		.optional(),
	extraIds: z
		.array(
			z.object({
				idType: z.string(),
				idValue: z.string(),
			}),
		)
		.default([]),
	clientType: z.enum(["individual", "org"]).default("org").optional(),
	taxTreatment: z.enum(["consumer", "b2b"]).default("b2b").optional(),

	// Section 3: Address Section
	addressCountry: z.string().optional(),
	addressState: z.string().optional(),
	addressCity: z.string().optional(),
	addressStreet: z.string().optional(),
	addressPincode: z
		.union([
			z.literal(""),
			z
				.string()
				.min(4, "Pincode is too short")
				.max(10, "Pincode is too long")
				.regex(/^\d+$/, "Pincode must contain only numbers"),
		])
		.optional(),

	// Section 4: Shipping Details
	shippingAddresses: z
		.array(
			z.object({
				country: z.string(),
				state: z.string(),
				city: z.string(),
				pincode: z
					.string()
					.regex(/^\d*$/, "Pincode must be numeric")
					.optional(),
			}),
		)
		.default([]),

	// Section 6: Additional Details
	alias: z.string().optional(),
	uid: z.string().optional(),
	email: z.string().email("Valid email required").or(z.literal("")).optional(),
	showEmailInInvoice: z.boolean().default(false),
	phone: z
		.union([
			z.literal(""),
			z
				.string()
				.min(10, "Phone number must be at least 10 digits")
				.refine((val) => {
					if (!val) return true;
					return isValidPhoneNumber(val);
				}, "Invalid phone number"),
		])
		.optional(),
	showPhoneInInvoice: z.boolean().default(false),
	paymentDueDays: z.coerce.number().optional(),
	paymentAccount: z.string().optional(),
	upiId: z.string().optional(),
	customFields: z
		.array(
			z.object({
				fieldName: z.string(),
				fieldValue: z.string(),
			}),
		)
		.default([]),

	// Section 7: Attachments
	attachments: z
		.array(
			z.object({
				name: z.string(),
				url: z.string(),
			}),
		)
		.default([]),

	// Linked Contacts / POCs
	existingPocIds: z.array(z.string()).default([]),
	newPocs: z
		.array(
			z.object({
				firstName: z.string().min(1, "First name is required"),
				lastName: z.string().optional(),
				email: z.string().email("Invalid email").optional().or(z.literal("")),
				phone: z.string().optional(),
			}),
		)
		.default([]),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const TAB_CONFIG = [
	{ id: "basic", label: "Basic Info", icon: Building2 },
	{ id: "tax", label: "Tax Info", icon: ShieldCheck },
	{ id: "address", label: "Addresses", icon: MapPin },
	{ id: "details", label: "Details", icon: FileText },
	{ id: "contacts", label: "Contacts", icon: Users },
	{ id: "attachments", label: "Attachments", icon: LinkIcon },
	{ id: "account", label: "Account", icon: UserCheck },
];

export function ClientCreationForm({
	onSuccess,
	isModal = false,
}: {
	onSuccess?: (client: any) => void;
	isModal?: boolean;
}) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [activeTab, setActiveTab] = useState("basic");

	const form = useForm<ContactFormValues>({
		resolver: zodResolver(contactSchema) as any,
		mode: "onTouched",
		defaultValues: {
			name: "",
			industry: "",
			country: "",
			city: "",
			hasGst: false,
			gstin: "",
			businessPan: "",
			extraIds: [],
			clientType: "org",
			taxTreatment: "b2b",
			addressCountry: "",
			addressState: "",
			addressCity: "",
			addressStreet: "",
			addressPincode: "",
			shippingAddresses: [],
			existingPocIds: [],
			newPocs: [],
			alias: "",
			uid: "",
			email: "",
			showEmailInInvoice: false,
			phone: "",
			showPhoneInInvoice: false,
			paymentDueDays: undefined,
			paymentAccount: "",
			upiId: "",
			customFields: [],
			attachments: [],
		},
	});

	const { watch, setValue, control } = form;

	const extraIdsArray = useFieldArray({ control, name: "extraIds" });
	const shippingArray = useFieldArray({ control, name: "shippingAddresses" });
	const customFieldsArray = useFieldArray({ control, name: "customFields" });
	const attachmentsArray = useFieldArray({ control, name: "attachments" });
	const pocsArray = useFieldArray({ control, name: "newPocs" });

	const addressCountry = watch("addressCountry");
	const addressState = watch("addressState");
	const hasGst = watch("hasGst");

	const countries = Country.getAllCountries();
	const addressStatesList = addressCountry
		? State.getStatesOfCountry(addressCountry)
		: [];
	const addressCitiesList =
		addressState && addressCountry
			? City.getCitiesOfState(addressCountry, addressState)
			: [];

	const createCompany = api.crm.createCompany.useMutation();
	const createContact = api.crm.createContact.useMutation();
	const nameWatch = form.watch("name");
	const { data: duplicateCompany } = api.crm.getCompanyByName.useQuery(
		{ name: nameWatch },
		{ enabled: !!nameWatch && nameWatch.trim().length > 2 },
	);

	const copyBillingToShipping = () => {
		shippingArray.append({
			country: watch("addressCountry") || "",
			state: watch("addressState") || "",
			city: watch("addressCity") || "",
			pincode: watch("addressPincode") || "",
		});
		toast.success("Billing address copied to shipping");
	};

	const onSubmit = async (data: ContactFormValues) => {
		try {
			setIsSubmitting(true);

			const company = await createCompany.mutateAsync({
				name: data.name,
				industry: data.industry,
				country: data.country,
				hasGst: data.hasGst,
				gstin: data.gstin || undefined,
				businessPan: data.businessPan || undefined,
				clientType: data.clientType,
				taxTreatment: data.taxTreatment,
				extraIds: data.extraIds,
				addressCountry: data.addressCountry,
				addressState: data.addressState,
				addressCity: data.addressCity,
				addressStreet: data.addressStreet,
				addressPincode: data.addressPincode,
				shippingDetails: data.shippingAddresses,
				alias: data.alias,
				uid: data.uid,
				email: data.email,
				phone: data.phone,
				showEmailInInvoice: data.showEmailInInvoice,
				showPhoneInInvoice: data.showPhoneInInvoice,
				paymentDueDays: data.paymentDueDays,
				customFields: data.customFields,
				attachments: data.attachments,
				logoUrl: data.logo,
			});

			if (!company) throw new Error("Failed to create company");

			if (data.newPocs && data.newPocs.length > 0) {
				for (const poc of data.newPocs) {
					await createContact.mutateAsync({
						...poc,
						companyId: company.id,
					});
				}
			}

			if (onSuccess) {
				onSuccess(company);
			} else {
				toast.success("Client profile created successfully!");
				router.push("/clients");
			}
		} catch (error) {
			toast.error("Failed to save contact profile");
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className={isModal ? "space-y-4" : "mx-auto max-w-5xl pb-12 space-y-6"}>
			<div className="flex items-center justify-between border-b border-border pb-4">
				<div>
					<h2 className="font-bold text-xl sm:text-2xl text-foreground tracking-tight">
						Add New Client Profile
					</h2>
					<p className="text-xs sm:text-sm text-muted-foreground">
						Complete the organization details, regulatory tax ID, and billing settings.
					</p>
				</div>
				{!isModal && (
					<Button asChild variant="outline" className="min-h-[40px]">
						<Link href="/clients">Cancel</Link>
					</Button>
				)}
			</div>

			<Form {...form}>
				<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
					<Tabs
						className="w-full space-y-5"
						onValueChange={setActiveTab}
						value={activeTab}
					>
						<div className="overflow-x-auto pb-1 no-scrollbar">
							<TabsList className="inline-flex w-auto min-w-full justify-start rounded-xl border border-border bg-muted/40 p-1.5 gap-1">
								{TAB_CONFIG.map((t) => {
									const Icon = t.icon;
									return (
										<TabsTrigger
											key={t.id}
											value={t.id}
											className="min-h-[38px] px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs rounded-lg flex items-center gap-1.5"
										>
											<Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
											<span>{t.label}</span>
										</TabsTrigger>
									);
								})}
							</TabsList>
						</div>

						{/* TAB 1: BASIC INFO */}
						<TabsContent className="space-y-5 focus-visible:outline-none" value="basic">
							<Card className="border border-border bg-card shadow-sm">
								<CardContent className="space-y-5 p-4 sm:p-6">
									<FormField
										control={form.control}
										name="logo"
										render={() => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">Client Logo</FormLabel>
												<div className="flex h-28 w-full max-w-xs cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 text-muted-foreground transition hover:border-primary/50 hover:bg-muted/40 p-3">
													<UploadCloud className="mb-1.5 h-6 w-6 text-muted-foreground" />
													<span className="text-xs font-medium text-foreground">Drag & drop logo</span>
													<span className="text-[10px] text-muted-foreground">or click to browse</span>
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="country"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">
														Country <span className="text-destructive">*</span>
													</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
																<SelectValue placeholder="Select Country" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="max-h-[260px] bg-popover text-popover-foreground border-border">
															{countries.map((c) => (
																<SelectItem key={c.isoCode} value={c.isoCode}>
																	{c.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="city"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">City / Town</FormLabel>
													<FormControl>
														<Input
															className="min-h-[44px] bg-background border-border text-foreground"
															placeholder="e.g. Chicago"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<FormLabel className="text-foreground font-semibold">
														Business Name <span className="text-destructive">*</span>
													</FormLabel>
													<FormControl>
														<Input
															className="min-h-[44px] bg-background border-border text-foreground"
															placeholder="Acme Corp"
															{...field}
														/>
													</FormControl>
													{duplicateCompany && (
														<div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-700 dark:text-amber-400 text-xs">
															<Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
															<span>
																A company named <strong>{duplicateCompany.name}</strong> exists.
															</span>
														</div>
													)}
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="industry"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Industry</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
																<SelectValue placeholder="Select Industry" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="bg-popover text-popover-foreground border-border">
															<SelectItem value="software">Software / IT</SelectItem>
															<SelectItem value="finance">Finance</SelectItem>
															<SelectItem value="retail">Retail / E-Commerce</SelectItem>
															<SelectItem value="healthcare">Healthcare / Pharma</SelectItem>
															<SelectItem value="other">Other</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</CardContent>
							</Card>
							<div className="flex justify-end">
								<Button
									onClick={() => setActiveTab("tax")}
									type="button"
									className="min-h-[44px] px-6 gap-2"
								>
									Next <ArrowRight className="h-4 w-4" />
								</Button>
							</div>
						</TabsContent>

						{/* TAB 2: TAX INFO */}
						<TabsContent className="space-y-5 focus-visible:outline-none" value="tax">
							<Card className="border border-border bg-card shadow-sm">
								<CardContent className="space-y-5 p-4 sm:p-6">
									<FormField
										control={form.control}
										name="hasGst"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
												<div className="space-y-0.5">
													<FormLabel className="font-semibold text-foreground text-sm cursor-pointer">
														Registered for Tax (GST/VAT)?
													</FormLabel>
													<p className="text-xs text-muted-foreground">
														Enable for registered B2B tax credits and invoice headers.
													</p>
												</div>
												<FormControl>
													<Switch
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>

									{hasGst && (
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border bg-muted/10 p-4">
											<FormField
												control={form.control}
												name="gstin"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-foreground font-semibold">GST / Tax Number</FormLabel>
														<FormControl>
															<Input
																className="min-h-[44px] bg-background border-border text-foreground uppercase"
																placeholder="22AAAAA0000A1Z5"
																{...field}
																onChange={(e) =>
																	field.onChange(e.target.value.toUpperCase())
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="businessPan"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-foreground font-semibold">PAN / Legal ID</FormLabel>
														<FormControl>
															<Input
																className="min-h-[44px] bg-background border-border text-foreground uppercase"
																placeholder="AAAAA0000A"
																{...field}
																onChange={(e) =>
																	field.onChange(e.target.value.toUpperCase())
																}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									)}

									<div className="border-t border-border pt-4">
										<div className="flex items-center justify-between mb-3">
											<FormLabel className="text-foreground font-semibold text-xs sm:text-sm">
												Additional Tax Identifiers
											</FormLabel>
											<Button
												onClick={() =>
													extraIdsArray.append({ idType: "", idValue: "" })
												}
												size="sm"
												type="button"
												variant="outline"
												className="min-h-[36px] gap-1.5"
											>
												<Plus className="h-3.5 w-3.5" /> Add ID
											</Button>
										</div>

										{extraIdsArray.fields.map((field, index) => (
											<div className="mb-2.5 flex items-center gap-2" key={field.id}>
												<FormField
													control={form.control}
													name={`extraIds.${index}.idType`}
													render={({ field }) => (
														<FormItem className="flex-1">
															<FormControl>
																<Input
																	className="min-h-[42px] bg-background border-border text-foreground text-xs"
																	placeholder="Type (e.g. CIN)"
																	{...field}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
												<FormField
													control={form.control}
													name={`extraIds.${index}.idValue`}
													render={({ field }) => (
														<FormItem className="flex-[2]">
															<FormControl>
																<Input
																	className="min-h-[42px] bg-background border-border text-foreground text-xs"
																	placeholder="Registration Number"
																	{...field}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
												<Button
													onClick={() => extraIdsArray.remove(index)}
													size="icon"
													type="button"
													variant="ghost"
													className="h-10 w-10 text-destructive hover:bg-destructive/10 shrink-0"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										))}
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
										<FormField
											control={form.control}
											name="clientType"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Client Type</FormLabel>
													<FormControl>
														<RadioGroup
															className="flex gap-4 pt-1"
															defaultValue={field.value}
															onValueChange={field.onChange}
														>
															<div className="flex items-center space-x-2">
																<RadioGroupItem id="modal-r1" value="individual" />
																<Label htmlFor="modal-r1" className="cursor-pointer text-foreground text-xs sm:text-sm">
																	Individual
																</Label>
															</div>
															<div className="flex items-center space-x-2">
																<RadioGroupItem id="modal-r2" value="org" />
																<Label htmlFor="modal-r2" className="cursor-pointer text-foreground text-xs sm:text-sm">
																	Organization
																</Label>
															</div>
														</RadioGroup>
													</FormControl>
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="taxTreatment"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Tax Treatment</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
																<SelectValue placeholder="Select..." />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="bg-popover text-popover-foreground border-border">
															<SelectItem value="consumer">Consumer (B2C)</SelectItem>
															<SelectItem value="b2b">Business (B2B)</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</CardContent>
							</Card>
							<div className="flex justify-between items-center gap-2">
								<Button
									onClick={() => setActiveTab("basic")}
									type="button"
									variant="outline"
									className="min-h-[44px] px-4 gap-1.5"
								>
									<ArrowLeft className="h-4 w-4" /> Prev
								</Button>
								<Button
									onClick={() => setActiveTab("address")}
									type="button"
									className="min-h-[44px] px-6 gap-2"
								>
									Next <ArrowRight className="h-4 w-4" />
								</Button>
							</div>
						</TabsContent>

						{/* TAB 3: ADDRESS */}
						<TabsContent className="space-y-5 focus-visible:outline-none" value="address">
							<Card className="border border-border bg-card shadow-sm">
								<CardContent className="space-y-5 p-4 sm:p-6">
									<h3 className="font-semibold text-base text-foreground">
										Billing Address
									</h3>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="addressCountry"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Country</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={(v) => {
															field.onChange(v);
															setValue("addressState", "");
															setValue("addressCity", "");
														}}
													>
														<FormControl>
															<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
																<SelectValue placeholder="Select Country" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="max-h-[260px] bg-popover text-popover-foreground border-border">
															{countries.map((c) => (
																<SelectItem key={c.isoCode} value={c.isoCode}>
																	{c.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="addressState"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">State / Province</FormLabel>
													<Select
														defaultValue={field.value}
														disabled={!addressCountry}
														onValueChange={(v) => {
															field.onChange(v);
															setValue("addressCity", "");
														}}
													>
														<FormControl>
															<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground disabled:opacity-50">
																<SelectValue placeholder="Select State" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="max-h-[200px] bg-popover text-popover-foreground border-border">
															{addressStatesList.map((s) => (
																<SelectItem key={s.isoCode} value={s.isoCode}>
																	{s.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="addressCity"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">City / Town</FormLabel>
													<Select
														defaultValue={field.value}
														disabled={!addressState}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground disabled:opacity-50">
																<SelectValue placeholder="Select City" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="max-h-[200px] bg-popover text-popover-foreground border-border">
															{addressCitiesList.map((c) => (
																<SelectItem key={c.name} value={c.name}>
																	{c.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="addressPincode"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Pincode</FormLabel>
													<FormControl>
														<Input
															className="min-h-[44px] bg-background border-border text-foreground"
															{...field}
															onChange={(e) => {
																e.target.value = e.target.value.replace(
																	/\D/g,
																	"",
																);
																field.onChange(e);
															}}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="addressStreet"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">Street Address</FormLabel>
												<FormControl>
													<Input
														className="min-h-[44px] bg-background border-border text-foreground"
														placeholder="123 Corporate Blvd, Suite 200"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="border-t border-border pt-4">
										<div className="flex items-center justify-between mb-3">
											<span className="font-semibold text-sm text-foreground">
												Shipping Destinations
											</span>
											<Button
												onClick={copyBillingToShipping}
												size="sm"
												type="button"
												variant="secondary"
												className="min-h-[36px] gap-1.5"
											>
												<Download className="h-3.5 w-3.5" /> Copy Billing Address
											</Button>
										</div>

										{shippingArray.fields.map((field, index) => (
											<div
												className="mb-3 rounded-xl border border-border bg-muted/20 p-3 space-y-3"
												key={field.id}
											>
												<div className="flex justify-between items-center">
													<span className="text-xs font-semibold text-muted-foreground uppercase">
														Shipping Address #{index + 1}
													</span>
													<Button
														className="h-8 w-8 text-destructive hover:bg-destructive/10"
														onClick={() => shippingArray.remove(index)}
														size="icon"
														type="button"
														variant="ghost"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
												<div className="grid grid-cols-2 gap-2">
													<Input
														className="min-h-[38px] bg-background border-border text-xs"
														placeholder="Country"
														{...form.register(`shippingAddresses.${index}.country`)}
													/>
													<Input
														className="min-h-[38px] bg-background border-border text-xs"
														placeholder="State"
														{...form.register(`shippingAddresses.${index}.state`)}
													/>
													<Input
														className="min-h-[38px] bg-background border-border text-xs"
														placeholder="City"
														{...form.register(`shippingAddresses.${index}.city`)}
													/>
													<Input
														className="min-h-[38px] bg-background border-border text-xs"
														placeholder="Pincode"
														{...form.register(`shippingAddresses.${index}.pincode`)}
													/>
												</div>
											</div>
										))}

										<Button
											onClick={() =>
												shippingArray.append({
													country: "",
													state: "",
													city: "",
													pincode: "",
												})
											}
											size="sm"
											type="button"
											variant="outline"
											className="min-h-[36px] gap-1.5"
										>
											<Plus className="h-3.5 w-3.5" /> Add Shipping Destination
										</Button>
									</div>
								</CardContent>
							</Card>
							<div className="flex justify-between items-center gap-2">
								<Button
									onClick={() => setActiveTab("tax")}
									type="button"
									variant="outline"
									className="min-h-[44px] px-4 gap-1.5"
								>
									<ArrowLeft className="h-4 w-4" /> Prev
								</Button>
								<Button
									onClick={() => setActiveTab("details")}
									type="button"
									className="min-h-[44px] px-6 gap-2"
								>
									Next <ArrowRight className="h-4 w-4" />
								</Button>
							</div>
						</TabsContent>

						{/* TAB 4: DETAILS */}
						<TabsContent className="space-y-5 focus-visible:outline-none" value="details">
							<Card className="border border-border bg-card shadow-sm">
								<CardContent className="space-y-5 p-4 sm:p-6">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="alias"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Alias / Brand Name</FormLabel>
													<FormControl>
														<Input
															className="min-h-[44px] bg-background border-border text-foreground"
															placeholder="e.g. Acme HQ"
															{...field}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Billing Email</FormLabel>
													<FormControl>
														<Input
															className="min-h-[44px] bg-background border-border text-foreground"
															type="email"
															placeholder="finance@acme.com"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="phone"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Billing Phone</FormLabel>
													<div className="PhoneInputWrapper">
														<PhoneInput
															className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-foreground"
															defaultCountry="US"
															onChange={(v) => field.onChange(v || "")}
															value={field.value}
														/>
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="paymentDueDays"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Payment Due (Days)</FormLabel>
													<FormControl>
														<Input
															className="min-h-[44px] bg-background border-border text-foreground"
															type="number"
															placeholder="30"
															{...field}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
									</div>
								</CardContent>
							</Card>
							<div className="flex justify-between items-center gap-2">
								<Button
									onClick={() => setActiveTab("address")}
									type="button"
									variant="outline"
									className="min-h-[44px] px-4 gap-1.5"
								>
									<ArrowLeft className="h-4 w-4" /> Prev
								</Button>
								<Button
									onClick={() => setActiveTab("contacts")}
									type="button"
									className="min-h-[44px] px-6 gap-2"
								>
									Next <ArrowRight className="h-4 w-4" />
								</Button>
							</div>
						</TabsContent>

						{/* TAB 5: CONTACTS */}
						<TabsContent className="space-y-5 focus-visible:outline-none" value="contacts">
							<Card className="border border-border bg-card shadow-sm">
								<CardContent className="space-y-4 p-4 sm:p-6">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-base text-foreground">
											Key Contact Stakeholders
										</span>
										<Button
											onClick={() =>
												pocsArray.append({
													firstName: "",
													lastName: "",
													email: "",
													phone: "",
												})
											}
											size="sm"
											type="button"
											variant="outline"
											className="min-h-[36px] gap-1.5"
										>
											<Plus className="h-3.5 w-3.5" /> Add Contact
										</Button>
									</div>

									<div className="space-y-3">
										{pocsArray.fields.map((field, index) => (
											<div
												className="rounded-xl border border-border bg-muted/20 p-3 space-y-3"
												key={field.id}
											>
												<div className="flex items-center justify-between">
													<span className="text-xs font-semibold text-muted-foreground uppercase">
														Stakeholder #{index + 1}
													</span>
													<Button
														className="h-8 w-8 text-destructive hover:bg-destructive/10"
														onClick={() => pocsArray.remove(index)}
														size="icon"
														type="button"
														variant="ghost"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
													<Input
														className="min-h-[40px] bg-background border-border text-xs"
														placeholder="First Name *"
														{...form.register(`newPocs.${index}.firstName`)}
													/>
													<Input
														className="min-h-[40px] bg-background border-border text-xs"
														placeholder="Last Name"
														{...form.register(`newPocs.${index}.lastName`)}
													/>
													<Input
														className="min-h-[40px] bg-background border-border text-xs"
														placeholder="Email"
														type="email"
														{...form.register(`newPocs.${index}.email`)}
													/>
													<Input
														className="min-h-[40px] bg-background border-border text-xs"
														placeholder="Phone"
														{...form.register(`newPocs.${index}.phone`)}
													/>
												</div>
											</div>
										))}
										{pocsArray.fields.length === 0 && (
											<div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
												No contacts attached yet. Click &ldquo;Add Contact&rdquo; to attach stakeholders.
											</div>
										)}
									</div>
								</CardContent>
							</Card>
							<div className="flex justify-between items-center gap-2">
								<Button
									onClick={() => setActiveTab("details")}
									type="button"
									variant="outline"
									className="min-h-[44px] px-4 gap-1.5"
								>
									<ArrowLeft className="h-4 w-4" /> Prev
								</Button>
								<Button
									onClick={() => setActiveTab("attachments")}
									type="button"
									className="min-h-[44px] px-6 gap-2"
								>
									Next <ArrowRight className="h-4 w-4" />
								</Button>
							</div>
						</TabsContent>

						{/* TAB 6: ATTACHMENTS */}
						<TabsContent className="space-y-5 focus-visible:outline-none" value="attachments">
							<Card className="border border-border bg-card shadow-sm">
								<CardContent className="space-y-4 p-4 sm:p-6">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-base text-foreground">
											Contracts & Documents
										</span>
										<Button
											onClick={() =>
												attachmentsArray.append({ name: "", url: "" })
											}
											size="sm"
											type="button"
											variant="outline"
											className="min-h-[36px] gap-1.5"
										>
											<Plus className="h-3.5 w-3.5" /> Add Document
										</Button>
									</div>

									{attachmentsArray.fields.map((field, index) => (
										<div
											className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 p-3"
											key={field.id}
										>
											<Input
												className="min-h-[40px] bg-background border-border text-xs flex-1"
												placeholder="Document Title (e.g. Master Service Agreement)"
												{...form.register(`attachments.${index}.name`)}
											/>
											<Button
												onClick={() => attachmentsArray.remove(index)}
												size="icon"
												type="button"
												variant="ghost"
												className="h-10 w-10 text-destructive hover:bg-destructive/10 shrink-0"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}
								</CardContent>
							</Card>
							<div className="flex justify-between items-center gap-2">
								<Button
									onClick={() => setActiveTab("contacts")}
									type="button"
									variant="outline"
									className="min-h-[44px] px-4 gap-1.5"
								>
									<ArrowLeft className="h-4 w-4" /> Prev
								</Button>
								<Button
									onClick={() => setActiveTab("account")}
									type="button"
									className="min-h-[44px] px-6 gap-2"
								>
									Review <ArrowRight className="h-4 w-4" />
								</Button>
							</div>
						</TabsContent>

						{/* TAB 7: ACCOUNT */}
						<TabsContent className="space-y-5 focus-visible:outline-none" value="account">
							<Card className="border border-border bg-card shadow-sm">
								<CardContent className="p-6 py-10 text-center space-y-3">
									<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
										<CheckCircle2 className="h-7 w-7" />
									</div>
									<h4 className="font-bold text-base text-foreground">
										Ready to Create Client Profile
									</h4>
									<p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
										All details are validated. Save to register the organization and sync accounting records.
									</p>
								</CardContent>
							</Card>

							<div className="flex justify-between items-center gap-2">
								<Button
									onClick={() => setActiveTab("attachments")}
									type="button"
									variant="outline"
									className="min-h-[44px] px-4 gap-1.5"
								>
									<ArrowLeft className="h-4 w-4" /> Prev
								</Button>
								<Button
									className="min-h-[44px] px-6 font-semibold shadow-xs"
									disabled={isSubmitting}
									type="submit"
								>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Saving Profile...
										</>
									) : (
										"Save Client Profile"
									)}
								</Button>
							</div>
						</TabsContent>
					</Tabs>
				</form>
			</Form>
		</div>
	);
}
