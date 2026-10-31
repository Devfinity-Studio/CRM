"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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

const securitySchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type SecurityFormValues = z.infer<typeof securitySchema>;

export default function SettingsSecurityPage() {
	const changePasswordMutation = api.settings.changePassword.useMutation({
		onSuccess: () => {
			toast.success("Password changed successfully");
			form.reset();
		},
		onError: (err) => {
			toast.error(`Failed to change password: ${err.message}`);
		},
	});

	const form = useForm<SecurityFormValues>({
		resolver: zodResolver(securitySchema),
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

	const onSubmit = (data: SecurityFormValues) => {
		changePasswordMutation.mutate({
			currentPassword: data.currentPassword,
			newPassword: data.newPassword,
		});
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="font-medium text-lg">Security</h3>
				<p className="text-muted-foreground text-sm">
					Manage your password and security preferences.
				</p>
			</div>
			<Separator />

			<Card>
				<CardHeader>
					<CardTitle>Change Password</CardTitle>
					<CardDescription>
						Ensure your account is using a long, random password to stay secure.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							className="space-y-4 sm:max-w-md"
							onSubmit={form.handleSubmit(onSubmit)}
						>
							<FormField
								control={form.control}
								name="currentPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Current Password</FormLabel>
										<FormControl>
											<Input type="password" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="newPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>New Password</FormLabel>
										<FormControl>
											<Input type="password" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm New Password</FormLabel>
										<FormControl>
											<Input type="password" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="pt-2">
								<Button
									disabled={
										changePasswordMutation.isPending || !form.formState.isDirty
									}
									type="submit"
								>
									{changePasswordMutation.isPending
										? "Updating..."
										: "Update Password"}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
