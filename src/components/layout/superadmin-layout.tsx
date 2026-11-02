"use client";

import {
	Building2,
	CreditCard,
	LayoutDashboard,
	LogOut,
	Menu,
	Settings,
	ShieldAlert,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type React from "react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/components/ui/sheet";
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
	const [mobileOpen, setMobileOpen] = useState(false);

	const adminNav = [
		{ label: "Platform Overview", href: "/admin", icon: LayoutDashboard },
		{ label: "Organizations", href: "/admin/organizations", icon: Building2 },
		{ label: "Global Users", href: "/admin/users", icon: Users },
		{ label: "Subscription Tiers", href: "/admin/plans", icon: CreditCard },
		{ label: "System Settings", href: "/admin/settings", icon: Settings },
	];

	const sidebarContent = (
		<div className="flex h-full flex-col justify-between p-4">
			<div>
				<div className="mb-6 flex items-center justify-between border-border/70 border-b px-2 pb-4 pt-1">
					<div className="flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive font-bold text-white shadow-sm ring-2 ring-destructive/20">
							SA
						</div>
						<div className="flex flex-col">
							<span className="font-bold text-foreground text-sm tracking-tight">
								DevCRM
							</span>
							<span className="text-[11px] text-muted-foreground">
								Global Engine
							</span>
						</div>
					</div>
					<Badge variant="destructive">
						ADMIN
					</Badge>
				</div>

				<nav className="space-y-1">
					{adminNav.map((item) => {
						const Icon = item.icon;
						const isActive =
							pathname === item.href || pathname?.startsWith(`${item.href}/`);

						return (
							<Link
								className={cn(
									"flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-sm transition-all",
									isActive
										? "bg-primary/15 font-semibold text-primary shadow-2xs"
										: "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
								)}
								href={item.href}
								key={item.href}
								onClick={() => setMobileOpen(false)}
							>
								<Icon
									className={cn(
										"h-4 w-4",
										isActive ? "text-primary" : "text-muted-foreground",
									)}
								/>
								<span>{item.label}</span>
							</Link>
						);
					})}
				</nav>
			</div>

			<div className="border-border/70 border-t pt-4">
				<div className="mb-4 flex items-center gap-3 px-3 py-2">
					<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary text-sm">
						{userName?.charAt(0) || "A"}
					</div>
					<div className="overflow-hidden">
						<p className="truncate font-medium text-foreground text-sm">
							{userName || "Super Admin"}
						</p>
						<p className="truncate text-xs text-muted-foreground">
							{userEmail || "admin@system.io"}
						</p>
					</div>
				</div>

				<div className="space-y-1.5">
					<Link className="block" href="/dashboard">
						<Button
							className="w-full justify-start border-border/80 text-foreground/80 hover:bg-accent/60"
							size="sm"
							variant="outline"
						>
							<LogOut className="mr-2 h-4 w-4 rotate-180" />
							Return to App
						</Button>
					</Link>
					<Button
						className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						onClick={() => signOut({ callbackUrl: "/login" })}
						size="sm"
						variant="ghost"
					>
						<LogOut className="mr-2 h-4 w-4" />
						Sign out
					</Button>
				</div>
			</div>
		</div>
	);

	return (
		<div className="flex min-h-dvh flex-col md:flex-row bg-background text-foreground">
			{/* Desktop Sidebar */}
			<aside className="hidden w-64 flex-col border-border/70 border-r bg-card/85 p-0 backdrop-blur-md md:flex md:sticky md:top-0 md:h-dvh">
				{sidebarContent}
			</aside>

			{/* Main Content */}
			<div className="flex min-w-0 flex-1 flex-col">
				{/* Top Header */}
				<header className="sticky top-0 z-30 flex h-14 items-center justify-between border-border/70 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
					<div className="flex items-center gap-3">
						<Sheet onOpenChange={setMobileOpen} open={mobileOpen}>
							<SheetTrigger asChild>
								<Button
									className="h-11 w-11 p-0 md:hidden"
									size="icon"
									variant="ghost"
								>
									<Menu className="h-5 w-5" />
									<span className="sr-only">Toggle navigation drawer</span>
								</Button>
							</SheetTrigger>
							<SheetContent className="w-72 p-0" side="left">
								<SheetHeader className="sr-only">
									<SheetTitle>Super Admin Menu</SheetTitle>
								</SheetHeader>
								{sidebarContent}
							</SheetContent>
						</Sheet>

						<div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
							<ShieldAlert className="h-4 w-4 text-amber-500" />
							<span>Global Administration Area</span>
						</div>
					</div>
				</header>

				{/* Scrollable Content */}
				<main className="flex-1 p-4 sm:p-6 md:p-8">
					<div className="mx-auto max-w-6xl">{children}</div>
				</main>
			</div>
		</div>
	);
}
