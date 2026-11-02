"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { cn } from "~/lib/utils";

const sidebarNavItems = [
	{
		title: "Profile",
		href: "/settings/profile",
	},
	{
		title: "Subscription & Plans",
		href: "/settings/billing",
	},
	{
		title: "Security",
		href: "/settings/security",
	},
	{
		title: "Organization",
		href: "/settings/organization",
	},
	{
		title: "Branding",
		href: "/settings/branding",
	},
	{
		title: "API Keys",
		href: "/settings/api-keys",
	},
	{
		title: "Webhooks",
		href: "/settings/webhooks",
	},
];

interface SettingsLayoutProps {
	children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
	const pathname = usePathname();

	return (
		<DashboardLayout>
			<div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 sm:p-6 lg:p-8 pb-16">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
							Preferences
						</span>
						<span className="text-muted-foreground text-xs">
							Account & Workspace Configuration
						</span>
					</div>
					<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
						Settings
					</h1>
					<p className="text-muted-foreground text-xs sm:text-sm">
						Manage your personal profile, credentials, security, branding rules, and developer integrations.
					</p>
				</div>

				<div className="h-px w-full shrink-0 bg-border/70" />

				<div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
					{/* Sidebar Navigation */}
					<aside className="w-full lg:w-56 shrink-0">
						<nav className="flex space-x-1.5 overflow-x-auto no-scrollbar pb-2 lg:flex-col lg:space-x-0 lg:space-y-1 lg:pb-0">
							{sidebarNavItems.map((item) => (
								<Link
									className={cn(
										"inline-flex min-h-[44px] sm:min-h-9 items-center justify-start whitespace-nowrap rounded-xl px-4 py-2 font-medium text-xs sm:text-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
										pathname === item.href
											? "bg-primary font-semibold text-primary-foreground shadow-xs"
											: "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
									)}
									href={item.href}
									key={item.href}
								>
									{item.title}
								</Link>
							))}
						</nav>
					</aside>

					<div className="flex-1 max-w-4xl">{children}</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
