"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { City, Country, State } from "country-state-city";
import {
	Download,
	Info,
	Link as LinkIcon,
	Loader2,
	Plus,
	Trash2,
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

	// Section 5: Linked Contact
	// blank for now

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

	const currentCountry = watch("country");
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
				// Tax Info Mapping
				hasGst: data.hasGst,
				gstin: data.gstin || undefined,
				businessPan: data.businessPan || undefined,
				clientType: data.clientType,
				taxTreatment: data.taxTreatment,
				extraIds: data.extraIds,
				// Billing Address Mapping
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
		<div className={isModal ? "" : "mx-auto max-w-5xl pb-12"}>
			<div className="mb-6 flex items-center justify-between border-slate-800 border-b pb-4">
				<div>
					<h2 className="font-bold text-2xl text-white tracking-tight">
						Add New Client
					</h2>
					<p className="mt-1 text-slate-400 text-sm">
						Fill out the detailed profile for your new client or organization.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/clients">Cancel</Link>
				</Button>
			</div>

			<Form {...form}>
				<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
					<Tabs
						className="w-full"
						onValueChange={setActiveTab}
						value={activeTab}
					>
						<TabsList className="mb-6 grid h-auto grid-cols-6 rounded-lg border border-slate-800 bg-slate-900 p-1">
							<TabsTrigger className="py-2.5" value="basic">
								Basic Info
							</TabsTrigger>
							<TabsTrigger className="py-2.5" value="tax">
								Tax Info
							</TabsTrigger>
							<TabsTrigger className="py-2.5" value="address">
								Addresses
							</TabsTrigger>
							<TabsTrigger className="py-2.5" value="details">
								Details
							</TabsTrigger>
							<TabsTrigger className="py-2.5" value="contacts">
								Contacts
							</TabsTrigger>
							<TabsTrigger className="py-2.5" value="attachments">
								Attachments
							</TabsTrigger>
							<TabsTrigger className="py-2.5" value="account">
								Account
							</TabsTrigger>
						</TabsList>

						{/* TAB 1: BASIC INFO */}
						<TabsContent className="space-y-6" value="basic">
							<Card className="border-slate-800 bg-slate-900">
								<CardContent className="space-y-6 p-6">
									<FormField
										control={form.control}
										name="logo"
										render={() => (
											<FormItem>
												<FormLabel>Client Logo</FormLabel>
												<div className="flex h-32 w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-slate-700 border-dashed bg-slate-950 text-slate-400 transition hover:border-slate-500 hover:bg-slate-800">
													<Plus className="mb-2 h-8 w-8 text-slate-500" />
													<span className="text-sm">Drag & drop logo here</span>
													<span className="mt-1 text-slate-500 text-xs">
														or click to browse
													</span>
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="grid grid-cols-2 gap-6">
										<FormField
											control={form.control}
											name="country"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Country *</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="border-slate-800 bg-slate-950">
																<SelectValue placeholder="Select Country" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="max-h-[300px] border-slate-800 bg-slate-900 text-white">
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
													<FormLabel>City / Town</FormLabel>
													<FormControl>
														<Input
															className="border-slate-800 bg-slate-950"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="grid grid-cols-2 gap-6">
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<FormLabel>Business Name *</FormLabel>
													<FormControl>
														<Input
															className="border-slate-800 bg-slate-950"
															placeholder="Acme Corp"
															{...field}
														/>
													</FormControl>
													{duplicateCompany && (
														<div className="mt-1 flex items-center gap-2 rounded border border-amber-500/20 bg-amber-500/10 p-2 text-amber-500 text-sm">
															<Info className="h-4 w-4 shrink-0" />
															<span>
																The company with name{" "}
																<span className="font-semibold">
																	{duplicateCompany.name}
																</span>{" "}
																already exists.{" "}
																<a
																	className="underline hover:text-amber-400"
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
													<FormLabel>Industry</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="border-slate-800 bg-slate-950">
																<SelectValue placeholder="Select Industry" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="border-slate-800 bg-slate-900 text-white">
															<SelectItem value="software">
																Software / IT
															</SelectItem>
															<SelectItem value="finance">Finance</SelectItem>
															<SelectItem value="retail">
																Retail / E-Commerce
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
								<Button onClick={() => setActiveTab("tax")} type="button">
									Next Step
								</Button>
							</div>
						</TabsContent>

						{/* TAB 2: TAX INFO */}
						<TabsContent className="space-y-6" value="tax">
							<Card className="border-slate-800 bg-slate-900">
								<CardContent className="space-y-6 p-6">
									<FormField
										control={form.control}
										name="hasGst"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">
												<div className="space-y-0.5">
													<FormLabel className="font-semibold text-base">
														Registered for Tax (GST/VAT)?
													</FormLabel>
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
										<div className="grid grid-cols-2 gap-6 rounded-lg border border-slate-800 bg-slate-950 p-4">
											<FormField
												control={form.control}
												name="gstin"
												render={({ field }) => (
													<FormItem>
														<FormLabel>GST / Tax Number</FormLabel>
														<FormControl>
															<Input
																className="border-slate-800 bg-slate-900 uppercase"
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
														<FormLabel>PAN / Legal ID</FormLabel>
														<FormControl>
															<Input
																className="border-slate-800 bg-slate-900 uppercase"
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

									<div className="border-slate-800 border-t pt-4">
										<FormLabel className="mb-2 block">
											Additional Tax IDs
										</FormLabel>
										{extraIdsArray.fields.map((field, index) => (
											<div className="mb-4 flex gap-4" key={field.id}>
												<FormField
													control={form.control}
													name={`extraIds.${index}.idType`}
													render={({ field }) => (
														<FormItem className="flex-1">
															<FormControl>
																<Input
																	className="border-slate-800 bg-slate-950"
																	placeholder="ID Type (e.g. CIN)"
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
																	className="border-slate-800 bg-slate-950"
																	placeholder="Value"
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
													variant="destructive"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										))}
										<Button
											className="mt-2"
											onClick={() =>
												extraIdsArray.append({ idType: "", idValue: "" })
											}
											size="sm"
											type="button"
											variant="outline"
										>
											<Plus className="mr-2 h-4 w-4" /> Add Tax ID
										</Button>
									</div>

									<div className="grid grid-cols-2 gap-6 border-slate-800 border-t pt-4">
										<FormField
											control={form.control}
											name="clientType"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Client Type</FormLabel>
													<FormControl>
														<RadioGroup
															className="flex space-x-4"
															defaultValue={field.value}
															onValueChange={field.onChange}
														>
															<div className="flex items-center space-x-2">
																<RadioGroupItem id="r1" value="individual" />
																<Label htmlFor="r1">Individual</Label>
															</div>
															<div className="flex items-center space-x-2">
																<RadioGroupItem id="r2" value="org" />
																<Label htmlFor="r2">Organization</Label>
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
													<FormLabel>Tax Treatment</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="border-slate-800 bg-slate-950">
																<SelectValue placeholder="Select..." />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="border-slate-800 bg-slate-900 text-white">
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
							<div className="flex justify-between">
								<Button
									onClick={() => setActiveTab("basic")}
									type="button"
									variant="outline"
								>
									Previous
								</Button>
								<Button onClick={() => setActiveTab("address")} type="button">
									Next Step
								</Button>
							</div>
						</TabsContent>

						{/* TAB 3: ADDRESS & SHIPPING */}
						<TabsContent className="space-y-6" value="address">
							<Card className="border-slate-800 bg-slate-900">
								<CardContent className="space-y-6 p-6">
									<h3 className="font-semibold text-lg text-white">
										Billing Address
									</h3>
									<div className="grid grid-cols-2 gap-6">
										<FormField
											control={form.control}
											name="addressCountry"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Country</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={(v) => {
															field.onChange(v);
															setValue("addressState", "");
															setValue("addressCity", "");
														}}
													>
														<FormControl>
															<SelectTrigger className="border-slate-800 bg-slate-950">
																<SelectValue placeholder="Select Country" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="max-h-[300px] border-slate-800 bg-slate-900 text-white">
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
													<FormLabel>State / Province</FormLabel>
													<Select
														defaultValue={field.value}
														disabled={!addressCountry}
														onValueChange={(v) => {
															field.onChange(v);
															setValue("addressCity", "");
														}}
													>
														<FormControl>
															<SelectTrigger className="border-slate-800 bg-slate-950">
																<SelectValue placeholder="Select State" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="max-h-[200px] border-slate-800 bg-slate-900 text-white">
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
													<FormLabel>City / Town</FormLabel>
													<Select
														defaultValue={field.value}
														disabled={!addressState}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="border-slate-800 bg-slate-950">
																<SelectValue placeholder="Select City" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="max-h-[200px] border-slate-800 bg-slate-900 text-white">
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
													<FormLabel>Pincode</FormLabel>
													<FormControl>
														<Input
															className="border-slate-800 bg-slate-950"
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
											<FormItem className="mt-4">
												<FormLabel>Street Address</FormLabel>
												<FormControl>
													<Input
														className="border-slate-800 bg-slate-950"
														placeholder="123 Business Rd, Floor 4"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="border-slate-800 border-t pt-8">
										<div className="mb-4 flex items-center justify-between">
											<h3 className="font-semibold text-lg text-white">
												Shipping Details
											</h3>
											<Button
												onClick={copyBillingToShipping}
												size="sm"
												type="button"
												variant="secondary"
											>
												<Download className="mr-2 h-4 w-4" /> Copy Billing
												Address
											</Button>
										</div>

										{shippingArray.fields.map((field, index) => (
											<div
												className="group relative mb-4 rounded-lg border border-slate-800 bg-slate-950 p-4"
												key={field.id}
											>
												<Button
													className="absolute top-2 right-2 text-red-400 opacity-0 hover:bg-red-900/20 group-hover:opacity-100"
													onClick={() => shippingArray.remove(index)}
													size="icon"
													type="button"
													variant="ghost"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
												<div className="grid grid-cols-2 gap-4">
													<FormField
														control={form.control}
														name={`shippingAddresses.${index}.country`}
														render={({ field }) => (
															<FormItem>
																<FormLabel>Country</FormLabel>
																<FormControl>
																	<Input
																		className="border-slate-800 bg-slate-900"
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
																<FormLabel>State</FormLabel>
																<FormControl>
																	<Input
																		className="border-slate-800 bg-slate-900"
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
																<FormLabel>City</FormLabel>
																<FormControl>
																	<Input
																		className="border-slate-800 bg-slate-900"
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
																<FormLabel>Pincode</FormLabel>
																<FormControl>
																	<Input
																		className="border-slate-800 bg-slate-900"
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
										>
											<Plus className="mr-2 h-4 w-4" /> Have Multiple Shipping
											Addresses? Add Here
										</Button>
									</div>
								</CardContent>
							</Card>
							<div className="flex justify-between">
								<Button
									onClick={() => setActiveTab("tax")}
									type="button"
									variant="outline"
								>
									Previous
								</Button>
								<Button onClick={() => setActiveTab("details")} type="button">
									Next Step
								</Button>
							</div>
						</TabsContent>

						{/* TAB 4: ADDITIONAL DETAILS */}
						<TabsContent className="space-y-6" value="details">
							<Card className="border-slate-800 bg-slate-900">
								<CardContent className="space-y-6 p-6">
									<div className="grid grid-cols-2 gap-6">
										<FormField
											control={form.control}
											name="alias"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Alias / Nickname</FormLabel>
													<FormControl>
														<Input
															className="border-slate-800 bg-slate-950"
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
													<FormLabel>UID (Auto-generated)</FormLabel>
													<FormControl>
														<Input
															className="border-slate-800 bg-slate-950 text-slate-500"
															disabled
															placeholder="Will be assigned upon save"
															{...field}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
									</div>

									<div className="grid grid-cols-2 items-end gap-6">
										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormLabel>Email Address</FormLabel>
													<FormControl>
														<Input
															className="border-slate-800 bg-slate-950"
															type="email"
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
												<FormItem className="mb-1 flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-slate-800 bg-slate-950 p-3">
													<FormControl>
														<Checkbox
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
													<FormLabel className="cursor-pointer font-normal text-slate-300">
														Show Email in Invoice
													</FormLabel>
												</FormItem>
											)}
										/>
									</div>

									<div className="grid grid-cols-2 items-end gap-6">
										<FormField
											control={form.control}
											name="phone"
											render={({ field }) => (
												<FormItem className="flex-1">
													<FormLabel>Phone Number</FormLabel>
													<div className="PhoneInputWrapper">
														<PhoneInput
															className="w-full border-slate-800 bg-slate-950"
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
												<FormItem className="mb-1 flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-slate-800 bg-slate-950 p-3">
													<FormControl>
														<Checkbox
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
													<FormLabel className="cursor-pointer font-normal text-slate-300">
														Show Phone in Invoice
													</FormLabel>
												</FormItem>
											)}
										/>
									</div>

									<div className="grid grid-cols-3 gap-6 border-slate-800 border-t pt-4">
										<FormField
											control={form.control}
											name="paymentDueDays"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Default Payment Due (Days)</FormLabel>
													<FormControl>
														<Input
															className="border-slate-800 bg-slate-950"
															type="number"
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
													<FormLabel>Payment Account</FormLabel>
													<Select
														defaultValue={field.value}
														disabled
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="border-slate-800 bg-slate-950 opacity-50">
																<SelectValue placeholder="Coming Soon" />
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
													<FormLabel>UPI ID</FormLabel>
													<Select
														defaultValue={field.value}
														disabled
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="border-slate-800 bg-slate-950 opacity-50">
																<SelectValue placeholder="Coming Soon" />
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

									<div className="border-slate-800 border-t pt-4">
										<FormLabel className="mb-2 block">Custom Fields</FormLabel>
										{customFieldsArray.fields.map((field, index) => (
											<div className="mb-4 flex gap-4" key={field.id}>
												<FormField
													control={form.control}
													name={`customFields.${index}.fieldName`}
													render={({ field }) => (
														<FormItem className="flex-1">
															<FormControl>
																<Input
																	className="border-slate-800 bg-slate-950"
																	placeholder="Field Name (e.g. Birthday)"
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
																	className="border-slate-800 bg-slate-950"
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
													variant="destructive"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										))}
										<Button
											className="mt-2"
											onClick={() =>
												customFieldsArray.append({
													fieldName: "",
													fieldValue: "",
												})
											}
											size="sm"
											type="button"
											variant="outline"
										>
											<Plus className="mr-2 h-4 w-4" /> Add Custom Field
										</Button>
									</div>
								</CardContent>
							</Card>
							<div className="flex justify-between">
								<Button
									onClick={() => setActiveTab("address")}
									type="button"
									variant="outline"
								>
									Previous
								</Button>
								<Button onClick={() => setActiveTab("contacts")} type="button">
									Next Step
								</Button>
							</div>
						</TabsContent>

						{/* TAB 4.5: CONTACTS */}
						<TabsContent className="space-y-6" value="contacts">
							<Card className="border-slate-800 bg-slate-900">
								<CardContent className="p-6">
									<div className="mb-4 flex items-center justify-between">
										<div>
											<h4 className="font-semibold text-lg text-white">
												Linked Contacts (POCs)
											</h4>
											<p className="text-slate-400 text-sm">
												Add individuals associated with this client.
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
										>
											<Plus className="mr-2 h-4 w-4" />
											Add Contact
										</Button>
									</div>

									<div className="space-y-4">
										{pocsArray.fields.map((field, index) => (
											<div
												className="space-y-4 rounded-md border border-slate-800 bg-slate-950/50 p-4"
												key={field.id}
											>
												<div className="flex items-center justify-between">
													<h5 className="font-medium text-sm text-white">
														Contact #{index + 1}
													</h5>
													<Button
														className="h-8 w-8 text-red-400 hover:bg-red-950/30 hover:text-red-300"
														onClick={() => pocsArray.remove(index)}
														size="icon"
														type="button"
														variant="ghost"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
												<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
													<FormField
														control={form.control}
														name={`newPocs.${index}.firstName`}
														render={({ field }) => (
															<FormItem>
																<FormLabel>
																	First Name{" "}
																	<span className="text-red-500">*</span>
																</FormLabel>
																<FormControl>
																	<Input
																		className="border-slate-800 bg-slate-900"
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
																<FormLabel>Last Name</FormLabel>
																<FormControl>
																	<Input
																		className="border-slate-800 bg-slate-900"
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
																<FormLabel>Email</FormLabel>
																<FormControl>
																	<Input
																		className="border-slate-800 bg-slate-900"
																		type="email"
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
																<FormLabel>Phone</FormLabel>
																<FormControl>
																	<Input
																		className="border-slate-800 bg-slate-900"
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
											<div className="rounded-md border border-slate-800 border-dashed p-8 text-center text-slate-500 text-sm">
												No contacts added yet. Click "Add Contact" to link
												someone to this company.
											</div>
										)}
									</div>
								</CardContent>
							</Card>
							<div className="flex justify-between">
								<Button
									onClick={() => setActiveTab("details")}
									type="button"
									variant="outline"
								>
									Previous
								</Button>
								<Button
									onClick={() => setActiveTab("attachments")}
									type="button"
								>
									Next Step
								</Button>
							</div>
						</TabsContent>

						{/* TAB 5: ATTACHMENTS */}
						<TabsContent className="space-y-6" value="attachments">
							<Card className="border-slate-800 bg-slate-900">
								<CardContent className="space-y-6 p-6">
									<FormLabel className="mb-2 block">
										Client Attachments & Documents
									</FormLabel>
									<p className="mb-4 text-slate-400 text-sm">
										Attach relevant documentation like NDAs, contracts, or tax
										exemption forms.
									</p>
									{attachmentsArray.fields.map((field, index) => (
										<div
											className="mb-4 flex items-center gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4"
											key={field.id}
										>
											<LinkIcon className="h-5 w-5 text-slate-500" />
											<FormField
												control={form.control}
												name={`attachments.${index}.name`}
												render={({ field }) => (
													<FormItem className="flex-1">
														<FormControl>
															<Input
																className="border-slate-800 bg-slate-900"
																placeholder="Document Name"
																{...field}
															/>
														</FormControl>
													</FormItem>
												)}
											/>
											<div className="flex flex-[2] cursor-pointer items-center justify-center rounded-lg border-2 border-slate-700 border-dashed bg-slate-900 p-2 transition hover:border-slate-500 hover:bg-slate-800">
												<span className="flex items-center text-slate-400 text-xs">
													<Plus className="mr-1 h-3 w-3" /> Drop file here
												</span>
											</div>
											<Button
												onClick={() => attachmentsArray.remove(index)}
												size="icon"
												type="button"
												variant="destructive"
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
									>
										<Plus className="mr-2 h-4 w-4" /> Add Attachment Field
									</Button>
								</CardContent>
							</Card>
							<div className="flex justify-between">
								<Button
									onClick={() => setActiveTab("details")}
									type="button"
									variant="outline"
								>
									Previous
								</Button>
								<Button onClick={() => setActiveTab("account")} type="button">
									Next Step
								</Button>
							</div>
						</TabsContent>

						{/* TAB 6: ACCOUNT DETAILS */}
						<TabsContent className="space-y-6" value="account">
							<Card className="border-slate-800 bg-slate-900">
								<CardContent className="p-6 py-12 text-center">
									<p className="text-slate-400">
										Linked Account Details will appear here after creation.
									</p>
								</CardContent>
							</Card>
							<div className="flex items-center justify-between">
								<Button
									onClick={() => setActiveTab("attachments")}
									type="button"
									variant="outline"
								>
									Previous
								</Button>
								<Button
									className="min-w-[200px] bg-blue-600 hover:bg-blue-700"
									disabled={isSubmitting}
									size="lg"
									type="submit"
								>
									{isSubmitting && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Save Full Profile
								</Button>
							</div>
						</TabsContent>
					</Tabs>
				</form>
			</Form>
		</div>
	);
}
