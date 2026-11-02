import { ArrowRight, BarChart3, CheckCircle2, DollarSign, Layers, Shield, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
	return (
		<HydrateClient>
			<div className="min-h-dvh flex flex-col bg-background text-foreground">
				{/* Top Navigation Bar */}
				<header className="sticky top-0 z-30 border-b border-border/70 bg-card/85 backdrop-blur-md">
					<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
						<Link className="flex items-center gap-2 font-bold text-lg tracking-tight" href="/">
							<div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-sm shadow-xs">
								D
							</div>
							<span>Dev<span className="text-primary">CRM</span></span>
						</Link>

						<div className="flex items-center gap-3">
							<Button asChild className="rounded-xl min-h-[44px] sm:min-h-9" variant="ghost">
								<Link href="/login">Sign In</Link>
							</Button>
							<Button asChild className="rounded-xl min-h-[44px] sm:min-h-9 font-semibold">
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
						<div className="mx-auto max-w-5xl text-center space-y-6">
							<div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
								<Sparkles className="h-3.5 w-3.5" />
								<span>Flagship B2B Revenue Operations Platform</span>
							</div>

							<h1 className="font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-foreground">
								Grow pipeline. Manage quotes. <br className="hidden sm:inline" />
								<span className="text-primary">Collect receivables faster.</span>
							</h1>

							<p className="mx-auto max-w-2xl text-base sm:text-xl text-muted-foreground leading-relaxed">
								DevCRM brings together modern sales deal pipelines, client catalogs, PDF invoicing, customer statements, and multi-tenant ledger control into one glassmorphic workspace.
							</p>

							<div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
								<Button asChild className="w-full sm:w-auto rounded-xl px-6 min-h-[44px] text-sm font-semibold shadow-md">
									<Link href="/dashboard">
										Launch Client Workspace
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
								<Button asChild className="w-full sm:w-auto rounded-xl px-6 min-h-[44px] text-sm" variant="outline">
									<Link href="/admin">Super Admin Portal</Link>
								</Button>
							</div>

							<div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
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
					<section className="border-t border-border/70 bg-card/40 py-16 sm:py-24">
						<div className="mx-auto max-w-7xl px-4 sm:px-6">
							<div className="text-center space-y-2 mb-12 sm:mb-16">
								<h2 className="font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
									Enterprise Revenue Infrastructure
								</h2>
								<p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
									Designed for modern B2B technology agencies, consultancies, and SaaS operators.
								</p>
							</div>

							<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
								<div className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur-md space-y-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
										<Layers className="h-5 w-5" />
									</div>
									<h3 className="font-bold text-base text-foreground">Kanban Deal Pipeline</h3>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Smooth drag-and-drop opportunity tracking, probability weighting, weighted forecast calculators, and client account association.
									</p>
								</div>

								<div className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur-md space-y-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
										<DollarSign className="h-5 w-5" />
									</div>
									<h3 className="font-bold text-base text-foreground">Invoicing & Retainers</h3>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Create itemized quotes, convert to invoices, capture signatures, track overdue balances, and monitor recurring client subscriptions.
									</p>
								</div>

								<div className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur-md space-y-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
										<BarChart3 className="h-5 w-5" />
									</div>
									<h3 className="font-bold text-base text-foreground">Marketing & ROAS Attribution</h3>
									<p className="text-xs text-muted-foreground leading-relaxed">
										Connect ad networks, log campaign spend, evaluate Cost Per Lead (CPL), and calculate customer acquisition cost automatically.
									</p>
								</div>
							</div>
						</div>
					</section>
				</main>

				{/* Footer */}
				<footer className="border-t border-border/70 bg-card/85 py-8">
					<div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 text-xs text-muted-foreground">
						<p>© {new Date().getFullYear()} DevCRM Platform. All rights reserved.</p>
						<div className="flex items-center gap-4">
							<Link className="hover:text-foreground" href="/login">Login</Link>
							<Link className="hover:text-foreground" href="/register">Sign Up</Link>
							<Link className="hover:text-foreground" href="/dashboard">Dashboard</Link>
						</div>
					</div>
				</footer>
			</div>
		</HydrateClient>
	);
}
