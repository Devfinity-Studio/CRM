"use client";

import {
	Building2,
	CreditCard,
	FileText,
	LayoutDashboard,
	Package,
	Receipt,
	Settings,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "~/components/ui/command";
import { api } from "~/trpc/react";

interface GlobalCommandPaletteProps {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function GlobalCommandPalette({
	open: controlledOpen,
	onOpenChange: setControlledOpen,
}: GlobalCommandPaletteProps) {
	const [internalOpen, setInternalOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const router = useRouter();

	const isControlled = controlledOpen !== undefined;
	const isOpen = isControlled ? controlledOpen : internalOpen;
	const setIsOpen = React.useCallback(
		(open: boolean) => {
			if (isControlled && setControlledOpen) {
				setControlledOpen(open);
			} else {
				setInternalOpen(open);
			}
		},
		[isControlled, setControlledOpen],
	);

	// Global Keyboard Shortcut: ⌘K or Ctrl+K
	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setIsOpen(!isOpen);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [isOpen, setIsOpen]);

	// Live Query
	const { data: searchResults, isFetching } =
		api.dashboard.globalSearch.useQuery(
			{ query: searchQuery },
			{ enabled: searchQuery.trim().length > 0 },
		);

	const handleNavigate = (url: string) => {
		setIsOpen(false);
		setSearchQuery("");
		router.push(url);
	};

	const formatCurrency = (cents: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			maximumFractionDigits: 0,
		}).format(cents / 100);
	};

	return (
		<CommandDialog
			description="Search across all deals, contacts, invoices, quotes, products, and navigation."
			onOpenChange={setIsOpen}
			open={isOpen}
			title="Global Command Palette"
		>
			<CommandInput
				onValueChange={setSearchQuery}
				placeholder="Type a command, deal name, contact, invoice #, or SKU..."
				value={searchQuery}
			/>
			<CommandList className="max-h-[380px] p-2">
				<CommandEmpty>
					{isFetching ? "Searching workspace..." : "No results found."}
				</CommandEmpty>

				{/* Deals Category */}
				{searchResults?.deals && searchResults.deals.length > 0 && (
					<CommandGroup heading="Deals">
						{searchResults.deals.map((deal) => (
							<CommandItem
								className="flex cursor-pointer items-center justify-between py-2"
								key={deal.id}
								onSelect={() => handleNavigate(deal.url)}
							>
								<div className="flex items-center gap-2">
									<TrendingUp className="h-4 w-4 text-sky-500" />
									<span className="font-medium text-foreground text-sm">
										{deal.title}
									</span>
								</div>
								<div className="flex items-center gap-2 text-xs">
									<span className="font-mono text-muted-foreground">
										{formatCurrency(deal.value)}
									</span>
									<span className="rounded bg-accent/60 px-1.5 py-0.5 font-semibold text-[10px] uppercase">
										{deal.status}
									</span>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				)}

				{/* Companies / Clients */}
				{searchResults?.companies && searchResults.companies.length > 0 && (
					<CommandGroup heading="Companies">
						{searchResults.companies.map((comp) => (
							<CommandItem
								className="flex cursor-pointer items-center justify-between py-2"
								key={comp.id}
								onSelect={() => handleNavigate(comp.url)}
							>
								<div className="flex items-center gap-2">
									<Building2 className="h-4 w-4 text-amber-500" />
									<span className="font-medium text-foreground text-sm">
										{comp.name}
									</span>
								</div>
								<span className="text-muted-foreground text-xs">
									View Profile
								</span>
							</CommandItem>
						))}
					</CommandGroup>
				)}

				{/* Contacts */}
				{searchResults?.contacts && searchResults.contacts.length > 0 && (
					<CommandGroup heading="Contacts">
						{searchResults.contacts.map((contact) => (
							<CommandItem
								className="flex cursor-pointer items-center justify-between py-2"
								key={contact.id}
								onSelect={() => handleNavigate(contact.url)}
							>
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4 text-emerald-500" />
									<span className="font-medium text-foreground text-sm">
										{contact.name}
									</span>
								</div>
								<span className="text-muted-foreground text-xs">
									{contact.email || "No email"}
								</span>
							</CommandItem>
						))}
					</CommandGroup>
				)}

				{/* Invoices */}
				{searchResults?.invoices && searchResults.invoices.length > 0 && (
					<CommandGroup heading="Invoices">
						{searchResults.invoices.map((inv) => (
							<CommandItem
								className="flex cursor-pointer items-center justify-between py-2"
								key={inv.id}
								onSelect={() => handleNavigate(inv.url)}
							>
								<div className="flex items-center gap-2">
									<Receipt className="h-4 w-4 text-indigo-500" />
									<span className="font-medium text-foreground text-sm">
										Invoice #{inv.invoiceNumber}
									</span>
								</div>
								<div className="flex items-center gap-2 text-xs">
									<span className="font-mono text-muted-foreground">
										{formatCurrency(inv.totalAmount)}
									</span>
									<span className="rounded bg-accent/60 px-1.5 py-0.5 font-semibold text-[10px] uppercase">
										{inv.status}
									</span>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				)}

				{/* Quotes & Proposals */}
				{searchResults?.quotes && searchResults.quotes.length > 0 && (
					<CommandGroup heading="Quotes & Proposals">
						{searchResults.quotes.map((q) => (
							<CommandItem
								className="flex cursor-pointer items-center justify-between py-2"
								key={q.id}
								onSelect={() => handleNavigate(q.url)}
							>
								<div className="flex items-center gap-2">
									<FileText className="h-4 w-4 text-purple-500" />
									<span className="font-medium text-foreground text-sm">
										Proposal #{q.quoteNumber}
									</span>
								</div>
								<span className="text-muted-foreground text-xs">
									{formatCurrency(q.totalAmount)}
								</span>
							</CommandItem>
						))}
					</CommandGroup>
				)}

				{/* Inventory SKUs */}
				{searchResults?.products && searchResults.products.length > 0 && (
					<CommandGroup heading="Inventory Products">
						{searchResults.products.map((p) => (
							<CommandItem
								className="flex cursor-pointer items-center justify-between py-2"
								key={p.id}
								onSelect={() => handleNavigate(p.url)}
							>
								<div className="flex items-center gap-2">
									<Package className="h-4 w-4 text-blue-500" />
									<span className="font-medium text-foreground text-sm">
										{p.name}
									</span>
								</div>
								<div className="flex items-center gap-2 text-xs">
									{p.sku && (
										<span className="text-[11px] text-muted-foreground">
											SKU: {p.sku}
										</span>
									)}
									<span className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-[10px] text-primary">
										{p.stockQuantity} in stock
									</span>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				)}

				{/* Quick Navigation Commands */}
				<CommandSeparator />
				<CommandGroup heading="Navigation">
					<CommandItem
						className="cursor-pointer"
						onSelect={() => handleNavigate("/dashboard")}
					>
						<LayoutDashboard className="mr-2 h-4 w-4" />
						<span>Dashboard</span>
						<CommandShortcut>⌘D</CommandShortcut>
					</CommandItem>
					<CommandItem
						className="cursor-pointer"
						onSelect={() => handleNavigate("/deals")}
					>
						<TrendingUp className="mr-2 h-4 w-4" />
						<span>Deals Board</span>
						<CommandShortcut>⌘P</CommandShortcut>
					</CommandItem>
					<CommandItem
						className="cursor-pointer"
						onSelect={() => handleNavigate("/clients")}
					>
						<Users className="mr-2 h-4 w-4" />
						<span>Contacts & Companies</span>
						<CommandShortcut>⌘C</CommandShortcut>
					</CommandItem>
					<CommandItem
						className="cursor-pointer"
						onSelect={() => handleNavigate("/billing/invoices")}
					>
						<CreditCard className="mr-2 h-4 w-4" />
						<span>Invoices</span>
						<CommandShortcut>⌘I</CommandShortcut>
					</CommandItem>
					<CommandItem
						className="cursor-pointer"
						onSelect={() => handleNavigate("/billing/subscriptions")}
					>
						<Zap className="mr-2 h-4 w-4" />
						<span>Client Subscriptions</span>
					</CommandItem>
					<CommandItem
						className="cursor-pointer"
						onSelect={() => handleNavigate("/inventory/products")}
					>
						<Package className="mr-2 h-4 w-4" />
						<span>Inventory & Products</span>
					</CommandItem>
					<CommandItem
						className="cursor-pointer"
						onSelect={() => handleNavigate("/settings/profile")}
					>
						<Settings className="mr-2 h-4 w-4" />
						<span>Settings</span>
						<CommandShortcut>⌘S</CommandShortcut>
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
