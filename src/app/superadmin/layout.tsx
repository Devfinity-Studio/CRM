import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function SuperAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	if (session.user.systemRole !== "SUPER_ADMIN") {
		redirect("/dashboard");
	}

	return (
		<div className="min-h-dvh flex flex-col bg-background">
			<header className="sticky top-0 z-40 border-b border-border/70 bg-card/85 backdrop-blur-md px-4 sm:px-6 py-3.5">
				<div className="mx-auto flex max-w-7xl items-center justify-between">
					<div className="flex items-center gap-6">
						<Link className="flex items-center gap-2 font-bold text-foreground text-lg tracking-tight" href="/superadmin">
							<span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
							<span>SuperAdmin</span>
						</Link>
						<nav className="flex items-center gap-1 sm:gap-2">
							<Link
								className="rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
								href="/superadmin"
							>
								Overview
							</Link>
							<Link
								className="rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
								href="/superadmin/tenants"
							>
								Tenants
							</Link>
							<Link
								className="rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
								href="/superadmin/settings"
							>
								Settings
							</Link>
						</nav>
					</div>
					<div className="flex items-center gap-3 text-xs text-muted-foreground">
						<span className="hidden sm:inline-block font-mono">{session.user.email}</span>
						<Link
							className="rounded-xl border border-border/70 bg-background/50 px-3 py-1.5 font-medium text-foreground hover:bg-accent"
							href="/dashboard"
						>
							CRM App →
						</Link>
					</div>
				</div>
			</header>
			<main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 md:p-8 pb-20">{children}</main>
		</div>
	);
}
