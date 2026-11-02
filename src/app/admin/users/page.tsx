"use client";

import { Calendar, ChevronRight, Loader2, Mail, Shield, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export default function UsersPage() {
	const { data: users, isLoading } = api.superadmin.getUsers.useQuery();

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
					<span className="text-foreground font-medium">Global Users</span>
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
					Global Platform Users
				</h1>
				<p className="text-sm text-muted-foreground">
					View and audit all registered user accounts and system privileges across all tenant organizations.
				</p>
			</div>

			<div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="border-border hover:bg-transparent bg-muted/30">
								<TableHead className="text-muted-foreground font-semibold text-xs">User Name</TableHead>
								<TableHead className="text-muted-foreground font-semibold text-xs">Email Address</TableHead>
								<TableHead className="text-muted-foreground font-semibold text-xs">System Role</TableHead>
								<TableHead className="text-right text-muted-foreground font-semibold text-xs">
									Registration Date
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users?.map((user) => (
								<TableRow
									className="border-border hover:bg-muted/30 transition-colors"
									key={user.id}
								>
									<TableCell className="font-semibold text-foreground py-4">
										<div className="flex items-center gap-2.5">
											<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
												<User className="h-4 w-4" />
											</div>
											<span>{user.name || "Unnamed User"}</span>
										</div>
									</TableCell>
									<TableCell className="text-muted-foreground text-xs font-mono">
										<div className="flex items-center gap-1.5">
											<Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
											<span>{user.email}</span>
										</div>
									</TableCell>
									<TableCell>
										{user.systemRole === "SUPER_ADMIN" ? (
											<Badge
												className="font-semibold text-[10px]"
												variant="destructive"
											>
												SUPER ADMIN
											</Badge>
										) : (
											<Badge
												className="font-semibold text-[10px]"
												variant="secondary"
											>
												STANDARD USER
											</Badge>
										)}
									</TableCell>
									<TableCell className="text-right text-xs text-muted-foreground">
										<div className="inline-flex items-center gap-1">
											<Calendar className="h-3 w-3 text-muted-foreground/70" />
											<span>
												{user.createdAt
													? new Date(user.createdAt).toLocaleDateString()
													: "N/A"}
											</span>
										</div>
									</TableCell>
								</TableRow>
							))}
							{users?.length === 0 && (
								<TableRow>
									<TableCell
										className="py-12 text-center text-muted-foreground"
										colSpan={4}
									>
										No users found in system.
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
