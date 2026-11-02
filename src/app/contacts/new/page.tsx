"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { City, Country, State } from "country-state-city";
import {
	ArrowLeft,
	Building2,
	ChevronRight,
	Globe,
	IdCard,
	Loader2,
	Mail,
	MapPin,
	Phone,
	Plus,
	Share2,
	Trash2,
	UploadCloud,
	User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

const newContactSchema = z.object({
	// Basic Info
	companyId: z.string().optional(),
	avatarUrl: z.string().optional(),
	salutation: z.string().optional(),
	firstName: z.string().min(1, "First Name is required"),
	lastName: z.string().optional(),

	// Contact Info
	email: z.string().email("Invalid email").optional().or(z.literal("")),
	phone: z.string().optional(),
	additionalEmails: z
		.array(z.object({ email: z.string().email("Invalid email") }))
		.default([]),
	additionalPhones: z.array(z.object({ phone: z.string() })).default([]),

	// Tax Info
	pan: z
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
	aadhaar: z
		.union([
			z.literal(""),
			z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
		])
		.optional(),
	passport: z
		.union([
			z.literal(""),
			z
				.string()
				.regex(
					/^[A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9]$/,
					"Invalid Passport format",
				),
		])
		.optional(),

	// Social Profiles
	socialLinks: z
		.array(
			z.object({
				platform: z.string(),
				url: z.string().url("Must be a valid URL"),
			}),
		)
		.default([]),

	// Address
	addressCountry: z.string().optional(),
	addressState: z.string().optional(),
	addressDistrict: z.string().optional(),
	addressCity: z.string().optional(),
	addressBuilding: z.string().optional(),
	addressStreet: z.string().optional(),
	addressZip: z.string().optional(),
});

type NewContactValues = z.infer<typeof newContactSchema>;

export default function NewContactFullPage() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { data: companies } = api.crm.getCompanies.useQuery();
	const createContact = api.crm.createContact.useMutation();

	const form = useForm<NewContactValues>({
		resolver: zodResolver(newContactSchema) as any,
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			additionalEmails: [],
			additionalPhones: [],
			socialLinks: [],
			addressCountry: "IN",
			addressState: "",
			addressCity: "",
			addressStreet: "",
			addressZip: "",
			pan: "",
			aadhaar: "",
			passport: "",
		},
	});

	const { control, watch } = form;
	const additionalEmailsArray = useFieldArray({
		control,
		name: "additionalEmails",
	});
	const additionalPhonesArray = useFieldArray({
		control,
		name: "additionalPhones",
	});
	const socialsArray = useFieldArray({ control, name: "socialLinks" });

	const addressCountry = watch("addressCountry");
	const addressState = watch("addressState");
	const countries = Country.getAllCountries();
	const states = addressCountry ? State.getStatesOfCountry(addressCountry) : [];
	const cities =
		addressState && addressCountry
			? City.getCitiesOfState(addressCountry, addressState)
			: [];

	const onSubmit = async (data: NewContactValues) => {
		try {
			setIsSubmitting(true);

			const payload = {
				...data,
				companyId:
					data.companyId && data.companyId !== "none"
						? data.companyId
						: undefined,
			};

			await createContact.mutateAsync(payload);
			toast.success("Contact created successfully!");
			router.push("/clients");
		} catch (e: any) {
			toast.error(e.message || "Failed to create contact");
		} finally {
			setIsSubmitting(false);
		}
	};

	const nameInitial = watch("firstName")
		? watch("firstName").charAt(0).toUpperCase()
		: "?";

	return (
		<DashboardLayout>
			<div className="mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-8 space-y-6">
				{/* Header & Breadcrumbs */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
					<div className="space-y-1">
						<div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
							<Link
								href="/clients"
								className="hover:text-foreground transition-colors"
							>
								Contacts
							</Link>
							<ChevronRight className="h-3.5 w-3.5" />
							<span className="text-foreground font-medium">New Contact</span>
						</div>
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
							Create New Contact
						</h1>
						<p className="text-sm text-muted-foreground">
							Register an independent stakeholder, executive, or client representative.
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
					<form
						className="space-y-6"
						onSubmit={form.handleSubmit(onSubmit)}
					>
						{/* Basic Information Card */}
						<Card className="border border-border bg-card shadow-sm">
							<CardHeader className="pb-3 border-b border-border/60">
								<div className="flex items-center gap-2">
									<User className="h-4 w-4 text-primary" />
									<CardTitle className="text-base sm:text-lg font-bold text-foreground">
										Basic Stakeholder Profile
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="space-y-6 pt-5 p-4 sm:p-6">
								<div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
									<div className="group relative flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted/30 transition hover:border-primary/50 hover:bg-muted/50">
										<span className="font-bold text-3xl text-muted-foreground transition group-hover:opacity-0">
											{nameInitial}
										</span>
										<div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 opacity-0 transition group-hover:opacity-100">
											<UploadCloud className="mb-1 h-6 w-6 text-primary" />
											<span className="text-[10px] font-medium text-foreground">
												Upload DP
											</span>
										</div>
									</div>

									<div className="grid w-full flex-1 grid-cols-1 sm:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="companyId"
											render={({ field }) => (
												<FormItem className="sm:col-span-2">
													<FormLabel className="text-foreground font-semibold">
														Linked Organization (Optional)
													</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
																<SelectValue placeholder="Select an organization (or leave blank for individual)" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="max-h-[300px] bg-popover text-popover-foreground border-border">
															<SelectItem value="none">
																None (Independent Stakeholder)
															</SelectItem>
															{companies?.map((c) => (
																<SelectItem key={c.id} value={c.id}>
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
											name="salutation"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Salutation</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
																<SelectValue placeholder="e.g. Mr, Ms, Dr" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="bg-popover text-popover-foreground border-border">
															<SelectItem value="Mr.">Mr.</SelectItem>
															<SelectItem value="Mrs.">Mrs.</SelectItem>
															<SelectItem value="Ms.">Ms.</SelectItem>
															<SelectItem value="Dr.">Dr.</SelectItem>
															<SelectItem value="Prof.">Prof.</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>

										<div className="hidden sm:block" />

										<FormField
											control={form.control}
											name="firstName"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">
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
											name="lastName"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Last Name</FormLabel>
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
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Contact Methods Card */}
						<Card className="border border-border bg-card shadow-sm">
							<CardHeader className="pb-3 border-b border-border/60">
								<div className="flex items-center gap-2">
									<Mail className="h-4 w-4 text-primary" />
									<CardTitle className="text-base sm:text-lg font-bold text-foreground">
										Communication Channels
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="space-y-6 pt-5 p-4 sm:p-6">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">Primary Email</FormLabel>
												<FormControl>
													<Input
														className="min-h-[44px] bg-background border-border text-foreground"
														type="email"
														placeholder="jane.doe@company.com"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="phone"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">Primary Phone</FormLabel>
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

								{/* Additional Emails */}
								<div className="space-y-3 border-t border-border/60 pt-4">
									<div className="flex items-center justify-between">
										<Label className="text-sm font-semibold text-foreground">
											Additional Emails
										</Label>
										<Button
											onClick={() => additionalEmailsArray.append({ email: "" })}
											size="sm"
											type="button"
											variant="outline"
											className="min-h-[36px] gap-1.5"
										>
											<Plus className="h-3.5 w-3.5" /> Add Email
										</Button>
									</div>

									{additionalEmailsArray.fields.map((field, index) => (
										<div className="flex items-center gap-2" key={field.id}>
											<FormField
												control={form.control}
												name={`additionalEmails.${index}.email`}
												render={({ field: f }) => (
													<FormItem className="flex-1">
														<FormControl>
															<Input
																className="min-h-[44px] bg-background border-border text-foreground"
																placeholder="alternate.email@company.com"
																type="email"
																{...f}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<Button
												className="h-11 w-11 text-destructive hover:bg-destructive/10 shrink-0"
												onClick={() => additionalEmailsArray.remove(index)}
												size="icon"
												type="button"
												variant="ghost"
												aria-label="Remove email"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>

								{/* Additional Phones */}
								<div className="space-y-3 border-t border-border/60 pt-4">
									<div className="flex items-center justify-between">
										<Label className="text-sm font-semibold text-foreground">
											Additional Phone Numbers
										</Label>
										<Button
											onClick={() => additionalPhonesArray.append({ phone: "" })}
											size="sm"
											type="button"
											variant="outline"
											className="min-h-[36px] gap-1.5"
										>
											<Plus className="h-3.5 w-3.5" /> Add Phone
										</Button>
									</div>

									{additionalPhonesArray.fields.map((field, index) => (
										<div className="flex items-center gap-2" key={field.id}>
											<FormField
												control={form.control}
												name={`additionalPhones.${index}.phone`}
												render={({ field: f }) => (
													<FormItem className="flex-1">
														<FormControl>
															<Input
																className="min-h-[44px] bg-background border-border text-foreground"
																placeholder="Secondary Mobile / Direct Line"
																{...f}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<Button
												className="h-11 w-11 text-destructive hover:bg-destructive/10 shrink-0"
												onClick={() => additionalPhonesArray.remove(index)}
												size="icon"
												type="button"
												variant="ghost"
												aria-label="Remove phone"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Tax & Identification */}
						<Card className="border border-border bg-card shadow-sm">
							<CardHeader className="pb-3 border-b border-border/60">
								<div className="flex items-center gap-2">
									<IdCard className="h-4 w-4 text-primary" />
									<CardTitle className="text-base sm:text-lg font-bold text-foreground">
										Identity & Compliance Details
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="pt-5 p-4 sm:p-6">
								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<FormField
										control={form.control}
										name="pan"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">PAN Number</FormLabel>
												<FormControl>
													<Input
														className="min-h-[44px] bg-background border-border text-foreground uppercase"
														placeholder="ABCDE1234F"
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
										name="aadhaar"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">Aadhaar ID</FormLabel>
												<FormControl>
													<Input
														className="min-h-[44px] bg-background border-border text-foreground"
														placeholder="123456789012"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="passport"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">Passport Number</FormLabel>
												<FormControl>
													<Input
														className="min-h-[44px] bg-background border-border text-foreground uppercase"
														placeholder="A1234567"
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
							</CardContent>
						</Card>

						{/* Social Profiles */}
						<Card className="border border-border bg-card shadow-sm">
							<CardHeader className="pb-3 border-b border-border/60">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Share2 className="h-4 w-4 text-primary" />
										<CardTitle className="text-base sm:text-lg font-bold text-foreground">
											Social & Web Profiles
										</CardTitle>
									</div>
									<Button
										onClick={() =>
											socialsArray.append({ platform: "linkedin", url: "" })
										}
										size="sm"
										type="button"
										variant="outline"
										className="min-h-[36px] gap-1.5"
									>
										<Plus className="h-3.5 w-3.5" /> Add Profile
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-3 pt-5 p-4 sm:p-6">
								{socialsArray.fields.map((field, index) => (
									<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2" key={field.id}>
										<FormField
											control={form.control}
											name={`socialLinks.${index}.platform`}
											render={({ field: f }) => (
												<FormItem className="w-full sm:w-[160px]">
													<Select
														defaultValue={f.value}
														onValueChange={f.onChange}
													>
														<FormControl>
															<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
																<SelectValue placeholder="Platform" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="bg-popover text-popover-foreground border-border">
															<SelectItem value="linkedin">LinkedIn</SelectItem>
															<SelectItem value="twitter">
																X (Twitter)
															</SelectItem>
															<SelectItem value="facebook">Facebook</SelectItem>
															<SelectItem value="instagram">
																Instagram
															</SelectItem>
															<SelectItem value="github">GitHub</SelectItem>
															<SelectItem value="website">Website</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`socialLinks.${index}.url`}
											render={({ field: f }) => (
												<FormItem className="flex-1">
													<FormControl>
														<Input
															className="min-h-[44px] bg-background border-border text-foreground"
															placeholder="https://..."
															{...f}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<Button
											className="h-11 w-11 text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-center"
											onClick={() => socialsArray.remove(index)}
											size="icon"
											type="button"
											variant="ghost"
											aria-label="Remove social profile"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}

								{socialsArray.fields.length === 0 && (
									<div className="text-xs text-muted-foreground italic py-2">
										No social profiles linked.
									</div>
								)}
							</CardContent>
						</Card>

						{/* Address Details */}
						<Card className="border border-border bg-card shadow-sm">
							<CardHeader className="pb-3 border-b border-border/60">
								<div className="flex items-center gap-2">
									<MapPin className="h-4 w-4 text-primary" />
									<CardTitle className="text-base sm:text-lg font-bold text-foreground">
										Address Information
									</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="pt-5 p-4 sm:p-6">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="addressCountry"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">Country</FormLabel>
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
										name="addressState"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">State / Province</FormLabel>
												<Select
													defaultValue={field.value}
													disabled={!addressCountry}
													onValueChange={field.onChange}
												>
													<FormControl>
														<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground disabled:opacity-50">
															<SelectValue placeholder="Select State" />
														</SelectTrigger>
													</FormControl>
													<SelectContent className="max-h-[200px] bg-popover text-popover-foreground border-border">
														{states.map((s) => (
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
										name="addressDistrict"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">District (Optional)</FormLabel>
												<FormControl>
													<Input
														className="min-h-[44px] bg-background border-border text-foreground"
														placeholder="County or District"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="addressCity"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">City</FormLabel>
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
														{cities.map((c) => (
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
										name="addressBuilding"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">Building / Suite</FormLabel>
												<FormControl>
													<Input
														className="min-h-[44px] bg-background border-border text-foreground"
														placeholder="Apartment, Floor, Suite"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="addressZip"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">Postal / Zip Code</FormLabel>
												<FormControl>
													<Input
														className="min-h-[44px] bg-background border-border text-foreground"
														placeholder="e.g. 10001"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="mt-4">
									<FormField
										control={form.control}
										name="addressStreet"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">Street Address</FormLabel>
												<FormControl>
													<Input
														className="min-h-[44px] bg-background border-border text-foreground"
														placeholder="e.g. 123 Main Street"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Action Buttons */}
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
							<Button asChild type="button" variant="outline" className="min-h-[44px] px-6 order-2 sm:order-1">
								<Link href="/clients">Cancel</Link>
							</Button>
							<Button
								className="min-h-[44px] sm:min-w-[180px] font-semibold order-1 sm:order-2 shadow-sm"
								disabled={isSubmitting}
								type="submit"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving Contact...
									</>
								) : (
									"Save Contact"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</div>
		</DashboardLayout>
	);
}
