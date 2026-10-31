"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import React, { useState } from "react";
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
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";

const brandingSchema = z.object({
	quotePattern: z.string().min(1, { message: "Quote pattern is required." }),
	invoicePattern: z
		.string()
		.min(1, { message: "Invoice pattern is required." }),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

export default function SettingsBrandingPage() {
	const {
		data: orgData,
		isLoading,
		error,
		refetch,
	} = api.settings.getOrganizationSettings.useQuery(undefined, {
		retry: false,
	});

	const updateBrandingMutation =
		api.settings.updateBrandingPatterns.useMutation({
			onSuccess: () => {
				toast.success("Document patterns updated successfully");
				refetch();
			},
			onError: (err) => {
				toast.error(`Error updating patterns: ${err.message}`);
			},
		});

	const form = useForm<BrandingFormValues>({
		resolver: zodResolver(brandingSchema),
		defaultValues: {
			quotePattern: "QT-{YYYY}-{SEQ}",
			invoicePattern: "INV-{YYYY}-{SEQ}",
		},
		values: orgData?.customLabels
			? {
					// @ts-expect-error - JSONB dynamic typing
					quotePattern: orgData.customLabels.quotePattern ?? "QT-{YYYY}-{SEQ}",
					// @ts-expect-error
					invoicePattern:
						orgData.customLabels.invoicePattern ?? "INV-{YYYY}-{SEQ}",
				}
			: undefined,
	});

	if (isLoading) {
		return (
			<div className="flex justify-center p-8 text-muted-foreground">
				Loading branding settings...
			</div>
		);
	}

	// Handle unauthorized view
	if (error?.data?.code === "FORBIDDEN") {
		return (
			<div className="space-y-6">
				<div>
					<h3 className="font-medium text-lg">Branding Settings</h3>
					<p className="text-muted-foreground text-sm">
						Manage document numbering
					</p>
				</div>
				<Separator />
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Access Denied</AlertTitle>
					<AlertDescription>
						You must be an OWNER or ADMIN to view and modify branding settings.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	const onSubmit = (data: BrandingFormValues) => {
		updateBrandingMutation.mutate(data);
	};

	const previewPattern = (pattern: string) => {
		const year = new Date().getFullYear().toString();
		const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
		return pattern
			.replace(/{YYYY}/g, year)
			.replace(/{YY}/g, year.slice(-2))
			.replace(/{MM}/g, month)
			.replace(/{SEQ}/g, "001");
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-medium text-lg">Branding</h3>
				<p className="text-muted-foreground text-sm">
					Configure how quotes and invoices are generated and numbered.
				</p>
			</div>
			<Separator />

			<Card>
				<CardHeader>
					<CardTitle>Document Numbering Patterns</CardTitle>
					<CardDescription>
						Define the template used to auto-generate Quote and Invoice numbers.
						<br className="mb-2" />
						<strong className="text-foreground">Available Variables:</strong>
						<ul className="mt-2 list-inside list-disc rounded-md bg-muted p-2 font-mono text-xs">
							<li>{`{YYYY}`} - Current 4-digit Year (e.g. 2026)</li>
							<li>{`{YY}`} - Current 2-digit Year (e.g. 26)</li>
							<li>{`{MM}`} - Current 2-digit Month (e.g. 07)</li>
							<li>
								{`{SEQ}`} - Auto-incrementing Sequence (padded to 3 digits)
							</li>
						</ul>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
							<div className="space-y-4">
								<FormField
									control={form.control}
									name="quotePattern"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Quote Pattern</FormLabel>
											<FormControl>
												<Input placeholder="QT-{YYYY}-{SEQ}" {...field} />
											</FormControl>
											<FormDescription>
												Preview:{" "}
												<span className="ml-1 font-bold font-mono text-primary">
													{previewPattern(field.value)}
												</span>
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="invoicePattern"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Invoice Pattern</FormLabel>
											<FormControl>
												<Input placeholder="INV-{YYYY}-{SEQ}" {...field} />
											</FormControl>
											<FormDescription>
												Preview:{" "}
												<span className="ml-1 font-bold font-mono text-primary">
													{previewPattern(field.value)}
												</span>
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="flex justify-end">
								<Button
									disabled={
										updateBrandingMutation.isPending || !form.formState.isDirty
									}
									type="submit"
								>
									{updateBrandingMutation.isPending
										? "Saving..."
										: "Save Patterns"}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
