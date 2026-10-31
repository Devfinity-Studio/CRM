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
		<div className="min-h-screen bg-background">
			<nav className="flex items-center justify-between border-b bg-card px-6 py-4">
				<div className="flex items-center gap-6">
					<span className="mr-4 font-bold text-primary text-xl">
						DevCRM SuperAdmin
					</span>
					<a
						className="text-muted-foreground text-sm hover:text-foreground"
						href="/superadmin"
					>
						Overview
					</a>
					<a
						className="text-muted-foreground text-sm hover:text-foreground"
						href="/superadmin/tenants"
					>
						Tenants
					</a>
					<a
						className="text-muted-foreground text-sm hover:text-foreground"
						href="/superadmin/settings"
					>
						Global Settings
					</a>
				</div>
				<div className="text-muted-foreground text-sm">
					Logged in as {session.user.email}
				</div>
			</nav>
			<main className="mx-auto max-w-7xl p-6 md:p-10">{children}</main>
		</div>
	);
}
