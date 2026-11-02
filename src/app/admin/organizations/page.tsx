"use client";

import { Building2, ChevronRight, Loader2, Shield } from "lucide-react";
import Link from "next/link";
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
	const { data: orgs, isLoading } = api.superadmin.getOrganizations.useQuery();

	if (isLoading) {
		return (
			<div className="flex h-[40vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Breadcrumb & Header */}
			<div className="space-y-1">
				<div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
					<Link
						href="/admin"
						className="hover:text-foreground transition-colors flex items-center gap-1"
					>
						<Shield className="h-3.5 w-3.5" />
						Super Admin
					</Link>
					<ChevronRight className="h-3.5 w-3.5" />
					<span className="text-foreground font-medium">Tenant Workspaces</span>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
					Tenant Organizations
				</h1>
				<p className="text-sm text-muted-foreground">
					Manage and inspect all client workspaces and multi-tenant environments.
				</p>
			</div>

			<div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="border-border hover:bg-transparent bg-muted/30">
								<TableHead className="text-muted-foreground font-semibold text-xs">Organization Name</TableHead>
								<TableHead className="text-muted-foreground font-semibold text-xs">Slug Identifier</TableHead>
								<TableHead className="text-muted-foreground font-semibold text-xs">Status</TableHead>
								<TableHead className="text-right text-muted-foreground font-semibold text-xs">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{orgs?.map((org) => (
								<TableRow
									className="border-border hover:bg-muted/30 transition-colors"
									key={org.id}
								>
									<TableCell className="font-semibold text-foreground py-4">
										<div className="flex items-center gap-2.5">
											<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
												<Building2 className="h-4 w-4" />
											</div>
											<span>{org.name}</span>
										</div>
									</TableCell>
									<TableCell className="font-mono text-xs text-muted-foreground">
										{org.slug}
									</TableCell>
									<TableCell>
										<Badge variant="default" className="text-[11px] font-semibold">
											Active
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<Button
											className="min-h-[38px] text-xs"
											disabled
											size="sm"
											variant="outline"
										>
											Workspace Details
										</Button>
									</TableCell>
								</TableRow>
							))}
							{orgs?.length === 0 && (
								<TableRow>
									<TableCell
										className="py-12 text-center text-muted-foreground"
										colSpan={4}
									>
										No tenant organizations found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
