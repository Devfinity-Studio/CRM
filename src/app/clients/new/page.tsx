"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { City, Country, State } from "country-state-city";
import {
	ArrowLeft,
	ArrowRight,
	Building2,
	CheckCircle2,
	ChevronRight,
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
import { DashboardLayout } from "~/components/layout/dashboard-layout";
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

export default function NewContactPage() {
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

			toast.success("Client profile created successfully!");
			router.push("/clients");
		} catch (error) {
			toast.error("Failed to save contact profile");
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<DashboardLayout>
			<div className="mx-auto max-w-5xl px-3 sm:px-6 py-4 sm:py-8 space-y-6">
				{/* Top Header & Breadcrumb */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
							<Link
								href="/clients"
								className="hover:text-foreground transition-colors"
							>
								Clients
							</Link>
							<ChevronRight className="h-3.5 w-3.5" />
							<span className="text-foreground font-medium">New Client</span>
						</div>
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
							Add New Client
						</h1>
						<p className="text-sm text-muted-foreground">
							Configure the profile, tax identity, and key accounts for this organization.
						</p>
					</div>
					<div className="flex items-center gap-2 self-start sm:self-center">
						<Button asChild variant="outline" className="min-h-[44px] px-4">
							<Link href="/clients">
								<ArrowLeft className="mr-2 h-4 w-4" /> Cancel
							</Link>
						</Button>
					</div>
				</div>

				<Form {...form}>
					<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
						<Tabs
							className="w-full space-y-6"
							onValueChange={setActiveTab}
							value={activeTab}
						>
							{/* Scrollable Tabs Navigation on Mobile */}
							<div className="overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 no-scrollbar">
								<TabsList className="inline-flex w-auto min-w-full sm:w-full justify-start rounded-xl border border-border bg-muted/40 p-1.5 gap-1">
									{TAB_CONFIG.map((t) => {
										const Icon = t.icon;
										return (
											<TabsTrigger
												key={t.id}
												value={t.id}
												className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg flex items-center gap-2"
											>
												<Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
												<span>{t.label}</span>
											</TabsTrigger>
										);
									})}
								</TabsList>
							</div>

							{/* TAB 1: BASIC INFO */}
							<TabsContent className="space-y-6 focus-visible:outline-none" value="basic">
								<Card className="border border-border bg-card shadow-sm">
									<CardContent className="space-y-6 p-4 sm:p-6">
										<FormField
											control={form.control}
											name="logo"
											render={() => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">
														Client Logo
													</FormLabel>
													<div className="flex h-32 w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 text-muted-foreground transition hover:border-primary/50 hover:bg-muted/40 p-4">
														<UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
														<span className="text-sm font-medium text-foreground">
															Drag & drop logo here
														</span>
														<span className="mt-1 text-xs text-muted-foreground">
															or click to browse
														</span>
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
															<SelectContent className="max-h-[300px] bg-popover text-popover-foreground border-border">
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
														<FormLabel className="text-foreground font-semibold">
															City / Town
														</FormLabel>
														<FormControl>
															<Input
																className="min-h-[44px] bg-background border-border text-foreground"
																placeholder="e.g. San Francisco"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
															<div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400 text-xs sm:text-sm">
																<Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
																<span>
																	A company named{" "}
																	<strong className="font-semibold">
																		{duplicateCompany.name}
																	</strong>{" "}
																	already exists.{" "}
																	<a
																		className="underline font-medium hover:text-amber-600 dark:hover:text-amber-300"
																		href={`/clients/${duplicateCompany.id}`}
																		rel="noreferrer"
																		target="_blank"
																	>
																		View profile
																	</a>
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
														<FormLabel className="text-foreground font-semibold">
															Industry
														</FormLabel>
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
																<SelectItem value="software">
																	Software / IT
																</SelectItem>
																<SelectItem value="finance">Finance</SelectItem>
																<SelectItem value="retail">
																	Retail / E-Commerce
																</SelectItem>
																<SelectItem value="healthcare">
																	Healthcare / Pharma
																</SelectItem>
																<SelectItem value="manufacturing">
																	Manufacturing
																</SelectItem>
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
										Next Step <ArrowRight className="h-4 w-4" />
									</Button>
								</div>
							</TabsContent>

							{/* TAB 2: TAX INFO */}
							<TabsContent className="space-y-6 focus-visible:outline-none" value="tax">
								<Card className="border border-border bg-card shadow-sm">
									<CardContent className="space-y-6 p-4 sm:p-6">
										<FormField
											control={form.control}
											name="hasGst"
											render={({ field }) => (
												<FormItem className="flex flex-row items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
													<div className="space-y-0.5">
														<FormLabel className="font-semibold text-foreground text-sm sm:text-base cursor-pointer">
															Registered for Tax (GST/VAT)?
														</FormLabel>
														<p className="text-xs text-muted-foreground">
															Enable if client issues B2B invoices requiring registered tax credentials.
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
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 rounded-xl border border-border bg-muted/10 p-4">
												<FormField
													control={form.control}
													name="gstin"
													render={({ field }) => (
														<FormItem>
															<FormLabel className="text-foreground font-semibold">
																GST / Tax Number
															</FormLabel>
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
															<FormLabel className="text-foreground font-semibold">
																PAN / Legal Tax ID
															</FormLabel>
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

										<div className="border-t border-border pt-5">
											<div className="flex items-center justify-between mb-3">
												<div>
													<FormLabel className="text-foreground font-semibold">
														Additional Tax & Registration IDs
													</FormLabel>
													<p className="text-xs text-muted-foreground">
														Include CIN, IEC, or other regulatory numbers.
													</p>
												</div>
												<Button
													onClick={() =>
														extraIdsArray.append({ idType: "", idValue: "" })
													}
													size="sm"
													type="button"
													variant="outline"
													className="min-h-[38px] gap-1.5"
												>
													<Plus className="h-4 w-4" /> Add Tax ID
												</Button>
											</div>

											{extraIdsArray.fields.map((field, index) => (
												<div
													className="mb-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
													key={field.id}
												>
													<FormField
														control={form.control}
														name={`extraIds.${index}.idType`}
														render={({ field }) => (
															<FormItem className="flex-1">
																<FormControl>
																	<Input
																		className="min-h-[44px] bg-background border-border text-foreground"
																		placeholder="ID Type (e.g. CIN, MSME)"
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
																		className="min-h-[44px] bg-background border-border text-foreground"
																		placeholder="Identification Value"
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
														className="h-11 w-11 text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-center"
														aria-label="Remove tax ID"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											))}
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-t border-border pt-5">
											<FormField
												control={form.control}
												name="clientType"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-foreground font-semibold">
															Client Type
														</FormLabel>
														<FormControl>
															<RadioGroup
																className="flex gap-4 pt-2"
																defaultValue={field.value}
																onValueChange={field.onChange}
															>
																<div className="flex items-center space-x-2">
																	<RadioGroupItem id="r1" value="individual" />
																	<Label htmlFor="r1" className="cursor-pointer text-foreground">
																		Individual
																	</Label>
																</div>
																<div className="flex items-center space-x-2">
																	<RadioGroupItem id="r2" value="org" />
																	<Label htmlFor="r2" className="cursor-pointer text-foreground">
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
														<FormLabel className="text-foreground font-semibold">
															Tax Treatment
														</FormLabel>
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
																<SelectItem value="consumer">
																	Consumer (B2C)
																</SelectItem>
																<SelectItem value="b2b">
																	Business (B2B)
																</SelectItem>
															</SelectContent>
														</Select>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</CardContent>
								</Card>
								<div className="flex items-center justify-between gap-3">
									<Button
										onClick={() => setActiveTab("basic")}
										type="button"
										variant="outline"
										className="min-h-[44px] px-4 gap-2"
									>
										<ArrowLeft className="h-4 w-4" /> Previous
									</Button>
									<Button
										onClick={() => setActiveTab("address")}
										type="button"
										className="min-h-[44px] px-6 gap-2"
									>
										Next Step <ArrowRight className="h-4 w-4" />
									</Button>
								</div>
							</TabsContent>

							{/* TAB 3: ADDRESS & SHIPPING */}
							<TabsContent className="space-y-6 focus-visible:outline-none" value="address">
								<Card className="border border-border bg-card shadow-sm">
									<CardContent className="space-y-6 p-4 sm:p-6">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="font-semibold text-lg text-foreground">
													Billing Address
												</h3>
												<p className="text-xs text-muted-foreground">
													Official registered address for financial invoices.
												</p>
											</div>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
															<SelectContent className="max-h-[300px] bg-popover text-popover-foreground border-border">
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
														<FormLabel className="text-foreground font-semibold">Postal / Pincode</FormLabel>
														<FormControl>
															<Input
																className="min-h-[44px] bg-background border-border text-foreground"
																placeholder="e.g. 94103"
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
															placeholder="123 Business Rd, Suite 400"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<div className="border-t border-border pt-6">
											<div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
												<div>
													<h3 className="font-semibold text-lg text-foreground">
														Shipping Details
													</h3>
													<p className="text-xs text-muted-foreground">
														Warehouse or delivery addresses for physical goods.
													</p>
												</div>
												<Button
													onClick={copyBillingToShipping}
													size="sm"
													type="button"
													variant="secondary"
													className="min-h-[40px] gap-2 self-start sm:self-auto"
												>
													<Download className="h-4 w-4" /> Copy Billing Address
												</Button>
											</div>

											{shippingArray.fields.map((field, index) => (
												<div
													className="group relative mb-4 rounded-xl border border-border bg-muted/20 p-4 space-y-4"
													key={field.id}
												>
													<div className="flex items-center justify-between">
														<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
															Shipping Destination #{index + 1}
														</span>
														<Button
															className="h-9 w-9 text-destructive hover:bg-destructive/10"
															onClick={() => shippingArray.remove(index)}
															size="icon"
															type="button"
															variant="ghost"
															aria-label="Remove shipping destination"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
													<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
														<FormField
															control={form.control}
															name={`shippingAddresses.${index}.country`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel className="text-xs text-muted-foreground">Country</FormLabel>
																	<FormControl>
																		<Input
																			className="min-h-[44px] bg-background border-border text-foreground"
																			{...field}
																		/>
																	</FormControl>
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`shippingAddresses.${index}.state`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel className="text-xs text-muted-foreground">State</FormLabel>
																	<FormControl>
																		<Input
																			className="min-h-[44px] bg-background border-border text-foreground"
																			{...field}
																		/>
																	</FormControl>
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`shippingAddresses.${index}.city`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel className="text-xs text-muted-foreground">City</FormLabel>
																	<FormControl>
																		<Input
																			className="min-h-[44px] bg-background border-border text-foreground"
																			{...field}
																		/>
																	</FormControl>
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`shippingAddresses.${index}.pincode`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel className="text-xs text-muted-foreground">Postal Code</FormLabel>
																	<FormControl>
																		<Input
																			className="min-h-[44px] bg-background border-border text-foreground"
																			{...field}
																		/>
																	</FormControl>
																</FormItem>
															)}
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
												className="min-h-[40px] gap-2"
											>
												<Plus className="h-4 w-4" /> Add Shipping Address
											</Button>
										</div>
									</CardContent>
								</Card>
								<div className="flex items-center justify-between gap-3">
									<Button
										onClick={() => setActiveTab("tax")}
										type="button"
										variant="outline"
										className="min-h-[44px] px-4 gap-2"
									>
										<ArrowLeft className="h-4 w-4" /> Previous
									</Button>
									<Button
										onClick={() => setActiveTab("details")}
										type="button"
										className="min-h-[44px] px-6 gap-2"
									>
										Next Step <ArrowRight className="h-4 w-4" />
									</Button>
								</div>
							</TabsContent>

							{/* TAB 4: ADDITIONAL DETAILS */}
							<TabsContent className="space-y-6 focus-visible:outline-none" value="details">
								<Card className="border border-border bg-card shadow-sm">
									<CardContent className="space-y-6 p-4 sm:p-6">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
											<FormField
												control={form.control}
												name="alias"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-foreground font-semibold">Alias / Nickname</FormLabel>
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
												name="uid"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-foreground font-semibold">UID (Auto-generated)</FormLabel>
														<FormControl>
															<Input
																className="min-h-[44px] bg-muted/40 border-border text-muted-foreground cursor-not-allowed"
																disabled
																placeholder="Assigned upon creation"
																{...field}
															/>
														</FormControl>
													</FormItem>
												)}
											/>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 items-start sm:items-end gap-4 sm:gap-6">
											<FormField
												control={form.control}
												name="email"
												render={({ field }) => (
													<FormItem className="flex-1">
														<FormLabel className="text-foreground font-semibold">Email Address</FormLabel>
														<FormControl>
															<Input
																className="min-h-[44px] bg-background border-border text-foreground"
																type="email"
																placeholder="billing@acme.com"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="showEmailInInvoice"
												render={({ field }) => (
													<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-border bg-muted/20 p-3 min-h-[44px]">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<FormLabel className="cursor-pointer font-normal text-sm text-foreground">
															Show Email in Invoice Header
														</FormLabel>
													</FormItem>
												)}
											/>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-2 items-start sm:items-end gap-4 sm:gap-6">
											<FormField
												control={form.control}
												name="phone"
												render={({ field }) => (
													<FormItem className="flex-1">
														<FormLabel className="text-foreground font-semibold">Phone Number</FormLabel>
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
												name="showPhoneInInvoice"
												render={({ field }) => (
													<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border border-border bg-muted/20 p-3 min-h-[44px]">
														<FormControl>
															<Checkbox
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</FormControl>
														<FormLabel className="cursor-pointer font-normal text-sm text-foreground">
															Show Phone in Invoice Header
														</FormLabel>
													</FormItem>
												)}
											/>
										</div>

										<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 border-t border-border pt-5">
											<FormField
												control={form.control}
												name="paymentDueDays"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-foreground font-semibold">Default Due (Days)</FormLabel>
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
											<FormField
												control={form.control}
												name="paymentAccount"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-foreground font-semibold">Payment Account</FormLabel>
														<Select
															defaultValue={field.value}
															disabled
															onValueChange={field.onChange}
														>
															<FormControl>
																<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground opacity-60">
																	<SelectValue placeholder="Default Ledger" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="none">None</SelectItem>
															</SelectContent>
														</Select>
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="upiId"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-foreground font-semibold">UPI ID</FormLabel>
														<Select
															defaultValue={field.value}
															disabled
															onValueChange={field.onChange}
														>
															<FormControl>
																<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground opacity-60">
																	<SelectValue placeholder="Standard UPI" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																<SelectItem value="none">None</SelectItem>
															</SelectContent>
														</Select>
													</FormItem>
												)}
											/>
										</div>

										<div className="border-t border-border pt-5">
											<div className="flex items-center justify-between mb-3">
												<div>
													<FormLabel className="text-foreground font-semibold">
														Custom Metadata Fields
													</FormLabel>
													<p className="text-xs text-muted-foreground">
														Arbitrary key-value attributes for CRM synchronization.
													</p>
												</div>
												<Button
													onClick={() =>
														customFieldsArray.append({
															fieldName: "",
															fieldValue: "",
														})
													}
													size="sm"
													type="button"
													variant="outline"
													className="min-h-[38px] gap-1.5"
												>
													<Plus className="h-4 w-4" /> Add Custom Field
												</Button>
											</div>

											{customFieldsArray.fields.map((field, index) => (
												<div
													className="mb-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
													key={field.id}
												>
													<FormField
														control={form.control}
														name={`customFields.${index}.fieldName`}
														render={({ field }) => (
															<FormItem className="flex-1">
																<FormControl>
																	<Input
																		className="min-h-[44px] bg-background border-border text-foreground"
																		placeholder="Field Label (e.g. Contract ID)"
																		{...field}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>
													<FormField
														control={form.control}
														name={`customFields.${index}.fieldValue`}
														render={({ field }) => (
															<FormItem className="flex-[2]">
																<FormControl>
																	<Input
																		className="min-h-[44px] bg-background border-border text-foreground"
																		placeholder="Value"
																		{...field}
																	/>
																</FormControl>
															</FormItem>
														)}
													/>
													<Button
														onClick={() => customFieldsArray.remove(index)}
														size="icon"
														type="button"
														variant="ghost"
														className="h-11 w-11 text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-center"
														aria-label="Remove field"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
								<div className="flex items-center justify-between gap-3">
									<Button
										onClick={() => setActiveTab("address")}
										type="button"
										variant="outline"
										className="min-h-[44px] px-4 gap-2"
									>
										<ArrowLeft className="h-4 w-4" /> Previous
									</Button>
									<Button
										onClick={() => setActiveTab("contacts")}
										type="button"
										className="min-h-[44px] px-6 gap-2"
									>
										Next Step <ArrowRight className="h-4 w-4" />
									</Button>
								</div>
							</TabsContent>

							{/* TAB 5: CONTACTS */}
							<TabsContent className="space-y-6 focus-visible:outline-none" value="contacts">
								<Card className="border border-border bg-card shadow-sm">
									<CardContent className="p-4 sm:p-6 space-y-4">
										<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
											<div>
												<h4 className="font-semibold text-lg text-foreground">
													Linked Contacts (Points of Contact)
												</h4>
												<p className="text-xs sm:text-sm text-muted-foreground">
													Add key stakeholders, finance leads, or billing managers.
												</p>
											</div>
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
												className="min-h-[40px] gap-1.5 self-start sm:self-auto"
											>
												<Plus className="h-4 w-4" />
												Add Contact
											</Button>
										</div>

										<div className="space-y-4">
											{pocsArray.fields.map((field, index) => (
												<div
													className="space-y-4 rounded-xl border border-border bg-muted/20 p-4"
													key={field.id}
												>
													<div className="flex items-center justify-between">
														<span className="text-xs font-semibold text-foreground uppercase tracking-wider">
															Contact #{index + 1}
														</span>
														<Button
															className="h-8 w-8 text-destructive hover:bg-destructive/10"
															onClick={() => pocsArray.remove(index)}
															size="icon"
															type="button"
															variant="ghost"
															aria-label="Remove contact"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
													<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
														<FormField
															control={form.control}
															name={`newPocs.${index}.firstName`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel className="text-xs font-medium text-foreground">
																		First Name <span className="text-destructive">*</span>
																	</FormLabel>
																	<FormControl>
																		<Input
																			className="min-h-[44px] bg-background border-border text-foreground"
																			placeholder="Jane"
																			{...field}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`newPocs.${index}.lastName`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel className="text-xs font-medium text-foreground">
																		Last Name
																	</FormLabel>
																	<FormControl>
																		<Input
																			className="min-h-[44px] bg-background border-border text-foreground"
																			placeholder="Doe"
																			{...field}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`newPocs.${index}.email`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel className="text-xs font-medium text-foreground">
																		Email
																	</FormLabel>
																	<FormControl>
																		<Input
																			className="min-h-[44px] bg-background border-border text-foreground"
																			type="email"
																			placeholder="jane.doe@acme.com"
																			{...field}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`newPocs.${index}.phone`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel className="text-xs font-medium text-foreground">
																		Phone
																	</FormLabel>
																	<FormControl>
																		<Input
																			className="min-h-[44px] bg-background border-border text-foreground"
																			placeholder="+1 (555) 000-0000"
																			{...field}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
													</div>
												</div>
											))}
											{pocsArray.fields.length === 0 && (
												<div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
													No individual contacts attached yet. Click &ldquo;Add Contact&rdquo; to attach stakeholders.
												</div>
											)}
										</div>
									</CardContent>
								</Card>
								<div className="flex items-center justify-between gap-3">
									<Button
										onClick={() => setActiveTab("details")}
										type="button"
										variant="outline"
										className="min-h-[44px] px-4 gap-2"
									>
										<ArrowLeft className="h-4 w-4" /> Previous
									</Button>
									<Button
										onClick={() => setActiveTab("attachments")}
										type="button"
										className="min-h-[44px] px-6 gap-2"
									>
										Next Step <ArrowRight className="h-4 w-4" />
									</Button>
								</div>
							</TabsContent>

							{/* TAB 6: ATTACHMENTS */}
							<TabsContent className="space-y-6 focus-visible:outline-none" value="attachments">
								<Card className="border border-border bg-card shadow-sm">
									<CardContent className="space-y-6 p-4 sm:p-6">
										<div>
											<FormLabel className="text-foreground font-semibold text-base block">
												Client Attachments & Documentation
											</FormLabel>
											<p className="text-xs sm:text-sm text-muted-foreground">
												Upload tax exemption certs, agreements, NDAs, or master service contracts.
											</p>
										</div>

										{attachmentsArray.fields.map((field, index) => (
											<div
												className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border border-border bg-muted/20 p-4"
												key={field.id}
											>
												<LinkIcon className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block" />
												<FormField
													control={form.control}
													name={`attachments.${index}.name`}
													render={({ field }) => (
														<FormItem className="flex-1">
															<FormControl>
																<Input
																	className="min-h-[44px] bg-background border-border text-foreground"
																	placeholder="Document Title (e.g. Signed NDA)"
																	{...field}
																/>
															</FormControl>
														</FormItem>
													)}
												/>
												<div className="flex flex-[2] min-h-[44px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 px-4 py-2 transition hover:border-primary/50 hover:bg-muted/60">
													<span className="flex items-center text-muted-foreground text-xs font-medium">
														<Plus className="mr-1 h-3.5 w-3.5" /> Attach Document File
													</span>
												</div>
												<Button
													onClick={() => attachmentsArray.remove(index)}
													size="icon"
													type="button"
													variant="ghost"
													className="h-11 w-11 text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-center"
													aria-label="Remove attachment"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										))}

										<Button
											onClick={() =>
												attachmentsArray.append({ name: "", url: "" })
											}
											size="sm"
											type="button"
											variant="outline"
											className="min-h-[40px] gap-2"
										>
											<Plus className="h-4 w-4" /> Add Document Row
										</Button>
									</CardContent>
								</Card>
								<div className="flex items-center justify-between gap-3">
									<Button
										onClick={() => setActiveTab("contacts")}
										type="button"
										variant="outline"
										className="min-h-[44px] px-4 gap-2"
									>
										<ArrowLeft className="h-4 w-4" /> Previous
									</Button>
									<Button
										onClick={() => setActiveTab("account")}
										type="button"
										className="min-h-[44px] px-6 gap-2"
									>
										Review & Save <ArrowRight className="h-4 w-4" />
									</Button>
								</div>
							</TabsContent>

							{/* TAB 7: ACCOUNT DETAILS */}
							<TabsContent className="space-y-6 focus-visible:outline-none" value="account">
								<Card className="border border-border bg-card shadow-sm">
									<CardContent className="p-6 py-12 text-center space-y-4">
										<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
											<CheckCircle2 className="h-8 w-8" />
										</div>
										<div className="max-w-md mx-auto space-y-1">
											<h3 className="text-lg font-semibold text-foreground">
												Ready to Onboard Client
											</h3>
											<p className="text-sm text-muted-foreground">
												Saving will generate the master organization record, wire initial ledger accounts, and register linked contact stakeholders.
											</p>
										</div>
									</CardContent>
								</Card>

								<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
									<Button
										onClick={() => setActiveTab("attachments")}
										type="button"
										variant="outline"
										className="min-h-[44px] px-4 gap-2 order-2 sm:order-1"
									>
										<ArrowLeft className="h-4 w-4" /> Previous
									</Button>
									<Button
										className="min-h-[44px] sm:min-w-[220px] px-6 gap-2 order-1 sm:order-2 font-semibold shadow-md"
										disabled={isSubmitting}
										size="lg"
										type="submit"
									>
										{isSubmitting ? (
											<>
												<Loader2 className="h-4 w-4 animate-spin" />
												Saving Profile...
											</>
										) : (
											<>
												<CheckCircle2 className="h-4 w-4" />
												Save Full Profile
											</>
										)}
									</Button>
								</div>
							</TabsContent>
						</Tabs>
					</form>
				</Form>
			</div>
		</DashboardLayout>
	);
}
