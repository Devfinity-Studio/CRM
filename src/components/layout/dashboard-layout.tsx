"use client";

import {
	Building2,
	Check,
	ChevronLeft,
	ChevronRight,
	ChevronsUpDown,
	CreditCard,
	LayoutDashboard,
	LogOut,
	Menu,
	Package,
	Plus,
	Repeat,
	Search,
	Settings,
	ShieldAlert,
	Users,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type React from "react";
import { useState } from "react";
import { NotificationsBell } from "~/components/layout/notifications-bell";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/components/ui/sheet";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface DashboardLayoutProps {
	children: React.ReactNode;
	userRole?: "SUPER_ADMIN" | "USER";
	userName?: string;
	userEmail?: string;
}

export function DashboardLayout({
	children,
	userRole,
	userName,
	userEmail,
}: DashboardLayoutProps) {
	const pathname = usePathname();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	const { data: layoutData, isLoading } =
		api.dashboard.getLayoutData.useQuery();
	const isSuperAdmin =
		layoutData?.user?.systemRole === "SUPER_ADMIN" ||
		userRole === "SUPER_ADMIN";
	const canAdminTenant =
		layoutData?.tenantRole === "OWNER" || layoutData?.tenantRole === "ADMIN";
	const isOnboardingIncomplete =
		!isLoading && layoutData && !layoutData.onboardingComplete && !isSuperAdmin;

	const displayUserName = layoutData?.user?.name || userName || "Alex Vance";
	const displayUserEmail =
		layoutData?.user?.email || userEmail || "alex@devcrm.io";
	const activeOrg = layoutData?.activeOrganization || {
		id: "default",
		name: "DevCRM HQ",
		slug: "hq",
		role: "OWNER",
	};
	const orgList = layoutData?.organizations || [activeOrg];

	const navItems = [
		{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
		{ label: "Deals", href: "/deals", icon: Building2 },
		{ label: "Contacts", href: "/clients", icon: Users },
		{ label: "Invoices & Quotes", href: "/billing/invoices", icon: CreditCard },
		{ label: "Inventory", href: "/inventory/products", icon: Package },
		{ label: "Subscriptions", href: "/billing/subscriptions", icon: Repeat },
		{ label: "Automations", href: "/automations", icon: Zap },
		...(canAdminTenant
			? [{ label: "Tenant Admin", href: "/dashboard/admin", icon: ShieldAlert }]
			: []),
		{ label: "Settings", href: "/settings/profile", icon: Settings },
	];

	const sidebarContent = (collapsed: boolean) => (
		<div className="flex h-full flex-col justify-between p-3">
			<div className="flex flex-col gap-4">
				{/* Brand & Organization Switcher */}
				<div className="border-border/60 border-b pb-3">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								className={cn(
									"flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all hover:bg-accent/60",
									collapsed && "justify-center p-1.5",
								)}
								type="button"
							>
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm ring-2 ring-primary/20">
									<span className="font-bold font-mono text-sm tracking-tight">
										{activeOrg.name.slice(0, 2).toUpperCase()}
									</span>
								</div>
								{!collapsed && (
									<div className="flex min-w-0 flex-1 items-center justify-between">
										<div className="flex flex-col truncate">
											<span className="truncate font-semibold text-foreground text-sm">
												{activeOrg.name}
											</span>
											<span className="truncate text-muted-foreground text-xs">
												{isSuperAdmin ? "Super Admin" : "Active Workspace"}
											</span>
										</div>
										<ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
									</div>
								)}
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-56 p-2">
							<DropdownMenuLabel className="text-muted-foreground text-xs">
								Switch Organization
							</DropdownMenuLabel>
							{orgList.map((org) => (
								<DropdownMenuItem
									className="flex items-center justify-between py-2 text-sm"
									key={org.id}
								>
									<span className="truncate">{org.name}</span>
									{org.id === activeOrg.id && (
										<Check className="h-4 w-4 text-primary" />
									)}
								</DropdownMenuItem>
							))}
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<Link className="text-xs" href="/settings/organization">
									Manage Organizations
								</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Quick Action Button */}
				{!collapsed ? (
					<Link className="w-full" href="/deals">
						<Button
							className="w-full justify-start gap-2 border-primary/20 bg-primary/5 font-medium text-primary hover:bg-primary/10 hover:text-primary"
							size="sm"
							variant="outline"
						>
							<Plus className="h-4 w-4" />
							<span>New Pipeline Deal</span>
						</Button>
					</Link>
				) : (
					<Tooltip>
						<TooltipTrigger asChild>
							<Link className="mx-auto" href="/deals">
								<Button
									className="h-9 w-9 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
									size="icon"
									variant="outline"
								>
									<Plus className="h-4 w-4" />
								</Button>
							</Link>
						</TooltipTrigger>
						<TooltipContent side="right">New Pipeline Deal</TooltipContent>
					</Tooltip>
				)}

				{/* Navigation Items */}
				<nav className="flex flex-col gap-1">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive =
							pathname === item.href ||
							(item.href !== "/dashboard" && pathname.startsWith(item.href));

						if (collapsed) {
							return (
								<Tooltip key={item.href}>
									<TooltipTrigger asChild>
										<Link
											className={cn(
												"mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-all",
												isActive
													? "bg-primary text-primary-foreground shadow-sm"
													: "text-muted-foreground hover:bg-accent/80 hover:text-foreground",
											)}
											href={item.href}
										>
											<Icon className="h-4 w-4" />
										</Link>
									</TooltipTrigger>
									<TooltipContent side="right">{item.label}</TooltipContent>
								</Tooltip>
							);
						}

						return (
							<Link
								className={cn(
									"flex items-center gap-3 rounded-xl px-3 py-2 font-medium text-sm transition-all",
									isActive
										? "bg-primary/10 font-semibold text-primary shadow-xs"
										: "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
								)}
								href={item.href}
								key={item.href}
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

			{/* Footer / System Status & Collapse Toggle */}
			<div className="flex flex-col gap-2 border-border/60 border-t pt-3">
				{!collapsed ? (
					<div className="rounded-xl border border-border/60 bg-accent/40 p-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
								<span className="font-semibold text-foreground text-xs">
									API Cluster
								</span>
							</div>
							<Badge className="font-mono text-[10px]" variant="outline">
								Live
							</Badge>
						</div>
						<p className="mt-1 text-[11px] text-muted-foreground">
							99.98% uptime
						</p>
					</div>
				) : null}

				<div className="flex items-center justify-between pt-1">
					<Button
						className={cn(
							"text-muted-foreground hover:text-foreground",
							collapsed && "mx-auto",
						)}
						onClick={() => setIsCollapsed(!isCollapsed)}
						size="icon"
						title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
						type="button"
						variant="ghost"
					>
						{isCollapsed ? (
							<ChevronRight className="h-4 w-4" />
						) : (
							<ChevronLeft className="h-4 w-4" />
						)}
					</Button>

					{!collapsed && (
						<div className="flex items-center gap-1">
							<Button
								className="text-muted-foreground hover:text-destructive"
								onClick={() => signOut({ callbackUrl: "/login" })}
								size="icon"
								title="Sign out"
								type="button"
								variant="ghost"
							>
								<LogOut className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);

	return (
		<TooltipProvider delayDuration={150}>
			<div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">
				{/* Desktop Sidebar */}
				<aside
					className={cn(
						"z-40 hidden flex-col border-border/70 border-r bg-card/75 backdrop-blur-md transition-all duration-300 md:flex",
						isCollapsed ? "w-16" : "w-64",
					)}
				>
					{sidebarContent(isCollapsed)}
				</aside>

				{/* Main Content Area */}
				<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
					{/* Top Sticky Header */}
					<header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-border/70 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
						<div className="flex items-center gap-3">
							{/* Mobile Drawer Trigger */}
							<Sheet onOpenChange={setMobileOpen} open={mobileOpen}>
								<SheetTrigger asChild>
									<Button className="md:hidden" size="icon" variant="ghost">
										<Menu className="h-5 w-5" />
									</Button>
								</SheetTrigger>
								<SheetContent className="w-72 p-0" side="left">
									<SheetHeader className="sr-only">
										<SheetTitle>Navigation Menu</SheetTitle>
									</SheetHeader>
									{sidebarContent(false)}
								</SheetContent>
							</Sheet>

							{/* Quick Search */}
							<div className="relative w-64 max-w-md sm:w-80">
								<Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									className="h-9 rounded-lg border-border/60 bg-card/60 pr-12 pl-9 text-xs focus:bg-card sm:text-sm"
									placeholder="Search deals, contacts, invoices..."
									type="text"
								/>
								<kbd className="absolute top-1/2 right-2.5 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border/70 bg-accent px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
									⌘K
								</kbd>
							</div>
						</div>

						{/* Trailing Controls & User Menu */}
						<div className="flex items-center gap-2 sm:gap-3">
							<Link href="/deals">
								<Button
									className="hidden gap-1.5 bg-primary font-semibold text-white text-xs shadow-sm hover:bg-primary/90 sm:inline-flex"
									size="sm"
								>
									<Plus className="h-3.5 w-3.5" />
									<span>New Deal</span>
								</Button>
							</Link>

							<NotificationsBell />

							{/* User Account Dropdown */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										className="flex items-center gap-2 rounded-full p-0.5 ring-2 ring-primary/20 transition-all hover:ring-primary/40 focus:outline-none"
										type="button"
									>
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
											{displayUserName.slice(0, 2).toUpperCase()}
										</div>
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56 p-2">
									<div className="flex flex-col px-2 py-1.5">
										<span className="font-semibold text-foreground text-sm">
											{displayUserName}
										</span>
										<span className="truncate text-muted-foreground text-xs">
											{displayUserEmail}
										</span>
										<Badge
											className="mt-1.5 w-fit text-[10px]"
											variant={isSuperAdmin ? "destructive" : "secondary"}
										>
											{isSuperAdmin ? "Super Admin" : "Tenant Member"}
										</Badge>
									</div>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link
											className="cursor-pointer text-xs"
											href="/settings/profile"
										>
											My Profile
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link
											className="cursor-pointer text-xs"
											href="/settings/organization"
										>
											Organization Settings
										</Link>
									</DropdownMenuItem>
									{isSuperAdmin && (
										<DropdownMenuItem asChild>
											<Link
												className="cursor-pointer font-medium text-destructive text-xs"
												href="/superadmin"
											>
												Super Admin Center
											</Link>
										</DropdownMenuItem>
									)}
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="cursor-pointer text-destructive text-xs"
										onClick={() => signOut({ callbackUrl: "/login" })}
									>
										<LogOut className="mr-2 h-3.5 w-3.5" />
										Sign Out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</header>

					{/* Main View Canvas */}
					<main className="flex-1 overflow-auto bg-background p-4 sm:p-6 md:p-8">
						{isOnboardingIncomplete ? (
							<div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 p-6 backdrop-blur-md">
								<div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
									<ShieldAlert className="mb-4 h-12 w-12 text-destructive" />
									<h2 className="mb-2 font-bold text-foreground text-xl">
										Feature Blocked
									</h2>
									<p className="mb-6 text-muted-foreground text-sm">
										You need to complete the onboarding process to access your
										CRM workspace and features.
									</p>
									<Link href="/onboarding">
										<Button className="w-full" size="lg">
											Complete Onboarding
										</Button>
									</Link>
								</div>
							</div>
						) : null}
						<div
							className={
								isOnboardingIncomplete
									? "pointer-events-none select-none opacity-20"
									: ""
							}
						>
							{children}
						</div>
					</main>
				</div>
			</div>
		</TooltipProvider>
	);
}
