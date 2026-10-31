"use client";

import { useRouter } from "next/navigation";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export default function OrganizationsPage() {
	const router = useRouter();
	const { data: orgs, isLoading } = api.superadmin.getOrganizations.useQuery();

	if (isLoading)
		return <div className="text-zinc-400">Loading organizations...</div>;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl text-white tracking-tight">
						Organizations
					</h2>
					<p className="text-sm text-zinc-400">
						Manage all tenant workspaces in the system.
					</p>
				</div>
			</div>

			<div className="rounded-md border border-zinc-800 bg-zinc-900/50">
				<Table>
					<TableHeader>
						<TableRow className="border-zinc-800 hover:bg-transparent">
							<TableHead className="text-zinc-400">Name</TableHead>
							<TableHead className="text-zinc-400">Slug</TableHead>
							<TableHead className="text-zinc-400">Status</TableHead>
							<TableHead className="text-right text-zinc-400">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{orgs?.map((org) => (
							<TableRow
								className="border-zinc-800 hover:bg-zinc-800/50"
								key={org.id}
							>
								<TableCell className="font-medium text-zinc-100">
									{org.name}
								</TableCell>
								<TableCell className="text-zinc-400">{org.slug}</TableCell>
								<TableCell>
									<Badge className="border-0 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
										Active
									</Badge>
								</TableCell>
								<TableCell className="space-x-2 text-right">
									<Button
										className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
										disabled
										size="sm"
										variant="outline"
									>
										View Details
									</Button>
								</TableCell>
							</TableRow>
						))}
						{orgs?.length === 0 && (
							<TableRow>
								<TableCell
									className="py-6 text-center text-zinc-500"
									colSpan={4}
								>
									No organizations found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
