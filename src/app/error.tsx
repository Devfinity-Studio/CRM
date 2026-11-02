"use client";

import { AlertOctagon, RefreshCw, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to console or error reporting service
		console.error("Uncaught application error:", error);
	}, [error]);

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-16 text-center">
			<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/10 text-destructive shadow-sm">
				<AlertOctagon className="h-10 w-10 animate-bounce" />
			</div>

			<div className="mt-6 space-y-2 max-w-md">
				<div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
					<span>Application Exception</span>
				</div>
				<h1 className="font-extrabold text-3xl sm:text-4xl text-foreground tracking-tight">
					Something Went Wrong
				</h1>
				<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
					{error.message || "An unexpected error occurred while rendering this page."}
				</p>
				{error.digest && (
					<p className="font-mono text-[11px] text-muted-foreground/70">
						Reference ID: {error.digest}
					</p>
				)}
			</div>

			<div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
				<Button
					className="w-full sm:w-auto min-h-[44px] rounded-xl px-5 text-xs font-semibold"
					onClick={() => reset()}
				>
					<RotateCcw className="mr-2 h-4 w-4" />
					Try Again
				</Button>
				<Button asChild className="w-full sm:w-auto min-h-[44px] rounded-xl px-5 text-xs" variant="outline">
					<Link href="/dashboard">
						Return to Dashboard
					</Link>
				</Button>
			</div>
		</div>
	);
}

