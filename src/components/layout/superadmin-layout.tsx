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
import Image from "next/image";
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
				<div className="border-border/70 mb-6 flex items-center justify-between border-b px-2 pt-1 pb-4">
					<div className="flex items-center gap-2.5">
						<div className="bg-card border-border/80 flex h-9 w-9 items-center justify-center rounded-xl border p-1 shadow-xs">
							<Image
								alt="DevCRM"
								className="h-full w-full object-contain"
								height={28}
								priority
								src="/devfinity.png"
								width={28}
							/>
						</div>
						<div className="flex flex-col">
							<span className="text-foreground text-sm font-bold tracking-tight">
								DevCRM
							</span>
							<span className="text-muted-foreground text-[11px]">
								Global Engine
							</span>
						</div>
					</div>
					<Badge variant="destructive">ADMIN</Badge>
				</div>

				<nav className="space-y-1">
					{adminNav.map((item) => {
						const Icon = item.icon;
						const isActive =
							pathname === item.href || pathname?.startsWith(`${item.href}/`);

						return (
							<Link
								className={cn(
									"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
									isActive
										? "bg-primary/15 text-primary font-semibold shadow-2xs"
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
					<div className="bg-primary/15 text-primary flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold">
						{userName?.charAt(0) || "A"}
					</div>
					<div className="overflow-hidden">
						<p className="text-foreground truncate text-sm font-medium">
							{userName || "Super Admin"}
						</p>
						<p className="text-muted-foreground truncate text-xs">
							{userEmail || "admin@system.io"}
						</p>
					</div>
				</div>

				<div className="space-y-1.5">
					<Link className="block" href="/dashboard">
						<Button
							className="border-border/80 text-foreground/80 hover:bg-accent/60 w-full justify-start"
							size="sm"
							variant="outline"
						>
							<LogOut className="mr-2 h-4 w-4 rotate-180" />
							Return to App
						</Button>
					</Link>
					<Button
						className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full justify-start"
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
		<div className="bg-background text-foreground flex min-h-dvh flex-col md:flex-row">
			{/* Desktop Sidebar */}
			<aside className="border-border/70 bg-card/85 hidden w-64 flex-col border-r p-0 backdrop-blur-md md:sticky md:top-0 md:flex md:h-dvh">
				{sidebarContent}
			</aside>

			{/* Main Content */}
			<div className="flex min-w-0 flex-1 flex-col">
				{/* Top Header */}
				<header className="border-border/70 bg-background/85 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur-md sm:px-6">
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

						<div className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm">
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
