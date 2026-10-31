"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type * as React from "react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
			// Auto-login after successful registration
			const res = await signIn("credentials", {
				identifier: email,
				password,
				redirect: false,
			});

			if (res?.error) {
				router.push("/login"); // Fallback to login
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
		<div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
			<div className="w-full max-w-md space-y-8 rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
				<div className="text-center">
					<h2 className="mt-6 font-bold text-3xl text-white tracking-tight">
						Create an account
					</h2>
					<p className="mt-2 text-sm text-zinc-400">
						Start managing your CRM today
					</p>
				</div>

				{error && (
					<div className="rounded-md border border-red-800 bg-red-900/50 p-4">
						<p className="text-red-200 text-sm">{error}</p>
					</div>
				)}

				<form className="mt-8 space-y-6" onSubmit={handleRegister}>
					<div className="space-y-4 rounded-md shadow-sm">
						<div>
							<label className="font-medium text-sm text-zinc-300">
								Full Name
							</label>
							<Input
								className="mt-1 border-zinc-800 bg-zinc-950 text-white"
								onChange={(e) => setName(e.target.value)}
								placeholder="John Doe"
								required
								type="text"
								value={name}
							/>
						</div>

						<div>
							<label className="font-medium text-sm text-zinc-300">
								Email Address
							</label>
							<Input
								className="mt-1 border-zinc-800 bg-zinc-950 text-white"
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								required
								type="email"
								value={email}
							/>
						</div>

						<div>
							<label className="font-medium text-sm text-zinc-300">
								Phone (Optional)
							</label>
							<Input
								className="mt-1 border-zinc-800 bg-zinc-950 text-white"
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+1 555-0199"
								type="tel"
								value={phone}
							/>
						</div>

						<div>
							<label className="font-medium text-sm text-zinc-300">
								Password
							</label>
							<Input
								className="mt-1 border-zinc-800 bg-zinc-950 text-white"
								minLength={6}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								required
								type="password"
								value={password}
							/>
						</div>
					</div>

					<div>
						<Button
							className="w-full bg-blue-600 text-white hover:bg-blue-700"
							disabled={registerMutation.isPending}
							type="submit"
						>
							{registerMutation.isPending ? "Creating account..." : "Sign up"}
						</Button>
					</div>
				</form>

				<p className="mt-8 text-center text-sm text-zinc-400">
					Already have an account?{" "}
					<Link
						className="font-medium text-blue-400 hover:text-blue-300"
						href="/login"
					>
						Sign in instead
					</Link>
				</p>
			</div>
		</div>
	);
}
