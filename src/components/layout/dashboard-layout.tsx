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
	MoreHorizontal,
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
import { GlobalCommandPalette } from "~/components/layout/global-command-palette";
import { ImpersonationBanner } from "~/components/layout/impersonation-banner";
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
	const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

	const { data: layoutData, isLoading } =
		api.dashboard.getLayoutData.useQuery();
	const isSuperAdmin =
		layoutData?.user?.systemRole === "SUPER_ADMIN" ||
		userRole === "SUPER_ADMIN";
	const canAdminTenant =
		layoutData?.tenantRole === "OWNER" || layoutData?.tenantRole === "ADMIN";
	const isOnboardingIncomplete =
		!isLoading && layoutData && !layoutData.onboardingComplete && !isSuperAdmin;
	const isAllowedUnonboardedRoute =
		pathname === "/dashboard" ||
		pathname === "/settings/profile" ||
		pathname.startsWith("/settings/profile");

	const shouldBlockWholePage =
		isOnboardingIncomplete && !isAllowedUnonboardedRoute;
	const shouldShowTopWarning =
		isOnboardingIncomplete && isAllowedUnonboardedRoute;

	const displayUserName = layoutData?.user?.name || userName || "Alex Vance";
	const displayUserEmail =
		layoutData?.user?.email || userEmail || "alex@devcrm.io";
	const activeOrg = layoutData?.activeOrganization || {
		id: "default",
		name: "DevCRM HQ",
		slug: "hq",
		role: "OWNER",
		logoUrl: "/devfinity.png",
	};
	const orgList = layoutData?.organizations || [activeOrg];
	const features = layoutData?.entitlements?.features;

	const navItems = [
		{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
		{ label: "Deals", href: "/deals", icon: Building2 },
		{ label: "Contacts", href: "/clients", icon: Users },
		...(features && features.hasInvoicing === false && features.hasQuotes === false
			? []
			: [{ label: "Invoices & Quotes", href: "/billing/invoices", icon: CreditCard }]),
		...(features && features.hasInventory === false
			? []
			: [{ label: "Inventory", href: "/inventory/products", icon: Package }]),
		...(features && features.hasSubscriptions === false
			? []
			: [{ label: "Subscriptions", href: "/billing/subscriptions", icon: Repeat }]),
		...(features && features.hasAutomations === false
			? []
			: [{ label: "Automations", href: "/automations", icon: Zap }]),
		...(canAdminTenant
			? [{ label: "Tenant Admin", href: "/dashboard/admin", icon: ShieldAlert }]
			: []),
		{ label: "Settings", href: "/settings/profile", icon: Settings },
	];

	// Primary tabs for mobile bottom navigation bar
	const mobileBottomTabs = [
		{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
		{ label: "Deals", href: "/deals", icon: Building2 },
		{ label: "Contacts", href: "/clients", icon: Users },
		...(features && features.hasInvoicing === false && features.hasQuotes === false
			? []
			: [{ label: "Invoices", href: "/billing/invoices", icon: CreditCard }]),
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
									"hover:bg-accent/60 focus:ring-primary/40 flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all focus:ring-2 focus:outline-none",
									collapsed && "justify-center p-1.5",
								)}
								type="button"
							>
								<div className="bg-card border-border/80 ring-border/50 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border p-1 shadow-xs ring-1">
									{activeOrg.logoUrl ? (
										// biome-ignore lint/performance/noImgElement: user organization logo
										<img
											alt={activeOrg.name}
											className="h-full w-full object-contain"
											src={activeOrg.logoUrl}
										/>
									) : (
										// biome-ignore lint/performance/noImgElement: default platform branding logo
										<img
											alt="DevCRM"
											className="h-full w-full object-contain"
											src="/devfinity.png"
										/>
									)}
								</div>
								{!collapsed && (
									<div className="flex min-w-0 flex-1 items-center justify-between">
										<div className="flex flex-col truncate">
											<span className="text-foreground truncate text-sm font-semibold">
												{activeOrg.name}
											</span>
											<span className="text-muted-foreground truncate text-xs">
												{isSuperAdmin ? "Super Admin" : "Active Workspace"}
											</span>
										</div>
										<ChevronsUpDown className="text-muted-foreground h-4 w-4 shrink-0" />
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
										<Check className="text-primary h-4 w-4" />
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
							className="border-primary/25 bg-primary/10 text-primary hover:bg-primary/15 w-full justify-start gap-2 font-semibold"
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
									className="border-primary/25 bg-primary/10 text-primary hover:bg-primary/15 h-9 w-9"
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

			{/* Footer / System Status & Collapse Toggle */}
			<div className="border-border/60 flex flex-col gap-2 border-t pt-3">
				{!collapsed ? (
					<div className="border-border/70 bg-card/60 rounded-xl border p-3 backdrop-blur-xs">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
								<span className="text-foreground text-xs font-semibold">
									Production Engine
								</span>
							</div>
							<Badge className="font-mono text-[10px]" variant="success">
								Active
							</Badge>
						</div>
						<p className="text-muted-foreground mt-1 text-[11px]">
							Dual-region isolated DB
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
					)}
				</div>
			</div>
		</div>
	);

	return (
		<TooltipProvider delayDuration={150}>
			<div className="bg-background text-foreground selection:bg-primary/20 selection:text-primary flex min-h-dvh flex-col md:flex-row">
				{/* Desktop Sidebar */}
				<aside
					className={cn(
						"border-border/70 bg-card/85 z-40 hidden flex-col border-r backdrop-blur-md transition-all duration-300 md:sticky md:top-0 md:flex md:h-dvh",
						isCollapsed ? "w-16" : "w-64",
					)}
				>
					{sidebarContent(isCollapsed)}
				</aside>

				{/* Main Content Area */}
				<div className="flex min-w-0 flex-1 flex-col">
					{layoutData?.impersonatedOrgId && (
						<ImpersonationBanner
							impersonatedOrgId={layoutData.impersonatedOrgId}
							impersonatedOrgName={layoutData.impersonatedOrgName}
						/>
					)}
					{/* Top Sticky Header */}
					<header className="border-border/70 bg-background/85 sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-md md:px-6">
						<div className="flex items-center gap-3">
							{/* Mobile Drawer Trigger (min 44px tap target) */}
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
										<SheetTitle>Navigation Menu</SheetTitle>
									</SheetHeader>
									{sidebarContent(false)}
								</SheetContent>
							</Sheet>

							{/* Quick Search Trigger */}
							<button
								className="border-border/70 bg-card/70 text-muted-foreground hover:bg-card hover:border-primary/40 focus:ring-primary/20 relative flex h-10 w-52 max-w-md items-center justify-between rounded-xl border px-3 text-xs transition-all focus:ring-2 focus:outline-none sm:w-80 sm:text-sm"
								onClick={() => setCommandPaletteOpen(true)}
								type="button"
							>
								<div className="flex items-center gap-2 truncate">
									<Search className="text-muted-foreground h-4 w-4 shrink-0" />
									<span className="truncate">
										Search deals, clients, invoices...
									</span>
								</div>
								<kbd className="border-border/80 bg-accent text-muted-foreground hidden shrink-0 items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex">
									⌘K
								</kbd>
							</button>
						</div>

						{/* Trailing Controls & User Menu */}
						<div className="flex items-center gap-2 sm:gap-3">
							<Link href="/deals">
								<Button
									className="bg-primary text-primary-foreground hover:bg-primary/90 hidden gap-1.5 text-xs font-semibold shadow-xs sm:inline-flex"
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
										className="ring-primary/20 hover:ring-primary/40 flex h-11 w-11 items-center justify-center rounded-full p-0.5 ring-2 transition-all focus:outline-none sm:h-9 sm:w-9"
										type="button"
									>
										<div className="bg-primary/15 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
											{displayUserName.slice(0, 2).toUpperCase()}
										</div>
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56 p-2">
									<div className="flex flex-col px-2 py-1.5">
										<span className="text-foreground text-sm font-semibold">
											{displayUserName}
										</span>
										<span className="text-muted-foreground truncate text-xs">
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
												className="text-destructive cursor-pointer text-xs font-medium"
												href="/superadmin"
											>
												Super Admin Center
											</Link>
										</DropdownMenuItem>
									)}
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-destructive cursor-pointer text-xs"
										onClick={() => signOut({ callbackUrl: "/login" })}
									>
										<LogOut className="mr-2 h-3.5 w-3.5" />
										Sign Out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</header>

					{/* Main View Canvas (Bottom padded on mobile for bottom bar) */}
					<main className="bg-background flex-1 overflow-x-hidden p-4 pb-24 sm:p-6 sm:pb-24 md:p-8 md:pb-8">
						{/* Top Warning Banner for Dashboard & Profile when onboarding is incomplete */}
						{shouldShowTopWarning && (
							<div
								className="border-destructive/40 bg-destructive/10 text-foreground ring-destructive/20 mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border p-4 shadow-sm ring-1 sm:flex-row sm:items-center sm:p-5"
								role="alert"
							>
								<div className="flex items-start gap-3 sm:items-center">
									<div className="bg-destructive text-destructive-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs">
										<ShieldAlert className="h-5 w-5" />
									</div>
									<div>
										<h3 className="text-destructive text-sm font-semibold tracking-tight sm:text-base">
											Onboarding Incomplete — Features Restricted
										</h3>
										<p className="text-muted-foreground text-xs sm:text-sm">
											Please complete your organization onboarding to unlock
											full access to deals, clients, billing, inventory, and
											automations.
										</p>
									</div>
								</div>
								<Link className="w-full shrink-0 sm:w-auto" href="/onboarding">
									<Button
										className="min-h-[44px] w-full px-5 font-semibold shadow-xs sm:min-h-[38px] sm:w-auto"
										size="sm"
										variant="destructive"
									>
										Complete Onboarding
									</Button>
								</Link>
							</div>
						)}

						{/* Full-Page Blocker Overlay for All Other Routes */}
						{shouldBlockWholePage ? (
							<div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
								<div className="border-destructive/40 bg-card flex w-full max-w-md flex-col items-center rounded-2xl border p-6 text-center shadow-2xl sm:p-8">
									<div className="bg-destructive/15 text-destructive ring-destructive/10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-8">
										<ShieldAlert className="h-7 w-7" />
									</div>
									<h2 className="text-foreground mb-2 text-xl font-bold tracking-tight">
										Feature Blocked
									</h2>
									<p className="text-muted-foreground mb-6 text-sm">
										This feature is locked. You need to complete your
										organization onboarding before accessing this section.
									</p>
									<div className="flex w-full flex-col gap-3">
										<Link className="w-full" href="/onboarding">
											<Button
												className="min-h-[44px] w-full font-semibold"
												size="lg"
												variant="destructive"
											>
												Complete Onboarding
											</Button>
										</Link>
										<Link className="w-full" href="/dashboard">
											<Button
												className="min-h-[44px] w-full"
												size="lg"
												variant="outline"
											>
												Back to Dashboard
											</Button>
										</Link>
									</div>
								</div>
							</div>
						) : null}

						<div
							className={
								shouldBlockWholePage
									? "pointer-events-none opacity-15 select-none"
									: ""
							}
						>
							{children}
						</div>
					</main>

					{/* Global Cmd+K Command Palette */}
					<GlobalCommandPalette
						onOpenChange={setCommandPaletteOpen}
						open={commandPaletteOpen}
					/>

					{/* Mobile Fixed Bottom Navigation Bar */}
					<nav className="border-border/80 bg-background/95 fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-lg backdrop-blur-lg md:hidden">
						{mobileBottomTabs.map((tab) => {
							const Icon = tab.icon;
							const isActive =
								pathname === tab.href ||
								(tab.href !== "/dashboard" && pathname.startsWith(tab.href));

							return (
								<Link
									className={cn(
										"flex min-h-[44px] flex-1 flex-col items-center justify-center py-1 text-xs transition-colors",
										isActive
											? "text-primary font-semibold"
											: "text-muted-foreground hover:text-foreground",
									)}
									href={tab.href}
									key={tab.href}
								>
									<Icon
										className={cn(
											"mb-0.5 h-5 w-5",
											isActive ? "text-primary" : "text-muted-foreground",
										)}
									/>
									<span className="text-[10px] tracking-tight">
										{tab.label}
									</span>
								</Link>
							);
						})}
						{/* More button to open drawer */}
						<button
							className="text-muted-foreground hover:text-foreground flex min-h-[44px] flex-1 flex-col items-center justify-center py-1 text-xs"
							onClick={() => setMobileOpen(true)}
							type="button"
						>
							<MoreHorizontal className="mb-0.5 h-5 w-5" />
							<span className="text-[10px] tracking-tight">More</span>
						</button>
					</nav>
				</div>
			</div>
		</TooltipProvider>
	);
}
