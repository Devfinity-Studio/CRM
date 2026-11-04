"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Building2, Loader2, Save } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { FileUploadDropzone } from "~/components/ui/file-upload-dropzone";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

const orgSchema = z.object({
	name: z
		.string()
		.min(2, { message: "Company name must be at least 2 characters." }),
	industry: z.string().optional(),
	currency: z.string().optional(),
	logoUrl: z.string().optional(),
});

export type OrgFormValues = z.infer<typeof orgSchema>;

export function OrganizationProfileForm() {
	const utils = api.useUtils();
	const {
		data: orgData,
		isLoading,
		error,
		refetch,
	} = api.settings.getOrganizationSettings.useQuery(undefined, {
		retry: false,
	});

	const updateOrgMutation = api.settings.updateOrganization.useMutation({
		onSuccess: () => {
			toast.success("Organization settings updated successfully");
			refetch();
			// Also invalidate dashboard layout data so activeOrganization currency updates across the app
			utils.dashboard.getLayoutData.invalidate();
		},
		onError: (err) => {
			toast.error(`Error updating organization: ${err.message}`);
		},
	});

	const form = useForm<OrgFormValues>({
		resolver: zodResolver(orgSchema),
		defaultValues: {
			name: "",
			industry: "",
			currency: "USD",
			logoUrl: "",
		},
		values: orgData?.organization
			? {
					name: orgData.organization.name ?? "",
					industry: orgData.organization.industry ?? "",
					currency: orgData.organization.currency ?? "USD",
					logoUrl: orgData.organization.logoUrl ?? "",
				}
			: undefined,
	});

	if (isLoading) {
		return (
			<div className="flex h-[40vh] items-center justify-center">
				<Loader2 className="text-primary h-8 w-8 animate-spin" />
			</div>
		);
	}

	// Handle unauthorized view
	if (error?.data?.code === "FORBIDDEN") {
		return (
			<div className="space-y-6">
				<div>
					<h3 className="text-foreground text-lg font-bold">
						Workspace Settings
					</h3>
					<p className="text-muted-foreground text-sm">
						Manage company profile and business entity details.
					</p>
				</div>
				<Alert className="rounded-xl" variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Access Denied</AlertTitle>
					<AlertDescription>
						You must have OWNER or ADMIN privileges in this organization to view
						and modify workspace settings.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	const onSubmit = (data: OrgFormValues) => {
		updateOrgMutation.mutate(data);
	};

	const handleLogoUpload = (url: string) => {
		form.setValue("logoUrl", url, { shouldDirty: true });
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-foreground text-xl font-bold tracking-tight">
					Workspace Profile
				</h3>
				<p className="text-muted-foreground text-sm">
					Configure your tenant&apos;s corporate brand identity, billing
					currency, and display settings.
				</p>
			</div>

			<Card className="border-border bg-card rounded-2xl border shadow-sm">
				<CardHeader className="border-border/60 border-b pb-4">
					<div className="flex items-center gap-2">
						<Building2 className="text-primary h-4 w-4" />
						<CardTitle className="text-foreground text-base font-bold sm:text-lg">
							Organization Profile
						</CardTitle>
					</div>
					<CardDescription className="text-muted-foreground text-xs">
						These settings apply across all invoices, quotes, and client portal
						links for this workspace.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-4 pt-6 sm:p-6">
					<Form {...form}>
						<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
							<div className="flex flex-col gap-6 md:flex-row">
								<div className="flex-1 space-y-5">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">
													Company Legal Name{" "}
													<span className="text-destructive">*</span>
												</FormLabel>
												<FormControl>
													<Input
														className="border-border bg-background text-foreground min-h-[44px]"
														placeholder="Acme Corporation"
														{...field}
													/>
												</FormControl>
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
													Primary Industry
												</FormLabel>
												<FormControl>
													<Input
														className="border-border bg-background text-foreground min-h-[44px]"
														placeholder="e.g. Enterprise SaaS, Biotech, Logistics"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="currency"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-foreground font-semibold">
													Default Operating Currency
												</FormLabel>
												<Select
													defaultValue={field.value}
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger className="border-border bg-background text-foreground min-h-[44px]">
															<SelectValue placeholder="Select a currency" />
														</SelectTrigger>
													</FormControl>
													<SelectContent className="border-border bg-popover text-popover-foreground">
														<SelectItem value="USD">
															USD ($) - US Dollar
														</SelectItem>
														<SelectItem value="EUR">EUR (€) - Euro</SelectItem>
														<SelectItem value="GBP">
															GBP (£) - British Pound
														</SelectItem>
														<SelectItem value="INR">
															INR (₹) - Indian Rupee
														</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="w-full space-y-3 md:w-5/12">
									<FormLabel className="text-foreground block font-semibold">
										Company Brand Mark
									</FormLabel>
									<div className="border-border bg-muted/20 space-y-3 rounded-xl border p-4">
										<FileUploadDropzone
											folder="logos"
											onUploadSuccess={handleLogoUpload}
										/>
										{form.watch("logoUrl") ? (
											<div className="space-y-1.5 pt-2">
												<p className="text-muted-foreground text-xs font-medium">
													Active Logo Preview:
												</p>
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													alt="Company Logo Preview"
													className="border-border bg-background max-h-[120px] max-w-full rounded-xl border object-contain p-3 shadow-xs"
													src={form.watch("logoUrl")}
												/>
											</div>
										) : (
											<div className="space-y-1.5 pt-2">
												<p className="text-muted-foreground text-xs font-medium">
													Default Brand Mark:
												</p>
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													alt="Default Brand Mark"
													className="border-border bg-background max-h-[80px] max-w-full rounded-xl border object-contain p-2 shadow-xs"
													src="/devfinity.png"
												/>
												<p className="text-muted-foreground text-xs">
													PNG, SVG or WEBP up to 2MB recommended.
												</p>
											</div>
										)}
									</div>
								</div>
							</div>

							<div className="border-border flex justify-end border-t pt-4">
								<Button
									className="min-h-[44px] gap-2 px-6 font-semibold shadow-xs"
									disabled={
										updateOrgMutation.isPending || !form.formState.isDirty
									}
									type="submit"
								>
									{updateOrgMutation.isPending ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin" />
											Saving Changes...
										</>
									) : (
										<>
											<Save className="h-4 w-4" />
											Save Organization
										</>
									)}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
