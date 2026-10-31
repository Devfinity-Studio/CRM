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
		title: "Team",
		href: "/settings/team",
	},
];

interface SettingsLayoutProps {
	children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
	const pathname = usePathname();

	return (
		<DashboardLayout>
			<div className="flex-1 space-y-4 p-8 pt-6">
				<div className="space-y-0.5">
					<h2 className="font-bold text-2xl text-foreground tracking-tight">
						Settings
					</h2>
					<p className="text-muted-foreground">
						Manage your account settings and set organization preferences.
					</p>
				</div>
				<div className="h-[1px] w-full shrink-0 bg-border" />
				<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
					<aside className="-mx-4 lg:w-1/5">
						<nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
							{sidebarNavItems.map((item) => (
								<Link
									className={cn(
										"inline-flex h-9 items-center justify-start whitespace-nowrap rounded-md px-4 py-2 font-medium text-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
										pathname === item.href
											? "bg-muted font-medium text-primary"
											: "text-muted-foreground",
									)}
									href={item.href}
									key={item.href}
								>
									{item.title}
								</Link>
							))}
						</nav>
					</aside>
					<div className="flex-1 lg:max-w-2xl">{children}</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
