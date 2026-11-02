"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type * as React from "react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

export default function RegisterPage() {
	const router = useRouter();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");

	const [error, setError] = useState<string | null>(null);

	const registerMutation = api.auth.register.useMutation({
		onSuccess: async () => {
			const res = await signIn("credentials", {
				identifier: email,
				password,
				redirect: false,
			});

			if (res?.error) {
				router.push("/login");
			}
			if (res?.ok) {
				router.push("/dashboard");
				router.refresh();
			}
		},
		onError: (e) => {
			setError(e.message || "An error occurred during registration.");
		},
	});

	const handleOAuthRegister = (provider: string) => {
		signIn(provider, { callbackUrl: "/dashboard" });
	};

	const handleRegister = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		registerMutation.mutate({
			name,
			email,
			phone,
			password,
		});
	};

	return (
		<div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
			<div className="w-full max-w-md space-y-8 rounded-3xl border border-border/70 bg-card/85 p-6 sm:p-8 shadow-xl backdrop-blur-md">
				<div className="text-center space-y-2">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold text-xl">
						D
					</div>
					<h2 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
						Create an account
					</h2>
					<p className="text-xs sm:text-sm text-muted-foreground">
						Start managing client pipelines and receivables today.
					</p>
				</div>

				{error && (
					<div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3.5">
						<p className="text-destructive text-xs font-medium">{error}</p>
					</div>
				)}

				<form className="mt-6 space-y-4" onSubmit={handleRegister}>
					<div className="space-y-3.5">
						<div className="space-y-1.5">
							<Label className="text-xs">Full Name</Label>
							<Input
								className="h-10 text-sm"
								onChange={(e) => setName(e.target.value)}
								placeholder="John Doe"
								required
								type="text"
								value={name}
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs">Email Address</Label>
							<Input
								className="h-10 text-sm"
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								required
								type="email"
								value={email}
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs">Phone (Optional)</Label>
							<Input
								className="h-10 text-sm"
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+1 (555) 000-0000"
								type="tel"
								value={phone}
							/>
						</div>

						<div className="space-y-1.5">
							<Label className="text-xs">Password</Label>
							<Input
								className="h-10 text-sm"
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								required
								type="password"
								value={password}
							/>
						</div>
					</div>

					<Button
						className="w-full min-h-[44px] rounded-xl font-semibold mt-2"
						disabled={registerMutation.isPending}
						type="submit"
					>
						{registerMutation.isPending ? "Creating account..." : "Sign Up"}
					</Button>
				</form>

				<div className="mt-6">
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-border/70 border-t" />
						</div>
						<div className="relative flex justify-center text-xs">
							<span className="bg-card px-2 text-muted-foreground">
								Or register with
							</span>
						</div>
					</div>

					<div className="mt-6 grid grid-cols-2 gap-3">
						<Button
							className="rounded-xl min-h-[44px] text-xs"
							onClick={() => handleOAuthRegister("github")}
							variant="outline"
						>
							<svg
								aria-hidden="true"
								className="mr-2 h-4 w-4"
								data-icon="github"
								data-prefix="fab"
								focusable="false"
								role="img"
								viewBox="0 0 496 512"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
									fill="currentColor"
								></path>
							</svg>
							GitHub
						</Button>
						<Button
							className="rounded-xl min-h-[44px] text-xs"
							onClick={() => handleOAuthRegister("google")}
							variant="outline"
						>
							<svg
								aria-hidden="true"
								className="mr-2 h-4 w-4"
								data-icon="google"
								data-prefix="fab"
								focusable="false"
								role="img"
								viewBox="0 0 488 512"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
									fill="currentColor"
								></path>
							</svg>
							Google
						</Button>
					</div>
				</div>

				<p className="mt-8 text-center text-xs text-muted-foreground">
					Already have an account?{" "}
					<Link
						className="font-semibold text-primary hover:underline"
						href="/login"
					>
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
