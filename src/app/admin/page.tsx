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
			<div>
				<h2 className="font-bold text-2xl text-white tracking-tight">
					Super Admin Dashboard
				</h2>
				<p className="text-sm text-zinc-400">
					Manage global CRM subscription plans, client organizations, and
					billing.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
					<CardHeader>
						<CardTitle>Client Companies</CardTitle>
						<CardDescription className="text-zinc-400">
							Manage organization tenants & subscription status
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href="/admin/organizations">
							<Button className="w-full border-0 bg-indigo-600 text-white hover:bg-indigo-700">
								View Organizations
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
					<CardHeader>
						<CardTitle>Global Users</CardTitle>
						<CardDescription className="text-zinc-400">
							Manage users across all tenants
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href="/admin/users">
							<Button className="w-full border-0 bg-indigo-600 text-white hover:bg-indigo-700">
								Manage Users
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
					<CardHeader>
						<CardTitle>Subscription Plans</CardTitle>
						<CardDescription className="text-zinc-400">
							Configure pricing tiers, user limits & features
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href="/admin/plans">
							<Button
								className="w-full border-0 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
								variant="secondary"
							>
								Manage Plans
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
