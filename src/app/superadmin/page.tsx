"use client";

import { Activity, Building, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";

function MetricCard({
	title,
	value,
	icon: Icon,
	description,
}: {
	title: string;
	value: string | number;
	icon: any;
	description?: string;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="font-medium text-muted-foreground text-sm">
					{title}
				</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl text-foreground">{value}</div>
				{description && (
					<p className="mt-1 text-muted-foreground text-xs">{description}</p>
				)}
			</CardContent>
		</Card>
	);
}

export default function SuperAdminPage() {
	const { data: health, isLoading } =
		api.superadmin.getPlatformHealth.useQuery();

	return (
		<div className="space-y-8">
			<div>
				<h1 className="font-bold text-3xl">Platform Overview</h1>
				<p className="mt-1 text-muted-foreground">
					High-level metrics across all DevCRM tenants.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<MetricCard
					description="Active tenants on the platform"
					icon={Building}
					title="Total Organizations"
					value={isLoading ? "..." : (health?.totalOrganizations ?? 0)}
				/>
				<MetricCard
					description="Global registered users"
					icon={Users}
					title="Total Users"
					value={isLoading ? "..." : (health?.totalUsers ?? 0)}
				/>
				<MetricCard
					description="Total invoice volume processed"
					icon={DollarSign}
					title="Global Processed Volume"
					value={
						isLoading
							? "..."
							: `$${((health?.globalRevenue ?? 0) / 100).toFixed(2)}`
					}
				/>
				<MetricCard
					description={`${health?.activeSessions ?? 0} Active Sessions`}
					icon={Activity}
					title="System Error Rate"
					value={isLoading ? "..." : (health?.errorRate ?? "0%")}
				/>
			</div>
		</div>
	);
}
