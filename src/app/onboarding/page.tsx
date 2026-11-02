"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { City, Country, State } from "country-state-city";
import {
	ArrowLeft,
	ArrowRight,
	Building2,
	CheckCircle2,
	FileText,
	Globe,
	Loader2,
	MapPin,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "~/components/ui/button";
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
import { api } from "~/trpc/react";

const onboardingSchema = z.object({
	name: z.string().min(2, "Company name must be at least 2 characters"),
	displayName: z.string().optional(),
	teamSize: z.string().min(1, "Please select a team size"),
	website: z
		.string()
		.refine((val) => {
			if (!val) return true;
			const urlPattern =
				/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
			return urlPattern.test(val);
		}, "Must be a valid URL (e.g. acme.com or https://acme.com)")
		.optional(),
	phone: z
		.string()
		.min(10, "Phone number must be at least 10 characters")
		.refine((val) => {
			if (!val) return false;
			return isValidPhoneNumber(val);
		}, "Phone number is required and must be valid"),
	country: z.string().min(1, "Country is required"),
	currency: z.string().min(1, "Currency is required"),
	hasGst: z.boolean().default(false),
	gstin: z.string().optional(),
	businessPan: z.string().optional(),
	useCases: z.array(z.string()),
	businessType: z.string().min(1, "Please select a business type"),
	addressStreet: z
		.string()
		.min(5, "Street address must be at least 5 characters"),
	addressState: z.string().min(1, "State is required"),
	addressCity: z.string().min(1, "City is required"),
	addressPincode: z
		.string()
		.regex(/^\d+$/, "Pincode must contain only numbers")
		.min(3, "Pincode is required"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [otpSent, setOtpSent] = useState(false);
	const [otpVerified, setOtpVerified] = useState(false);
	const [gstVerified, setGstVerified] = useState(false);
	const [mockLoading, setMockLoading] = useState(false);

	const { data: status, isLoading: statusLoading } =
		api.onboarding.getStatus.useQuery();

	const completeOnboarding = api.onboarding.completeOnboarding.useMutation({
		onSuccess: () => {
			toast.success("Onboarding complete! Welcome to DevCRM.");
			router.push("/dashboard");
		},
		onError: (err) => {
			toast.error(err.message || "Something went wrong during onboarding.");
		},
	});

	const form = useForm<OnboardingFormValues>({
		resolver: zodResolver(onboardingSchema) as any,
		mode: "onChange",
		defaultValues: {
			name: "",
			displayName: "",
			teamSize: "",
			website: "",
			phone: "",
			country: "",
			currency: "USD",
			hasGst: false,
			gstin: "",
			businessPan: "",
			useCases: [],
			businessType: "service",
			addressStreet: "",
			addressState: "",
			addressCity: "",
			addressPincode: "",
		},
	});

	const { watch, setValue, trigger } = form;
	const currentCountry = watch("country");
	const currentState = watch("addressState");
	const hasGst = watch("hasGst");
	const phoneVal = watch("phone");
	const gstinVal = watch("gstin");

	useEffect(() => {
		if (!statusLoading && status?.onboardingComplete) {
			router.push("/dashboard");
		}
	}, [status, statusLoading, router]);

	if (statusLoading || status?.onboardingComplete) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	const countries = Country.getAllCountries();
	const states = currentCountry ? State.getStatesOfCountry(currentCountry) : [];
	const cities = currentState
		? City.getCitiesOfState(currentCountry, currentState)
		: [];

	const handleNext = async () => {
		let fieldsToValidate: (keyof OnboardingFormValues)[] = [];
		if (step === 1) fieldsToValidate = ["name", "teamSize", "website", "phone"];
		if (step === 2)
			fieldsToValidate = ["country", "currency", "hasGst", "gstin"];

		const isStepValid = await trigger(fieldsToValidate);

		if (isStepValid) {
			if (step === 1 && !otpVerified) {
				form.setError("phone", {
					type: "manual",
					message: "Please verify your phone number to continue",
				});
				return;
			}

			if (step === 2 && hasGst && !gstVerified) {
				form.setError("gstin", {
					type: "manual",
					message: "Please verify your GST details to continue",
				});
				return;
			}

			setStep((s) => Math.min(s + 1, 3));
		}
	};

	const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

	const onSubmit = (data: OnboardingFormValues) => {
		const apiPayload = {
			...data,
			countryCode: data.phone ? data.phone.substring(0, 4) : "+1",
		};
		completeOnboarding.mutate(apiPayload);
	};

	const handleMockOtp = () => {
		if (!phoneVal) return;
		setOtpSent(true);
		setTimeout(() => {
			setOtpVerified(true);
		}, 1500);
	};

	const handleMockGst = () => {
		if (!gstinVal) return;
		setMockLoading(true);
		setTimeout(() => {
			setGstVerified(true);
			setMockLoading(false);
		}, 1500);
	};

	const toggleUseCase = (useCase: string) => {
		const current = watch("useCases");
		if (current.includes(useCase)) {
			setValue(
				"useCases",
				current.filter((u) => u !== useCase),
			);
		} else {
			setValue("useCases", [...current, useCase]);
		}
	};

	return (
		<div className="flex min-h-screen bg-background text-foreground">
			{/* Left side: branding & progress */}
			<div className="hidden flex-col justify-between border-r border-border bg-card p-10 lg:flex lg:w-1/3 shadow-sm">
				<div className="space-y-8">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-sm">
							D
						</div>
						<span className="font-bold text-2xl tracking-tight text-foreground">DevCRM</span>
					</div>

					<div className="space-y-3">
						<div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
							<Sparkles className="h-3.5 w-3.5" />
							<span>Quick Setup Wizard</span>
						</div>
						<h1 className="font-bold text-3xl text-foreground tracking-tight leading-tight">
							Set up your organization workspace
						</h1>
						<p className="text-muted-foreground text-sm leading-relaxed">
							Tell us about your company to customize financial ledgers, tax rules, and CRM automation settings for your team.
						</p>
					</div>

					<div className="space-y-4 pt-6 border-t border-border">
						<div className="flex items-center gap-3 text-sm">
							<div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
								1
							</div>
							<div>
								<p className="font-semibold text-foreground">Company Essentials</p>
								<p className="text-xs text-muted-foreground">Legal name, team scale & contact</p>
							</div>
						</div>
						<div className="flex items-center gap-3 text-sm">
							<div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
								2
							</div>
							<div>
								<p className="font-semibold text-foreground">Regional & Tax Identity</p>
								<p className="text-xs text-muted-foreground">Currency, GSTIN & tax verification</p>
							</div>
						</div>
						<div className="flex items-center gap-3 text-sm">
							<div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-xs ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
								3
							</div>
							<div>
								<p className="font-semibold text-foreground">Operating Address</p>
								<p className="text-xs text-muted-foreground">Registered headquarters & profile</p>
							</div>
						</div>
					</div>
				</div>

				<div className="text-xs text-muted-foreground">
					&copy; {new Date().getFullYear()} DevCRM Systems. All rights reserved.
				</div>
			</div>

			{/* Right side: step form */}
			<div className="flex h-screen flex-1 flex-col overflow-y-auto px-4 py-8 sm:px-8 lg:px-16 xl:px-24">
				<div className="mx-auto w-full max-w-2xl">
					{/* Mobile Header */}
					<div className="mb-6 lg:hidden space-y-1">
						<div className="flex items-center gap-2 mb-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
								D
							</div>
							<span className="font-bold text-xl text-foreground">DevCRM</span>
						</div>
						<h2 className="font-bold text-2xl text-foreground">
							Welcome to DevCRM
						</h2>
						<p className="text-xs sm:text-sm text-muted-foreground">
							Let&apos;s configure your workspace in three simple steps.
						</p>
					</div>

					{/* Stepper Bar */}
					<div className="mb-8 border-b border-border pb-6">
						<div className="flex w-full items-center justify-between">
							<div className="flex flex-1 flex-col items-center">
								<div
									className={`mb-1.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full font-semibold text-xs sm:text-sm ${
										step >= 1
											? "bg-primary text-primary-foreground shadow-xs"
											: "bg-muted text-muted-foreground"
									}`}
								>
									1
								</div>
								<span className="font-medium text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider">
									Profile
								</span>
							</div>

							<div
								className={`h-[2px] w-full max-w-[60px] sm:max-w-[100px] ${
									step >= 2 ? "bg-primary" : "bg-border"
								}`}
							/>

							<div className="flex flex-1 flex-col items-center">
								<div
									className={`mb-1.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full font-semibold text-xs sm:text-sm ${
										step >= 2
											? "bg-primary text-primary-foreground shadow-xs"
											: "bg-muted text-muted-foreground"
									}`}
								>
									2
								</div>
								<span className="font-medium text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider">
									Tax
								</span>
							</div>

							<div
								className={`h-[2px] w-full max-w-[60px] sm:max-w-[100px] ${
									step >= 3 ? "bg-primary" : "bg-border"
								}`}
							/>

							<div className="flex flex-1 flex-col items-center">
								<div
									className={`mb-1.5 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full font-semibold text-xs sm:text-sm ${
										step >= 3
											? "bg-primary text-primary-foreground shadow-xs"
											: "bg-muted text-muted-foreground"
									}`}
								>
									3
								</div>
								<span className="font-medium text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider">
									Address
								</span>
							</div>
						</div>
					</div>

					<Form {...form}>
						<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
							{/* STEP 1: BASIC DETAILS */}
							{step === 1 && (
								<div className="space-y-5">
									<div className="flex items-center gap-2 border-b border-border pb-3">
										<Building2 className="h-5 w-5 text-primary" />
										<h3 className="font-bold text-lg text-foreground tracking-tight">
											Basic Company Information
										</h3>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<FormField
											control={form.control as any}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">
														Legal Company Name <span className="text-destructive">*</span>
													</FormLabel>
													<FormControl>
														<Input
															className="min-h-[44px] bg-background border-border text-foreground"
															placeholder="Acme Corp LLC"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control as any}
											name="displayName"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Brand / Display Name</FormLabel>
													<FormControl>
														<Input
															className="min-h-[44px] bg-background border-border text-foreground"
															placeholder="Acme"
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
											control={form.control as any}
											name="teamSize"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">
														Team Size <span className="text-destructive">*</span>
													</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
																<SelectValue placeholder="Select team size" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="bg-popover text-popover-foreground border-border">
															<SelectItem value="1-10">
																1 - 10 employees
															</SelectItem>
															<SelectItem value="11-50">
																11 - 50 employees
															</SelectItem>
															<SelectItem value="51-200">
																51 - 200 employees
															</SelectItem>
															<SelectItem value="201+">
																201+ employees
															</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control as any}
											name="website"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">Company Website</FormLabel>
													<div className="relative">
														<Globe className="absolute top-3.5 left-3 h-4 w-4 text-muted-foreground" />
														<FormControl>
															<Input
																className="min-h-[44px] pl-9 bg-background border-border text-foreground"
																placeholder="https://acme.com"
																{...field}
															/>
														</FormControl>
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control as any}
										name="phone"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">
													Primary Phone Number <span className="text-destructive">*</span>
												</FormLabel>
												<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
													<div className="PhoneInputWrapper flex-1">
														<PhoneInput
															className="w-full min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-foreground"
															defaultCountry="IN"
															disabled={otpVerified}
															onChange={(v) => field.onChange(v || "")}
															value={field.value}
														/>
													</div>
													{!otpVerified ? (
														<Button
															disabled={!field.value || otpSent}
															onClick={handleMockOtp}
															type="button"
															variant="secondary"
															className="min-h-[44px] px-5 font-semibold shrink-0"
														>
															{otpSent ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																"Verify Phone"
															)}
														</Button>
													) : (
														<Button
															className="min-h-[44px] px-5 font-semibold shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
															disabled
															type="button"
														>
															<CheckCircle2 className="mr-2 h-4 w-4" /> Verified
														</Button>
													)}
												</div>
												{otpSent && !otpVerified && (
													<p className="text-primary text-xs">
														Mock: Sending verification OTP... Auto-verifying in 1.5s.
													</p>
												)}
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							{/* STEP 2: REGION & TAX */}
							{step === 2 && (
								<div className="space-y-5">
									<div className="flex items-center gap-2 border-b border-border pb-3">
										<FileText className="h-5 w-5 text-primary" />
										<h3 className="font-bold text-lg text-foreground tracking-tight">
											Regional Configuration & Tax Identity
										</h3>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<FormField
											control={form.control as any}
											name="country"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">
														Operating Country <span className="text-destructive">*</span>
													</FormLabel>
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
											control={form.control as any}
											name="currency"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">
														Billing Currency <span className="text-destructive">*</span>
													</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="min-h-[44px] bg-background border-border text-foreground">
																<SelectValue placeholder="Select Currency" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="bg-popover text-popover-foreground border-border">
															<SelectItem value="USD">USD ($) - US Dollar</SelectItem>
															<SelectItem value="EUR">EUR (€) - Euro</SelectItem>
															<SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
															<SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control as any}
										name="hasGst"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
												<div className="space-y-0.5">
													<FormLabel className="font-semibold text-foreground text-sm sm:text-base cursor-pointer">
														Do you have a registered GSTIN / Tax ID?
													</FormLabel>
													<p className="text-xs text-muted-foreground">
														Enable to attach tax credentials onto generated invoice headers.
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
										<div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
											<FormField
												control={form.control as any}
												name="gstin"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-foreground font-semibold">
															GSTIN Registration Number <span className="text-destructive">*</span>
														</FormLabel>
														<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
															<FormControl>
																<Input
																	className="min-h-[44px] bg-background border-border text-foreground uppercase font-mono"
																	placeholder="22AAAAA0000A1Z5"
																	{...field}
																	onChange={(e) =>
																		field.onChange(e.target.value.toUpperCase())
																	}
																/>
															</FormControl>
															<Button
																disabled={
																	!field.value || gstVerified || mockLoading
																}
																onClick={handleMockGst}
																type="button"
																variant="secondary"
																className="min-h-[44px] px-5 font-semibold shrink-0"
															>
																{mockLoading && !gstVerified ? (
																	<Loader2 className="h-4 w-4 animate-spin" />
																) : gstVerified ? (
																	"Verified"
																) : (
																	"Verify GST"
																)}
															</Button>
														</div>
														{gstVerified && (
															<p className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
																<CheckCircle2 className="h-3.5 w-3.5" /> GST Credentials Verified
															</p>
														)}
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control as any}
												name="businessPan"
												render={({ field }) => (
													<FormItem>
														<FormLabel className="text-foreground font-semibold">Business PAN Number</FormLabel>
														<FormControl>
															<Input
																className="min-h-[44px] bg-background border-border text-foreground uppercase font-mono"
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
								</div>
							)}

							{/* STEP 3: ADDRESS & PROFILE */}
							{step === 3 && (
								<div className="space-y-5">
									<div className="flex items-center gap-2 border-b border-border pb-3">
										<MapPin className="h-5 w-5 text-primary" />
										<h3 className="font-bold text-lg text-foreground tracking-tight">
											Registered Address & Business Profile
										</h3>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<FormField
											control={form.control as any}
											name="addressState"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">
														State / Province <span className="text-destructive">*</span>
													</FormLabel>
													<Select
														defaultValue={field.value}
														disabled={!currentCountry}
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
											control={form.control as any}
											name="addressCity"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">
														City / Town <span className="text-destructive">*</span>
													</FormLabel>
													<Select
														defaultValue={field.value}
														disabled={!currentState}
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
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<FormField
											control={form.control as any}
											name="addressPincode"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">
														Postal / Pincode <span className="text-destructive">*</span>
													</FormLabel>
													<FormControl>
														<Input
															className="min-h-[44px] bg-background border-border text-foreground"
															placeholder="e.g. 560001"
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
										<FormField
											control={form.control as any}
											name="addressStreet"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-foreground font-semibold">
														Street Address <span className="text-destructive">*</span>
													</FormLabel>
													<FormControl>
														<Input
															className="min-h-[44px] bg-background border-border text-foreground"
															placeholder="e.g. 100 Innovation Park, Floor 3"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control as any}
										name="useCases"
										render={() => (
											<FormItem className="border-t border-border pt-4">
												<FormLabel className="text-foreground font-semibold text-sm sm:text-base block mb-2">
													What will you use DevCRM for? (Select all that apply)
												</FormLabel>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
													{[
														"CRM & Pipeline Deals",
														"Invoicing & Billing",
														"Proposals & Client Quotes",
														"Automations & Webhooks",
													].map((usecase) => (
														<label
															className="flex items-center space-x-3 rounded-xl border border-border bg-muted/20 p-3.5 transition hover:bg-muted/40 cursor-pointer min-h-[44px]"
															key={usecase}
															htmlFor={`uc-${usecase}`}
														>
															<Checkbox
																checked={watch("useCases").includes(usecase)}
																id={`uc-${usecase}`}
																onCheckedChange={() => toggleUseCase(usecase)}
															/>
															<span className="text-xs sm:text-sm font-medium text-foreground">
																{usecase}
															</span>
														</label>
													))}
												</div>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control as any}
										name="businessType"
										render={({ field }) => (
											<FormItem className="border-t border-border pt-4">
												<FormLabel className="text-foreground font-semibold text-sm sm:text-base block mb-2">
													What best describes your business model?
												</FormLabel>
												<FormControl>
													<RadioGroup
														className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<Label
															className="flex cursor-pointer items-start space-x-3 rounded-xl border border-border bg-muted/20 p-3.5 transition hover:bg-muted/40 min-h-[56px]"
															htmlFor="t-service"
														>
															<RadioGroupItem id="t-service" value="service" className="mt-0.5" />
															<div>
																<p className="font-semibold text-sm text-foreground">
																	Service Provider / Agency
																</p>
																<p className="text-muted-foreground text-xs">
																	Consultancies, Agencies, Professional Services
																</p>
															</div>
														</Label>
														<Label
															className="flex cursor-pointer items-start space-x-3 rounded-xl border border-border bg-muted/20 p-3.5 transition hover:bg-muted/40 min-h-[56px]"
															htmlFor="t-product"
														>
															<RadioGroupItem id="t-product" value="product" className="mt-0.5" />
															<div>
																<p className="font-semibold text-sm text-foreground">
																	Product / SaaS / Retail
																</p>
																<p className="text-muted-foreground text-xs">
																	Software products, eCommerce, Inventory
																</p>
															</div>
														</Label>
													</RadioGroup>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							{/* Step Navigation Controls */}
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border pt-6">
								<Button
									disabled={step === 1 || completeOnboarding.isPending}
									onClick={handlePrev}
									type="button"
									variant="outline"
									className="min-h-[44px] px-6 gap-2 order-2 sm:order-1"
								>
									<ArrowLeft className="h-4 w-4" /> Back
								</Button>
								{step < 3 ? (
									<Button
										onClick={handleNext}
										type="button"
										className="min-h-[44px] px-8 gap-2 font-semibold order-1 sm:order-2 shadow-xs"
									>
										Continue <ArrowRight className="h-4 w-4" />
									</Button>
								) : (
									<Button
										className="min-h-[44px] px-8 gap-2 font-semibold order-1 sm:order-2 shadow-sm"
										disabled={completeOnboarding.isPending}
										type="submit"
									>
										{completeOnboarding.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Finalizing Setup...
											</>
										) : (
											<>
												<CheckCircle2 className="h-4 w-4" />
												Complete Onboarding
											</>
										)}
									</Button>
								)}
							</div>
						</form>
					</Form>
				</div>
			</div>
		</div>
	);
}
