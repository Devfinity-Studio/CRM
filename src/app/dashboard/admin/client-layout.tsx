"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { cn } from "~/lib/utils";

const sidebarNavItems = [
	{
		title: "Workspace Settings",
		href: "/dashboard/admin/workspace",
	},
	{
		title: "Team Members",
		href: "/settings/organization",
	},
	{
		title: "Billing & Plans",
		href: "/billing",
	},
	{
		title: "Webhooks",
		href: "/settings/webhooks",
	},
	{
		title: "API Keys",
		href: "/settings/api-keys",
	},
];

export function TenantAdminLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	return (
		<div className="flex-1 space-y-6 px-3 sm:px-6 py-4 sm:py-8 max-w-7xl mx-auto">
			<div className="space-y-1 border-b border-border pb-5">
				<h2 className="font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
					Tenant Administration
				</h2>
				<p className="text-sm text-muted-foreground">
					Manage your organization workspace, member access permissions, and enterprise settings.
				</p>
			</div>

			<div className="flex flex-col space-y-6 lg:flex-row lg:space-x-8 lg:space-y-0">
				<aside className="lg:w-1/4">
					<nav className="flex space-x-1 overflow-x-auto pb-2 no-scrollbar lg:flex-col lg:space-x-0 lg:space-y-1">
						{sidebarNavItems.map((item) => (
							<Link
								className={cn(
									"inline-flex min-h-[42px] items-center justify-start whitespace-nowrap rounded-xl px-4 py-2 font-medium text-xs sm:text-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
									pathname === item.href
										? "bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 hover:text-primary-foreground"
										: "text-muted-foreground hover:bg-muted/60",
								)}
								href={item.href}
								key={item.href}
							>
								{item.title}
							</Link>
						))}
					</nav>
				</aside>
				<div className="flex-1 lg:max-w-3xl">{children}</div>
			</div>
		</div>
	);
}
