import { ArrowLeft, FileQuestion, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-16 text-center">
			<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
				<FileQuestion className="h-10 w-10 animate-pulse" />
			</div>

			<div className="mt-6 space-y-2 max-w-md">
				<div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
					<span>Error 404</span>
				</div>
				<h1 className="font-extrabold text-3xl sm:text-4xl text-foreground tracking-tight">
					Page Not Found
				</h1>
				<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
					The resource or route you requested could not be located, has moved, or requires higher organization permissions.
				</p>
			</div>

			<div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
				<Button asChild className="w-full sm:w-auto min-h-[44px] rounded-xl px-5 text-xs font-semibold">
					<Link href="/dashboard">
						<Home className="mr-2 h-4 w-4" />
						Return to Dashboard
					</Link>
				</Button>
				<Button asChild className="w-full sm:w-auto min-h-[44px] rounded-xl px-5 text-xs" variant="outline">
					<Link href="/">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Home
					</Link>
				</Button>
			</div>
		</div>
	);
}

