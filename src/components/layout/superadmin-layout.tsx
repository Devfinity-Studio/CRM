"use client";

import {
	Building2,
	CreditCard,
	LayoutDashboard,
	LogOut,
	Settings,
	ShieldAlert,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type React from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface SuperAdminLayoutProps {
	children: React.ReactNode;
	userName?: string;
	userEmail?: string;
}

export function SuperAdminLayout({
	children,
	userName,
	userEmail,
}: SuperAdminLayoutProps) {
	const pathname = usePathname();

	const adminNav = [
		{ label: "Platform Overview", href: "/admin", icon: LayoutDashboard },
		{ label: "Organizations", href: "/admin/organizations", icon: Building2 },
		{ label: "Global Users", href: "/admin/users", icon: Users },
		{ label: "Subscription Tiers", href: "/admin/plans", icon: CreditCard },
		{ label: "System Settings", href: "/admin/settings", icon: Settings },
	];

	return (
		<div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
			{/* Sidebar */}
			<aside className="flex w-64 flex-col justify-between border-zinc-800 border-r bg-zinc-900/50 p-4">
				<div>
					<div className="mb-6 flex items-center gap-2 border-zinc-800 border-b px-2 py-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-lg text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]">
							SA
						</div>
						<div>
							<span className="font-bold text-lg text-white tracking-tight">
								DevCRM
							</span>
							<Badge
								className="ml-2 bg-red-600 px-1 py-0 text-[10px] hover:bg-red-700"
								variant="destructive"
							>
								ADMIN
							</Badge>
						</div>
					</div>

					<nav className="space-y-1">
						{adminNav.map((item) => {
							const Icon = item.icon;
							const isActive =
								pathname === item.href || pathname?.startsWith(`${item.href}/`);

							return (
								<Link
									className={cn(
										"flex items-center gap-3 rounded-md px-3 py-2.5 font-medium text-sm transition-all duration-200",
										isActive
											? "bg-indigo-500/10 text-indigo-400"
											: "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100",
									)}
									href={item.href}
									key={item.href}
								>
									<Icon
										className={cn(
											"h-4 w-4",
											isActive ? "text-indigo-400" : "text-zinc-500",
										)}
									/>
									{item.label}
								</Link>
							);
						})}
					</nav>
				</div>

				<div className="border-zinc-800 border-t pt-4">
					<div className="mb-4 flex items-center gap-3 px-3 py-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 font-medium text-sm text-zinc-300">
							{userName?.charAt(0) || "A"}
						</div>
						<div className="overflow-hidden">
							<p className="truncate font-medium text-sm text-zinc-200">
								{userName || "Super Admin"}
							</p>
							<p className="truncate text-xs text-zinc-500">
								{userEmail || "admin@system.io"}
							</p>
						</div>
					</div>

					<Button
						className="w-full justify-start text-zinc-400 hover:bg-red-400/10 hover:text-red-400"
						onClick={() => signOut({ callbackUrl: "/login" })}
						variant="ghost"
					>
						<LogOut className="mr-2 h-4 w-4" />
						Sign out
					</Button>

					<Link className="mt-2 block" href="/dashboard">
						<Button
							className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800"
							variant="outline"
						>
							<LogOut className="mr-2 h-4 w-4 rotate-180" />
							Return to App
						</Button>
					</Link>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex min-w-0 flex-1 flex-col bg-[#09090b]">
				{/* Top Header */}
				<header className="flex h-14 items-center justify-between border-zinc-800 border-b bg-zinc-900/30 px-6 backdrop-blur-sm">
					<div className="flex items-center gap-2 text-sm text-zinc-400">
						<ShieldAlert className="h-4 w-4 text-amber-500" />
						<span>Global Administration Area</span>
					</div>
				</header>

				{/* Scrollable Content */}
				<div className="flex-1 overflow-auto p-6">
					<div className="mx-auto max-w-6xl">{children}</div>
				</div>
			</main>
		</div>
	);
}
