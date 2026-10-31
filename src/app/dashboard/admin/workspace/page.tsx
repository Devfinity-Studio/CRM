"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
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
	FormDescription,
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
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";

const orgSchema = z.object({
	name: z
		.string()
		.min(2, { message: "Company name must be at least 2 characters." }),
	industry: z.string().optional(),
	currency: z.string().optional(),
	logoUrl: z.string().optional(),
});

type OrgFormValues = z.infer<typeof orgSchema>;

export default function SettingsOrganizationPage() {
	const {
		data: orgData,
		isLoading,
		error,
		refetch,
	} = api.settings.getOrganizationSettings.useQuery(undefined, {
		retry: false, // Don't retry if forbidden
	});

	const updateOrgMutation = api.settings.updateOrganization.useMutation({
		onSuccess: () => {
			toast.success("Organization updated successfully");
			refetch();
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
			<div className="flex justify-center p-8 text-muted-foreground">
				Loading organization...
			</div>
		);
	}

	// Handle unauthorized view
	if (error?.data?.code === "FORBIDDEN") {
		return (
			<div className="space-y-6">
				<div>
					<h3 className="font-medium text-lg">Organization Settings</h3>
					<p className="text-muted-foreground text-sm">
						Manage company profile
					</p>
				</div>
				<Separator />
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Access Denied</AlertTitle>
					<AlertDescription>
						You must be an OWNER or ADMIN to view and modify organization
						settings.
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
				<h3 className="font-medium text-lg">Organization</h3>
				<p className="text-muted-foreground text-sm">
					Manage your company profile and primary operational details.
				</p>
			</div>
			<Separator />

			<Card>
				<CardHeader>
					<CardTitle>Company Profile</CardTitle>
					<CardDescription>
						Update your tenant&apos;s primary information.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
							<div className="flex flex-col gap-6 sm:flex-row">
								<div className="flex-1 space-y-6">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Company Name</FormLabel>
												<FormControl>
													<Input placeholder="Acme Corp" {...field} />
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
												<FormLabel>Industry</FormLabel>
												<FormControl>
													<Input
														placeholder="Software, Retail, etc."
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
												<FormLabel>Default Currency</FormLabel>
												<Select
													defaultValue={field.value}
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select a currency" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
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

								<div className="sm:w-1/3">
									<FormLabel className="mb-2 block">Company Logo</FormLabel>
									<FileUploadDropzone
										folder="logos"
										onUploadSuccess={handleLogoUpload}
									/>
									{form.watch("logoUrl") && (
										<div className="mt-4">
											<p className="mb-2 text-muted-foreground text-xs">
												Current Logo:
											</p>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												alt="Company Logo"
												className="max-h-[150px] max-w-[150px] rounded-md border bg-white object-contain p-2"
												src={form.watch("logoUrl")}
											/>
										</div>
									)}
								</div>
							</div>

							<div className="flex justify-end">
								<Button
									disabled={
										updateOrgMutation.isPending || !form.formState.isDirty
									}
									type="submit"
								>
									{updateOrgMutation.isPending
										? "Saving..."
										: "Save Organization"}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
