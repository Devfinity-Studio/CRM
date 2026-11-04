"use client";

import { City, Country, State } from "country-state-city";
import {
	Building2,
	CheckCircle2,
	FileText,
	Globe,
	Loader2,
	Phone,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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

export function OnboardingWizard() {
	const [step, setStep] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const [otpVerified, setOtpVerified] = useState(false);
	const [gstVerified, setGstVerified] = useState(false);

	const completeOnboarding = api.onboarding.completeOnboarding.useMutation({
		onSuccess: () => {
			window.location.reload();
		},
	});

	const [formData, setFormData] = useState({
		name: "",
		displayName: "",
		teamSize: "",
		website: "",
		phone: "",
		countryCode: "+1",
		country: "",
		currency: "USD",
		hasGst: false,
		gstin: "",
		businessPan: "",
		useCases: [] as string[],
		businessType: "service",
		addressStreet: "",
		addressState: "",
		addressCity: "",
		addressPincode: "",
	});

	const handleNext = () => setStep((s) => Math.min(s + 1, 3));
	const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		completeOnboarding.mutate(formData, {
			onError: () => setIsLoading(false),
		});
	};

	const handleMockOtp = () => {
		if (!formData.phone) return;
		setOtpSent(true);
		setTimeout(() => {
			setOtpVerified(true);
		}, 1500);
	};

	const handleMockGst = () => {
		if (!formData.gstin) return;
		setIsLoading(true);
		setTimeout(() => {
			setGstVerified(true);
			setIsLoading(false);
		}, 1500);
	};

	const toggleUseCase = (useCase: string) => {
		setFormData((prev) => ({
			...prev,
			useCases: prev.useCases.includes(useCase)
				? prev.useCases.filter((u) => u !== useCase)
				: [...prev.useCases, useCase],
		}));
	};

	const countries = Country.getAllCountries();
	const states = formData.country
		? State.getStatesOfCountry(formData.country)
		: [];
	const cities = formData.addressState
		? City.getCitiesOfState(formData.country, formData.addressState)
		: [];

	return (
		<Dialog onOpenChange={() => {}} open={true}>
			{/* closeable={false} essentially, by overriding onOpenChange */}
			<DialogContent
				className="max-h-[90vh] overflow-y-auto border-slate-800 bg-slate-900 text-white sm:max-w-[700px]"
				onEscapeKeyDown={(e) => e.preventDefault()}
				onPointerDownOutside={(e) => e.preventDefault()}
			>
				<DialogHeader className="flex flex-col items-center">
					<div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-800 p-1.5 shadow-sm">
						<Image
							alt="DevCRM"
							className="h-full w-full object-contain"
							height={36}
							priority
							src="/devfinity.png"
							width={36}
						/>
					</div>
					<DialogTitle className="mb-1 text-center text-2xl font-bold">
						Welcome to DevCRM
					</DialogTitle>
					<DialogDescription className="text-center text-slate-400">
						Let's set up your workspace. This will only take a minute.
					</DialogDescription>
				</DialogHeader>

				<div className="mt-4 mb-8 flex justify-center">
					<div className="flex items-center space-x-4">
						<div
							className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}
						>
							1
						</div>
						<div
							className={`h-1 w-16 ${step >= 2 ? "bg-blue-600" : "bg-slate-800"}`}
						/>
						<div
							className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}
						>
							2
						</div>
						<div
							className={`h-1 w-16 ${step >= 3 ? "bg-blue-600" : "bg-slate-800"}`}
						/>
						<div
							className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 3 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}
						>
							3
						</div>
					</div>
				</div>

				<form
					className="space-y-6"
					onSubmit={
						step === 3
							? handleSubmit
							: (e) => {
									e.preventDefault();
									handleNext();
								}
					}
				>
					{step === 1 && (
						<div className="fade-in slide-in-from-bottom-4 animate-in space-y-4">
							<h3 className="flex items-center gap-2 border-b border-slate-800 pb-2 text-lg font-semibold">
								<Building2 className="h-5 w-5" /> Basic Details
							</h3>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">Legal Company Name *</Label>
									<Input
										className="border-slate-800 bg-slate-950"
										id="name"
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										placeholder="Acme Corp LLC"
										required
										value={formData.name}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="displayName">Brand / Display Name</Label>
									<Input
										className="border-slate-800 bg-slate-950"
										id="displayName"
										onChange={(e) =>
											setFormData({ ...formData, displayName: e.target.value })
										}
										placeholder="Acme"
										value={formData.displayName}
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Team Size *</Label>
									<Select
										onValueChange={(v) =>
											setFormData({ ...formData, teamSize: v })
										}
										required
										value={formData.teamSize}
									>
										<SelectTrigger className="border-slate-800 bg-slate-950">
											<SelectValue placeholder="Select team size" />
										</SelectTrigger>
										<SelectContent className="border-slate-800 bg-slate-900 text-white">
											<SelectItem value="1-10">1 - 10 employees</SelectItem>
											<SelectItem value="11-50">11 - 50 employees</SelectItem>
											<SelectItem value="51-200">51 - 200 employees</SelectItem>
											<SelectItem value="201+">201+ employees</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="website">Website</Label>
									<div className="relative">
										<Globe className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
										<Input
											className="border-slate-800 bg-slate-950 pl-9"
											id="website"
											onChange={(e) =>
												setFormData({ ...formData, website: e.target.value })
											}
											placeholder="https://acme.com"
											value={formData.website}
										/>
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Phone Number *</Label>
								<div className="flex gap-2">
									<Select
										onValueChange={(v) =>
											setFormData({ ...formData, countryCode: v })
										}
										value={formData.countryCode}
									>
										<SelectTrigger className="w-[120px] border-slate-800 bg-slate-950">
											<SelectValue placeholder="Code" />
										</SelectTrigger>
										<SelectContent className="h-[200px] border-slate-800 bg-slate-900 text-white">
											{countries.slice(0, 20).map((c) => (
												<SelectItem key={c.isoCode} value={`+${c.phonecode}`}>
													{c.isoCode} (+{c.phonecode})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<div className="relative flex-1">
										<Phone className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
										<Input
											className="border-slate-800 bg-slate-950 pl-9"
											disabled={otpVerified}
											onChange={(e) =>
												setFormData({ ...formData, phone: e.target.value })
											}
											placeholder="Enter phone number"
											required
											value={formData.phone}
										/>
									</div>
									{!otpVerified ? (
										<Button
											disabled={!formData.phone || otpSent}
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
									<p className="text-xs text-blue-400">
										Mock: Sending OTP... Auto-verifying in 1.5s.
									</p>
								)}
							</div>
						</div>
					)}

					{step === 2 && (
						<div className="fade-in slide-in-from-right-4 animate-in space-y-4">
							<h3 className="flex items-center gap-2 border-b border-slate-800 pb-2 text-lg font-semibold">
								<FileText className="h-5 w-5" /> Region & Tax
							</h3>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Country *</Label>
									<Select
										onValueChange={(v) =>
											setFormData({
												...formData,
												country: v,
												addressState: "",
												addressCity: "",
											})
										}
										required
										value={formData.country}
									>
										<SelectTrigger className="border-slate-800 bg-slate-950">
											<SelectValue placeholder="Select Country" />
										</SelectTrigger>
										<SelectContent className="max-h-[300px] border-slate-800 bg-slate-900 text-white">
											{countries.map((c) => (
												<SelectItem key={c.isoCode} value={c.isoCode}>
													{c.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Currency *</Label>
									<Select
										onValueChange={(v) =>
											setFormData({ ...formData, currency: v })
										}
										required
										value={formData.currency}
									>
										<SelectTrigger className="border-slate-800 bg-slate-950">
											<SelectValue placeholder="Select Currency" />
										</SelectTrigger>
										<SelectContent className="border-slate-800 bg-slate-900 text-white">
											<SelectItem value="USD">USD ($)</SelectItem>
											<SelectItem value="EUR">EUR (€)</SelectItem>
											<SelectItem value="GBP">GBP (£)</SelectItem>
											<SelectItem value="INR">INR (₹)</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-slate-950 p-4">
								<Switch
									checked={formData.hasGst}
									id="has-gst"
									onCheckedChange={(c) =>
										setFormData({ ...formData, hasGst: c })
									}
								/>
								<Label
									className="cursor-pointer font-semibold"
									htmlFor="has-gst"
								>
									Do you have a GST Number?
								</Label>
							</div>

							{formData.hasGst && (
								<div className="fade-in zoom-in-95 animate-in space-y-4 rounded-lg border border-blue-900/30 bg-blue-950/20 p-4">
									<div className="space-y-2">
										<Label htmlFor="gstin">GSTIN Number *</Label>
										<div className="flex gap-2">
											<Input
												className="border-slate-800 bg-slate-950 uppercase"
												id="gstin"
												onChange={(e) =>
													setFormData({
														...formData,
														gstin: e.target.value.toUpperCase(),
													})
												}
												placeholder="22AAAAA0000A1Z5"
												required={formData.hasGst}
												value={formData.gstin}
											/>
											<Button
												disabled={!formData.gstin || gstVerified || isLoading}
												onClick={handleMockGst}
												type="button"
												variant="secondary"
											>
												{isLoading && !gstVerified ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : gstVerified ? (
													"Verified"
												) : (
													"Check GST"
												)}
											</Button>
										</div>
										{gstVerified && (
											<p className="flex items-center gap-1 text-xs text-emerald-400">
												<CheckCircle2 className="h-3 w-3" /> GST Details
												Verified
											</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="pan">Business PAN</Label>
										<Input
											className="border-slate-800 bg-slate-950 uppercase"
											id="pan"
											onChange={(e) =>
												setFormData({
													...formData,
													businessPan: e.target.value.toUpperCase(),
												})
											}
											placeholder="AAAAA0000A"
											value={formData.businessPan}
										/>
									</div>
								</div>
							)}
						</div>
					)}

					{step === 3 && (
						<div className="fade-in slide-in-from-right-4 animate-in space-y-4">
							<h3 className="border-b border-slate-800 pb-2 text-lg font-semibold">
								Address & Business Profile
							</h3>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>State / Province *</Label>
									<Select
										disabled={!formData.country}
										onValueChange={(v) =>
											setFormData({
												...formData,
												addressState: v,
												addressCity: "",
											})
										}
										required
										value={formData.addressState}
									>
										<SelectTrigger className="border-slate-800 bg-slate-950">
											<SelectValue placeholder="Select State" />
										</SelectTrigger>
										<SelectContent className="max-h-[200px] border-slate-800 bg-slate-900 text-white">
											{states.map((s) => (
												<SelectItem key={s.isoCode} value={s.isoCode}>
													{s.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>City / Town *</Label>
									<Select
										disabled={!formData.addressState}
										onValueChange={(v) =>
											setFormData({ ...formData, addressCity: v })
										}
										required
										value={formData.addressCity}
									>
										<SelectTrigger className="border-slate-800 bg-slate-950">
											<SelectValue placeholder="Select City" />
										</SelectTrigger>
										<SelectContent className="max-h-[200px] border-slate-800 bg-slate-900 text-white">
											{cities.map((c) => (
												<SelectItem key={c.name} value={c.name}>
													{c.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="pincode">Pincode / Zip *</Label>
									<Input
										className="border-slate-800 bg-slate-950"
										id="pincode"
										onChange={(e) =>
											setFormData({
												...formData,
												addressPincode: e.target.value,
											})
										}
										required
										value={formData.addressPincode}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="street">Street Address *</Label>
									<Input
										className="border-slate-800 bg-slate-950"
										id="street"
										onChange={(e) =>
											setFormData({
												...formData,
												addressStreet: e.target.value,
											})
										}
										required
										value={formData.addressStreet}
									/>
								</div>
							</div>

							<div className="space-y-3 pt-2">
								<Label>
									What will you use this for? (Select all that apply)
								</Label>
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
												checked={formData.useCases.includes(usecase)}
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
							</div>

							<div className="space-y-3 pt-2">
								<Label>What best describes your business?</Label>
								<RadioGroup
									onValueChange={(v) =>
										setFormData({ ...formData, businessType: v })
									}
									value={formData.businessType}
								>
									<div className="grid grid-cols-1 gap-2">
										<Label
											className="flex cursor-pointer items-center space-x-3 rounded-lg border border-slate-800 bg-slate-950 p-3 transition hover:bg-slate-900"
											htmlFor="t-service"
										>
											<RadioGroupItem id="t-service" value="service" />
											<div>
												<p className="font-medium text-white">
													Service Provider
												</p>
												<p className="text-xs text-slate-400">
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
												<p className="font-medium text-white">Product / SaaS</p>
												<p className="text-xs text-slate-400">
													Software, physical products, e-commerce
												</p>
											</div>
										</Label>
									</div>
								</RadioGroup>
							</div>
						</div>
					)}

					<div className="flex justify-between border-t border-slate-800 pt-4">
						<Button
							disabled={step === 1 || isLoading}
							onClick={handlePrev}
							type="button"
							variant="outline"
						>
							Back
						</Button>
						{step < 3 ? (
							<Button type="submit">Continue</Button>
						) : (
							<Button
								className="bg-blue-600 hover:bg-blue-700"
								disabled={isLoading || completeOnboarding.isPending}
								type="submit"
							>
								{(isLoading || completeOnboarding.isPending) && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Complete Onboarding
							</Button>
						)}
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
