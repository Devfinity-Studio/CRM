"use client";

import { PlayCircle, ShieldBan, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export default function TenantsPage() {
	const router = useRouter();
	const utils = api.useUtils();
	const { data: orgs, isLoading } = api.superadmin.getOrganizations.useQuery();

	const toggleStatus = api.superadmin.toggleOrganizationStatus.useMutation({
		onSuccess: () => {
			toast.success("Organization status updated");
			utils.superadmin.getOrganizations.invalidate();
		},
		onError: (err) => toast.error(err.message),
	});

	const deleteOrg = api.superadmin.deleteOrganization.useMutation({
		onSuccess: () => {
			toast.success("Organization deleted forever");
			utils.superadmin.getOrganizations.invalidate();
		},
		onError: (err) => toast.error(err.message),
	});

	const impersonate = api.superadmin.impersonateOrganization.useMutation({
		onSuccess: (res) => {
			toast.success(`Impersonating ${res.orgName}`);
			router.push("/dashboard");
		},
		onError: (err) => toast.error(err.message),
	});

	return (
		<div className="space-y-8">
			<div>
				<h1 className="font-bold text-3xl">Tenant Management</h1>
				<p className="mt-1 text-muted-foreground">
					Manage, impersonate, and suspend platform organizations.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Organizations List</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Organization Name</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell className="py-4 text-center" colSpan={4}>
										Loading organizations...
									</TableCell>
								</TableRow>
							) : orgs?.length === 0 ? (
								<TableRow>
									<TableCell className="py-4 text-center" colSpan={4}>
										No organizations found.
									</TableCell>
								</TableRow>
							) : (
								orgs?.map((org) => (
									<TableRow key={org.id}>
										<TableCell className="font-medium">{org.name}</TableCell>
										<TableCell>{org.slug}</TableCell>
										<TableCell>
											<Badge variant={org.isActive ? "success" : "destructive"}>
												{org.isActive ? "Active" : "Suspended"}
											</Badge>
										</TableCell>
										<TableCell className="space-x-2 text-right">
											<Button
												disabled={impersonate.isPending}
												onClick={() => impersonate.mutate({ orgId: org.id })}
												size="sm"
												variant="outline"
											>
												<PlayCircle className="mr-1 h-4 w-4" /> Impersonate
											</Button>
											<Button
												disabled={toggleStatus.isPending}
												onClick={() =>
													toggleStatus.mutate({
														orgId: org.id,
														isActive: !org.isActive,
													})
												}
												size="sm"
												variant={org.isActive ? "secondary" : "default"}
											>
												<ShieldBan className="mr-1 h-4 w-4" />{" "}
												{org.isActive ? "Suspend" : "Activate"}
											</Button>
											<Button
												disabled={deleteOrg.isPending}
												onClick={() => {
													if (
														confirm(
															`Are you absolutely sure you want to delete ${org.name}? This cannot be undone.`,
														)
													) {
														deleteOrg.mutate({ orgId: org.id });
													}
												}}
												size="sm"
												variant="destructive"
											>
												<Trash2 className="mr-1 h-4 w-4" /> Delete
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
