import {
	ArrowRight,
	BarChart3,
	CheckCircle2,
	DollarSign,
	Layers,
	Shield,
	Sparkles,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
	return (
		<HydrateClient>
			<div className="bg-background text-foreground flex min-h-dvh flex-col">
				{/* Top Navigation Bar */}
				<header className="border-border/70 bg-card/85 sticky top-0 z-30 border-b backdrop-blur-md">
					<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
						<Link
							className="flex items-center gap-2.5 text-lg font-bold tracking-tight"
							href="/"
						>
							<div className="bg-card border-border/80 flex h-9 w-9 items-center justify-center rounded-xl border p-1 shadow-xs">
								<Image
									alt="Devfinity"
									className="h-full w-full object-contain"
									height={32}
									priority
									src="/devfinity.png"
									width={32}
								/>
							</div>
							<span>
								Dev<span className="text-primary">CRM</span>
							</span>
						</Link>

						<div className="flex items-center gap-3">
							<Button
								asChild
								className="min-h-[44px] rounded-xl sm:min-h-9"
								variant="ghost"
							>
								<Link href="/login">Sign In</Link>
							</Button>
							<Button
								asChild
								className="min-h-[44px] rounded-xl font-semibold sm:min-h-9"
							>
								<Link href="/register">
									<span>Get Started</span>
									<ArrowRight className="ml-1.5 h-4 w-4" />
								</Link>
							</Button>
						</div>
					</div>
				</header>

				{/* Hero Section */}
				<main className="flex-1">
					<section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 lg:pt-24 lg:pb-32">
						<div className="mx-auto max-w-5xl space-y-6 text-center">
							<div className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold">
								<Sparkles className="h-3.5 w-3.5" />
								<span>Flagship B2B Revenue Operations Platform</span>
							</div>

							<h1 className="text-foreground text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
								Grow pipeline. Manage quotes.{" "}
								<br className="hidden sm:inline" />
								<span className="text-primary">
									Collect receivables faster.
								</span>
							</h1>

							<p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed sm:text-xl">
								DevCRM brings together modern sales deal pipelines, client
								catalogs, PDF invoicing, customer statements, and multi-tenant
								ledger control into one glassmorphic workspace.
							</p>

							<div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
								<Button
									asChild
									className="min-h-[44px] w-full rounded-xl px-6 text-sm font-semibold shadow-md sm:w-auto"
								>
									<Link href="/dashboard">
										Launch Client Workspace
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>

							<div className="text-muted-foreground flex flex-wrap items-center justify-center gap-6 pt-8 text-xs">
								<div className="flex items-center gap-1.5">
									<CheckCircle2 className="h-4 w-4 text-emerald-500" />
									<span>Multi-Tenant Architecture</span>
								</div>
								<div className="flex items-center gap-1.5">
									<CheckCircle2 className="h-4 w-4 text-emerald-500" />
									<span>Dodo Payments & Svix Ready</span>
								</div>
								<div className="flex items-center gap-1.5">
									<CheckCircle2 className="h-4 w-4 text-emerald-500" />
									<span>Zero-Lag tRPC Endpoints</span>
								</div>
							</div>
						</div>
					</section>

					{/* Platform Capabilities Grid */}
					<section className="border-border/70 bg-card/40 border-t py-16 sm:py-24">
						<div className="mx-auto max-w-7xl px-4 sm:px-6">
							<div className="mb-12 space-y-2 text-center sm:mb-16">
								<h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
									Enterprise Revenue Infrastructure
								</h2>
								<p className="text-muted-foreground mx-auto max-w-xl text-xs sm:text-sm">
									Designed for modern B2B technology agencies, consultancies,
									and SaaS operators.
								</p>
							</div>

							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
								<div className="border-border/70 bg-card/85 space-y-3 rounded-3xl border p-6 shadow-sm backdrop-blur-md">
									<div className="border-primary/20 bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-2xl border">
										<Layers className="h-5 w-5" />
									</div>
									<h3 className="text-foreground text-base font-bold">
										Kanban Deal Pipeline
									</h3>
									<p className="text-muted-foreground text-xs leading-relaxed">
										Smooth drag-and-drop opportunity tracking, probability
										weighting, weighted forecast calculators, and client account
										association.
									</p>
								</div>

								<div className="border-border/70 bg-card/85 space-y-3 rounded-3xl border p-6 shadow-sm backdrop-blur-md">
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
										<DollarSign className="h-5 w-5" />
									</div>
									<h3 className="text-foreground text-base font-bold">
										Invoicing & Retainers
									</h3>
									<p className="text-muted-foreground text-xs leading-relaxed">
										Create itemized quotes, convert to invoices, capture
										signatures, track overdue balances, and monitor recurring
										client subscriptions.
									</p>
								</div>

								<div className="border-border/70 bg-card/85 space-y-3 rounded-3xl border p-6 shadow-sm backdrop-blur-md">
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-500">
										<BarChart3 className="h-5 w-5" />
									</div>
									<h3 className="text-foreground text-base font-bold">
										Marketing & ROAS Attribution
									</h3>
									<p className="text-muted-foreground text-xs leading-relaxed">
										Connect ad networks, log campaign spend, evaluate Cost Per
										Lead (CPL), and calculate customer acquisition cost
										automatically.
									</p>
								</div>
							</div>
						</div>
					</section>
				</main>

				{/* Footer */}
				<footer className="border-border/70 bg-card/85 border-t py-8">
					<div className="text-muted-foreground mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs sm:flex-row sm:px-6">
						<p>
							© {new Date().getFullYear()} DevCRM Platform. All rights reserved.
						</p>
						<div className="flex items-center gap-4">
							<Link className="hover:text-foreground" href="/login">
								Login
							</Link>
							<Link className="hover:text-foreground" href="/register">
								Sign Up
							</Link>
							<Link className="hover:text-foreground" href="/dashboard">
								Dashboard
							</Link>
						</div>
					</div>
				</footer>
			</div>
		</HydrateClient>
	);
}
