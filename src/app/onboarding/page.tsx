"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { City, Country, State } from "country-state-city";
import {
	Building2,
	CheckCircle2,
	FileText,
	Globe,
	Loader2,
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
			<div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
				<Loader2 className="h-8 w-8 animate-spin" />
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
			// Custom validation for Mock Verification steps
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
		// Need to provide countryCode for the API, we can derive or set empty
		const apiPayload = {
			...data,
			countryCode: data.phone ? data.phone.substring(0, 4) : "+1", // Simplified for API payload compatibility
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
		<div className="flex min-h-screen bg-slate-950 text-white">
			{/* Left side: branding/info */}
			<div className="hidden flex-col justify-between border-slate-800 border-r bg-slate-900 p-12 lg:flex lg:w-1/3">
				<div>
					<div className="mb-12 flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
							<span className="font-bold text-white">D</span>
						</div>
						<span className="font-bold text-xl">DevCRM</span>
					</div>
					<h1 className="mb-4 font-bold text-3xl">Set up your workspace</h1>
					<p className="text-lg text-slate-400">
						Tell us a bit about your company to get the most out of your CRM.
						This information helps us tailor your experience.
					</p>
				</div>
				<div className="text-slate-500 text-sm">
					&copy; {new Date().getFullYear()} DevCRM. All rights reserved.
				</div>
			</div>

			{/* Right side: form */}
			<div className="flex h-screen flex-1 flex-col overflow-y-auto px-6 py-12 sm:px-12 lg:px-24 xl:px-32">
				<div className="mx-auto w-full max-w-3xl">
					<div className="mb-8 lg:hidden">
						<h2 className="mb-2 font-bold text-3xl text-white">
							Welcome to DevCRM
						</h2>
						<p className="text-slate-400">
							Let's set up your workspace. This will only take a minute.
						</p>
					</div>

					<div className="mb-12 flex items-center justify-between border-slate-800 border-b pb-6">
						<div className="flex w-full items-center space-x-2">
							<div
								className={`flex flex-1 flex-col items-center ${step >= 1 ? "text-blue-500" : "text-slate-500"}`}
							>
								<div
									className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${step >= 1 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}
								>
									1
								</div>
								<span className="font-medium text-xs uppercase tracking-wider">
									Basic
								</span>
							</div>
							<div
								className={`h-[2px] w-full max-w-[50px] ${step >= 2 ? "bg-blue-600" : "bg-slate-800"}`}
							/>
							<div
								className={`flex flex-1 flex-col items-center ${step >= 2 ? "text-blue-500" : "text-slate-500"}`}
							>
								<div
									className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${step >= 2 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}
								>
									2
								</div>
								<span className="font-medium text-xs uppercase tracking-wider">
									Region
								</span>
							</div>
							<div
								className={`h-[2px] w-full max-w-[50px] ${step >= 3 ? "bg-blue-600" : "bg-slate-800"}`}
							/>
							<div
								className={`flex flex-1 flex-col items-center ${step >= 3 ? "text-blue-500" : "text-slate-500"}`}
							>
								<div
									className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${step >= 3 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}
								>
									3
								</div>
								<span className="font-medium text-xs uppercase tracking-wider">
									Address
								</span>
							</div>
						</div>
					</div>

					<Form {...form}>
						<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
							{step === 1 && (
								<div className="fade-in slide-in-from-bottom-4 animate-in space-y-4">
									<h3 className="flex items-center gap-2 border-slate-800 border-b pb-2 font-semibold text-lg">
										<Building2 className="h-5 w-5" /> Basic Details
									</h3>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control as any}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Legal Company Name *</FormLabel>
													<FormControl>
														<Input
															className="border-slate-800 bg-slate-950"
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
													<FormLabel>Brand / Display Name</FormLabel>
													<FormControl>
														<Input
															className="border-slate-800 bg-slate-950"
															placeholder="Acme"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control as any}
											name="teamSize"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Team Size *</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="border-slate-800 bg-slate-950">
																<SelectValue placeholder="Select team size" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="border-slate-800 bg-slate-900 text-white">
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
													<FormLabel>Website</FormLabel>
													<div className="relative">
														<Globe className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
														<FormControl>
															<Input
																className="border-slate-800 bg-slate-950 pl-9"
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
												<FormLabel>Phone Number *</FormLabel>
												<div className="flex items-center gap-2">
													<div className="PhoneInputWrapper flex-1">
														{/* 
                          We use a wrapper class to target PhoneInput styles cleanly
                          react-phone-number-input renders an input and a flag select automatically 
                        */}
														<PhoneInput
															className="w-full border-slate-800 bg-slate-950"
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
														>
															{otpSent ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																"Verify"
															)}
														</Button>
													) : (
														<Button
															className="bg-emerald-600 hover:bg-emerald-700"
															disabled
															type="button"
															variant="default"
														>
															<CheckCircle2 className="mr-2 h-4 w-4" /> Verified
														</Button>
													)}
												</div>
												{otpSent && !otpVerified && (
													<p className="text-blue-400 text-xs">
														Mock: Sending OTP... Auto-verifying in 1.5s.
													</p>
												)}
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							{step === 2 && (
								<div className="fade-in slide-in-from-right-4 animate-in space-y-4">
									<h3 className="flex items-center gap-2 border-slate-800 border-b pb-2 font-semibold text-lg">
										<FileText className="h-5 w-5" /> Region & Tax
									</h3>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control as any}
											name="country"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Country *</FormLabel>
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
											control={form.control as any}
											name="currency"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Currency *</FormLabel>
													<Select
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="border-slate-800 bg-slate-950">
																<SelectValue placeholder="Select Currency" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="border-slate-800 bg-slate-900 text-white">
															<SelectItem value="USD">USD ($)</SelectItem>
															<SelectItem value="EUR">EUR (€)</SelectItem>
															<SelectItem value="GBP">GBP (£)</SelectItem>
															<SelectItem value="INR">INR (₹)</SelectItem>
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
											<FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">
												<div className="space-y-0.5">
													<FormLabel className="font-semibold text-base">
														Do you have a GST Number?
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
										<div className="fade-in zoom-in-95 animate-in space-y-4 rounded-lg border border-blue-900/30 bg-blue-950/20 p-4">
											<FormField
												control={form.control as any}
												name="gstin"
												render={({ field }) => (
													<FormItem>
														<FormLabel>GSTIN Number *</FormLabel>
														<div className="flex gap-2">
															<FormControl>
																<Input
																	className="border-slate-800 bg-slate-950 uppercase"
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
															>
																{mockLoading && !gstVerified ? (
																	<Loader2 className="h-4 w-4 animate-spin" />
																) : gstVerified ? (
																	"Verified"
																) : (
																	"Check GST"
																)}
															</Button>
														</div>
														{gstVerified && (
															<p className="flex items-center gap-1 text-emerald-400 text-xs">
																<CheckCircle2 className="h-3 w-3" /> GST Details
																Verified
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
														<FormLabel>Business PAN</FormLabel>
														<FormControl>
															<Input
																className="border-slate-800 bg-slate-950 uppercase"
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

							{step === 3 && (
								<div className="fade-in slide-in-from-right-4 animate-in space-y-4">
									<h3 className="border-slate-800 border-b pb-2 font-semibold text-lg">
										Address & Business Profile
									</h3>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control as any}
											name="addressState"
											render={({ field }) => (
												<FormItem>
													<FormLabel>State / Province *</FormLabel>
													<Select
														defaultValue={field.value}
														disabled={!currentCountry}
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
													<FormLabel>City / Town *</FormLabel>
													<Select
														defaultValue={field.value}
														disabled={!currentState}
														onValueChange={field.onChange}
													>
														<FormControl>
															<SelectTrigger className="border-slate-800 bg-slate-950">
																<SelectValue placeholder="Select City" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="max-h-[200px] border-slate-800 bg-slate-900 text-white">
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

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control as any}
											name="addressPincode"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Pincode / Zip *</FormLabel>
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
										<FormField
											control={form.control as any}
											name="addressStreet"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Street Address *</FormLabel>
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

									<FormField
										control={form.control as any}
										name="useCases"
										render={() => (
											<FormItem>
												<div className="mb-4">
													<FormLabel className="text-base">
														What will you use this for? (Select all that apply)
													</FormLabel>
												</div>
												<div className="grid grid-cols-2 gap-2">
													{[
														"CRM / Contacts",
														"Invoicing",
														"Proposals / Quotes",
														"Project Management",
													].map((usecase) => (
														<div
															className="flex items-center space-x-2 rounded-md border border-slate-800 bg-slate-950 p-2"
															key={usecase}
														>
															<Checkbox
																checked={watch("useCases").includes(usecase)}
																id={`uc-${usecase}`}
																onCheckedChange={() => toggleUseCase(usecase)}
															/>
															<Label
																className="cursor-pointer text-sm"
																htmlFor={`uc-${usecase}`}
															>
																{usecase}
															</Label>
														</div>
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
											<FormItem>
												<FormLabel className="text-base">
													What best describes your business?
												</FormLabel>
												<FormControl>
													<RadioGroup
														className="grid grid-cols-1 gap-2"
														defaultValue={field.value}
														onValueChange={field.onChange}
													>
														<Label
															className="flex cursor-pointer items-center space-x-3 rounded-lg border border-slate-800 bg-slate-950 p-3 transition hover:bg-slate-900"
															htmlFor="t-service"
														>
															<RadioGroupItem id="t-service" value="service" />
															<div>
																<p className="font-medium text-white">
																	Service Provider
																</p>
																<p className="text-slate-400 text-xs">
																	Agencies, Consultants, Freelancers
																</p>
															</div>
														</Label>
														<Label
															className="flex cursor-pointer items-center space-x-3 rounded-lg border border-slate-800 bg-slate-950 p-3 transition hover:bg-slate-900"
															htmlFor="t-product"
														>
															<RadioGroupItem id="t-product" value="product" />
															<div>
																<p className="font-medium text-white">
																	Product / SaaS
																</p>
																<p className="text-slate-400 text-xs">
																	Software, physical products, e-commerce
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

							<div className="flex justify-between border-slate-800 border-t pt-6">
								<Button
									disabled={step === 1 || completeOnboarding.isPending}
									onClick={handlePrev}
									type="button"
									variant="outline"
								>
									Back
								</Button>
								{step < 3 ? (
									<Button onClick={handleNext} type="button">
										Continue
									</Button>
								) : (
									<Button
										className="bg-blue-600 hover:bg-blue-700"
										disabled={completeOnboarding.isPending}
										type="submit"
									>
										{completeOnboarding.isPending && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Complete Onboarding
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
