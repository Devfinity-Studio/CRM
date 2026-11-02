import { ArrowRight, Building2, CreditCard, Shield, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

export default async function AdminPage() {
	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<Shield className="h-5 w-5 text-primary" />
					<h2 className="font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
						Super Admin Command Center
					</h2>
				</div>
				<p className="text-sm text-muted-foreground">
					Manage global CRM subscription plans, multi-tenant organizations, and system-wide user credentials.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				<Card className="border border-border bg-card shadow-sm hover:border-primary/40 transition">
					<CardHeader className="space-y-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<Building2 className="h-5 w-5" />
						</div>
						<CardTitle className="text-lg font-bold text-foreground">
							Tenant Workspaces
						</CardTitle>
						<CardDescription className="text-xs text-muted-foreground">
							Monitor and configure client tenant organizations, domain bindings, and active tier assignments.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className="w-full min-h-[44px] gap-2 font-semibold shadow-xs">
							<Link href="/admin/organizations">
								<span>View Organizations</span>
								<ArrowRight className="h-4 w-4" />
							</Link>
						</Button>
					</CardContent>
				</Card>

				<Card className="border border-border bg-card shadow-sm hover:border-primary/40 transition">
					<CardHeader className="space-y-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<Users className="h-5 w-5" />
						</div>
						<CardTitle className="text-lg font-bold text-foreground">
							Global Users
						</CardTitle>
						<CardDescription className="text-xs text-muted-foreground">
							Audit all registered accounts, elevate super admin privileges, and inspect authentication profiles.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild className="w-full min-h-[44px] gap-2 font-semibold shadow-xs">
							<Link href="/admin/users">
								<span>Manage Users</span>
								<ArrowRight className="h-4 w-4" />
							</Link>
						</Button>
					</CardContent>
				</Card>

				<Card className="border border-border bg-card shadow-sm hover:border-primary/40 transition">
					<CardHeader className="space-y-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<CreditCard className="h-5 w-5" />
						</div>
						<CardTitle className="text-lg font-bold text-foreground">
							Subscription Plans
						</CardTitle>
						<CardDescription className="text-xs text-muted-foreground">
							Configure billing plans, pricing models, seat quotas, and feature flags across all workspaces.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild variant="outline" className="w-full min-h-[44px] gap-2 font-medium">
							<Link href="/admin/plans">
								<span>Manage Plans</span>
								<ArrowRight className="h-4 w-4" />
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
