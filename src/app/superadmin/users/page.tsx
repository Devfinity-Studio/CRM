"use client";

import {
	AlertTriangle,
	Building2,
	CheckCircle2,
	KeyRound,
	LogOut,
	RotateCw,
	Search,
	Shield,
	ShieldAlert,
	ShieldCheck,
	UserCheck,
	UserPlus,
	Users,
	UserX,
} from "lucide-react";
import React, { useId, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

function generateSecurePassword(length = 16): string {
	const charset =
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
	let result = "";
	const randomValues = new Uint32Array(length);
	crypto.getRandomValues(randomValues);
	for (let i = 0; i < length; i++) {
		result += charset[randomValues[i]! % charset.length];
	}
	return result;
}

export default function GlobalUsersPage() {
	const utils = api.useUtils();

	// Search & filters
	const [search, setSearch] = useState("");
	const [systemRoleFilter, setSystemRoleFilter] = useState<
		"ALL" | "SUPER_ADMIN" | "USER"
	>("ALL");
	const [statusFilter, setStatusFilter] = useState<
		"ALL" | "ACTIVE" | "SUSPENDED"
	>("ALL");

	// Dialog states
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
	const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<any>(null);

	// Form states
	const [newUserName, setNewUserName] = useState("");
	const [newUserEmail, setNewUserEmail] = useState("");
	const [newUserPassword, setNewUserPassword] = useState("");
	const [newUserRole, setNewUserRole] = useState<"SUPER_ADMIN" | "USER">("USER");

	const [resetPasswordValue, setResetPasswordValue] = useState("");
	const [targetRole, setTargetRole] = useState<"SUPER_ADMIN" | "USER">("USER");

	// Queries
	const { data, isLoading } = api.superadmin.getGlobalUsers.useQuery({
		search: search.trim() || undefined,
		systemRole: systemRoleFilter,
		status: statusFilter,
		limit: 100,
	});

	// Mutations
	const updateUserRoleMutation =
		api.superadmin.updateUserSystemRole.useMutation({
			onSuccess: (res) => {
				toast.success(`Role updated for ${res.email}`);
				setRoleChangeDialogOpen(false);
				setSelectedUser(null);
				utils.superadmin.getGlobalUsers.invalidate();
			},
			onError: (err) => toast.error(err.message),
		});

	const toggleStatusMutation =
		api.superadmin.toggleUserActiveStatus.useMutation({
			onSuccess: (res) => {
				toast.success(
					`Account ${res.isActive ? "activated" : "suspended"} for ${res.email}`,
				);
				utils.superadmin.getGlobalUsers.invalidate();
			},
			onError: (err) => toast.error(err.message),
		});

	const resetPasswordMutation =
		api.superadmin.adminResetUserPassword.useMutation({
			onSuccess: () => {
				toast.success("Password reset successfully. Active sessions invalidated.");
				setResetPasswordDialogOpen(false);
				setSelectedUser(null);
				setResetPasswordValue("");
			},
			onError: (err) => toast.error(err.message),
		});

	const revokeSessionsMutation =
		api.superadmin.revokeUserSessions.useMutation({
			onSuccess: () => {
				toast.success("User sessions terminated across all devices.");
			},
			onError: (err) => toast.error(err.message),
		});

	const createStaffMutation = api.superadmin.createStaffUser.useMutation({
		onSuccess: (res) => {
			toast.success(`Staff user created: ${res.email}`);
			setCreateDialogOpen(false);
			setNewUserName("");
			setNewUserEmail("");
			setNewUserPassword("");
			setNewUserRole("USER");
			utils.superadmin.getGlobalUsers.invalidate();
		},
		onError: (err) => toast.error(err.message),
	});

	// Handlers
	const handleOpenResetPassword = (user: any) => {
		setSelectedUser(user);
		setResetPasswordValue(generateSecurePassword(16));
		setResetPasswordDialogOpen(true);
	};

	const handleOpenRoleChange = (user: any) => {
		setSelectedUser(user);
		setTargetRole(user.systemRole === "SUPER_ADMIN" ? "USER" : "SUPER_ADMIN");
		setRoleChangeDialogOpen(true);
	};

	const handleToggleStatus = (user: any) => {
		const willActivate = !user.isActive;
		if (
			!willActivate &&
			!window.confirm(
				`Are you sure you want to suspend ${user.email}? They will immediately lose platform access and all active sessions will be terminated.`,
			)
		) {
			return;
		}
		toggleStatusMutation.mutate({
			userId: user.id,
			isActive: willActivate,
		});
	};

	const handleRevokeSessions = (user: any) => {
		if (
			window.confirm(
				`Terminate all active authentication sessions for ${user.email}? The user will be required to sign in again.`,
			)
		) {
			revokeSessionsMutation.mutate({ userId: user.id });
		}
	};

	const stats = data?.stats ?? {
		totalUsers: 0,
		superAdmins: 0,
		activeUsers: 0,
		suspendedUsers: 0,
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
				<div>
					<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
						<Users className="h-7 w-7 text-primary" />
						Global Users & Staff Governance
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Manage platform staff roles, account suspensions, forced session
						revocation, and password resets.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button
						onClick={() => {
							setNewUserPassword(generateSecurePassword(16));
							setCreateDialogOpen(true);
						}}
						className="gap-2 shadow-sm font-medium"
					>
						<UserPlus className="h-4 w-4" />
						Provision Staff User
					</Button>
				</div>
			</div>

			{/* Metrics Overview */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card className="border-border/60 bg-card/60 backdrop-blur-sm">
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
							<Users className="h-4 w-4 text-blue-500" />
							Total Users
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl sm:text-3xl font-bold font-mono">
							{stats.totalUsers.toLocaleString()}
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 bg-card/60 backdrop-blur-sm">
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
							<Shield className="h-4 w-4 text-purple-500" />
							Super Admins
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl sm:text-3xl font-bold font-mono text-purple-600 dark:text-purple-400">
							{stats.superAdmins.toLocaleString()}
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 bg-card/60 backdrop-blur-sm">
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
							<UserCheck className="h-4 w-4 text-emerald-500" />
							Active Users
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
							{stats.activeUsers.toLocaleString()}
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60 bg-card/60 backdrop-blur-sm">
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
							<UserX className="h-4 w-4 text-rose-500" />
							Suspended
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl sm:text-3xl font-bold font-mono text-rose-600 dark:text-rose-400">
							{stats.suspendedUsers.toLocaleString()}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filter & Search Bar */}
			<Card className="border-border/60 bg-card/50">
				<CardContent className="p-4 sm:p-5">
					<div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
						<div className="sm:col-span-6 relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search users by name or email..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9 bg-background/50"
							/>
						</div>

						<div className="sm:col-span-3">
							<select
								value={systemRoleFilter}
								onChange={(e) => setSystemRoleFilter(e.target.value as any)}
								className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
							>
								<option value="ALL">All System Roles</option>
								<option value="SUPER_ADMIN">Super Admins Only</option>
								<option value="USER">Regular Users</option>
							</select>
						</div>

						<div className="sm:col-span-3">
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value as any)}
								className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
							>
								<option value="ALL">All Statuses</option>
								<option value="ACTIVE">Active Accounts</option>
								<option value="SUSPENDED">Suspended Accounts</option>
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Users Table */}
			<Card className="border-border/60">
				<CardHeader className="pb-3 border-b border-border/50">
					<div className="flex items-center justify-between">
						<CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
							<span>Global Directory</span>
							<Badge variant="outline" className="text-xs font-mono">
								{data?.total ?? 0} found
							</Badge>
						</CardTitle>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => utils.superadmin.getGlobalUsers.invalidate()}
							className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
						>
							<RotateCw className="h-3.5 w-3.5" />
							Refresh
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-0 overflow-x-auto">
					<Table>
						<TableHeader className="bg-muted/30">
							<TableRow>
								<TableHead>User Profile</TableHead>
								<TableHead>System Role</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Tenant Memberships</TableHead>
								<TableHead>Joined At</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
										<div className="flex items-center justify-center gap-2">
											<RotateCw className="h-4 w-4 animate-spin text-primary" />
											Loading platform users...
										</div>
									</TableCell>
								</TableRow>
							) : data?.items && data.items.length > 0 ? (
								data.items.map((user) => (
									<TableRow key={user.id} className="hover:bg-muted/20">
										{/* Profile */}
										<TableCell>
											<div className="flex items-center gap-3">
												<div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
													{user.name ? user.name.slice(0, 2) : user.email.slice(0, 2)}
												</div>
												<div className="min-w-0">
													<div className="font-medium text-foreground text-sm truncate flex items-center gap-1.5">
														<span>{user.name || "Unnamed User"}</span>
													</div>
													<div className="text-xs text-muted-foreground font-mono truncate">
														{user.email}
													</div>
													{user.phone && (
														<div className="text-[11px] text-muted-foreground font-mono">
															{user.phone}
														</div>
													)}
												</div>
											</div>
										</TableCell>

										{/* System Role */}
										<TableCell>
											{user.systemRole === "SUPER_ADMIN" ? (
												<Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 gap-1 font-semibold text-xs py-0.5">
													<ShieldCheck className="h-3.5 w-3.5" />
													SUPER ADMIN
												</Badge>
											) : (
												<Badge variant="secondary" className="text-xs font-normal text-muted-foreground py-0.5">
													USER
												</Badge>
											)}
										</TableCell>

										{/* Status */}
										<TableCell>
											{user.isActive ? (
												<Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 text-xs py-0.5">
													<CheckCircle2 className="h-3 w-3" />
													Active
												</Badge>
											) : (
												<Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 gap-1 text-xs py-0.5">
													<AlertTriangle className="h-3 w-3" />
													Suspended
												</Badge>
											)}
										</TableCell>

										{/* Organizations */}
										<TableCell>
											<div className="flex flex-wrap gap-1.5 max-w-xs">
												{user.organizations.length > 0 ? (
													user.organizations.map((org) => (
														<span
															key={org.organizationId}
															className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
														>
															<Building2 className="h-3 w-3 text-muted-foreground/70" />
															<span className="truncate max-w-[120px]">{org.organizationName}</span>
															<span className="text-[10px] text-primary font-mono">({org.role})</span>
														</span>
													))
												) : (
													<span className="text-xs text-muted-foreground italic">
														No tenants
													</span>
												)}
											</div>
										</TableCell>

										{/* Joined */}
										<TableCell className="text-xs text-muted-foreground font-mono">
											{new Date(user.createdAt).toLocaleDateString()}
										</TableCell>

										{/* Actions */}
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-1.5">
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleOpenRoleChange(user)}
													title="Change System Role"
													className="h-8 px-2 text-xs gap-1"
												>
													<Shield className="h-3.5 w-3.5" />
													<span className="hidden md:inline">Role</span>
												</Button>

												<Button
													variant="outline"
													size="sm"
													onClick={() => handleOpenResetPassword(user)}
													title="Reset Password"
													className="h-8 px-2 text-xs gap-1"
												>
													<KeyRound className="h-3.5 w-3.5" />
													<span className="hidden md:inline">Password</span>
												</Button>

												<Button
													variant="outline"
													size="sm"
													onClick={() => handleRevokeSessions(user)}
													title="Revoke Sessions"
													className="h-8 px-2 text-xs gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-700"
												>
													<LogOut className="h-3.5 w-3.5" />
													<span className="hidden md:inline">Signout</span>
												</Button>

												<Button
													variant={user.isActive ? "destructive" : "default"}
													size="sm"
													onClick={() => handleToggleStatus(user)}
													className="h-8 px-2.5 text-xs"
												>
													{user.isActive ? "Suspend" : "Activate"}
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
										No users matched the search criteria.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Dialog: Provision Staff User */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<UserPlus className="h-5 w-5 text-primary" />
							Provision Platform Staff User
						</DialogTitle>
						<DialogDescription>
							Create a verified staff user account directly. Super Admins receive
							unrestricted platform governance authority.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wide">
								Full Name
							</label>
							<Input
								placeholder="e.g. Alex Taylor"
								value={newUserName}
								onChange={(e) => setNewUserName(e.target.value)}
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wide">
								Email Address
							</label>
							<Input
								type="email"
								placeholder="staff@devcrm.io"
								value={newUserEmail}
								onChange={(e) => setNewUserEmail(e.target.value)}
							/>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<label className="text-xs font-semibold text-foreground uppercase tracking-wide">
									Initial Password
								</label>
								<button
									type="button"
									onClick={() => setNewUserPassword(generateSecurePassword(16))}
									className="text-xs text-primary hover:underline"
								>
									Generate Strong
								</button>
							</div>
							<Input
								type="text"
								placeholder="Minimum 8 characters"
								value={newUserPassword}
								onChange={(e) => setNewUserPassword(e.target.value)}
								className="font-mono text-xs"
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-foreground uppercase tracking-wide">
								System Role
							</label>
							<select
								value={newUserRole}
								onChange={(e) => setNewUserRole(e.target.value as any)}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
							>
								<option value="USER">Standard User (USER)</option>
								<option value="SUPER_ADMIN">Platform Super Admin (SUPER_ADMIN)</option>
							</select>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setCreateDialogOpen(false)}
							disabled={createStaffMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (!newUserName.trim() || !newUserEmail.trim()) {
									toast.error("Please enter a name and email");
									return;
								}
								if (newUserPassword.length < 8) {
									toast.error("Password must be at least 8 characters");
									return;
								}
								createStaffMutation.mutate({
									name: newUserName,
									email: newUserEmail,
									password: newUserPassword,
									systemRole: newUserRole,
								});
							}}
							disabled={createStaffMutation.isPending}
							className="gap-2"
						>
							{createStaffMutation.isPending ? (
								<>
									<RotateCw className="h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create Staff User"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog: Reset Password */}
			<Dialog
				open={resetPasswordDialogOpen}
				onOpenChange={setResetPasswordDialogOpen}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<KeyRound className="h-5 w-5 text-amber-500" />
							Administrative Password Reset
						</DialogTitle>
						<DialogDescription>
							Set a new password for{" "}
							<span className="font-semibold text-foreground font-mono">
								{selectedUser?.email}
							</span>
							. All active sessions will be terminated immediately.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<label className="text-xs font-semibold text-foreground uppercase tracking-wide">
									New Password
								</label>
								<button
									type="button"
									onClick={() =>
										setResetPasswordValue(generateSecurePassword(16))
									}
									className="text-xs text-primary hover:underline"
								>
									Generate Strong
								</button>
							</div>
							<Input
								type="text"
								placeholder="Enter new password (min 8 chars)"
								value={resetPasswordValue}
								onChange={(e) => setResetPasswordValue(e.target.value)}
								className="font-mono text-xs"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setResetPasswordDialogOpen(false)}
							disabled={resetPasswordMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								if (resetPasswordValue.length < 8) {
									toast.error("Password must be at least 8 characters");
									return;
								}
								resetPasswordMutation.mutate({
									userId: selectedUser.id,
									newPassword: resetPasswordValue,
								});
							}}
							disabled={resetPasswordMutation.isPending}
							className="gap-2"
						>
							{resetPasswordMutation.isPending ? (
								<>
									<RotateCw className="h-4 w-4 animate-spin" />
									Updating...
								</>
							) : (
								"Apply & Invalidate Sessions"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog: Change Role Confirmation */}
			<Dialog
				open={roleChangeDialogOpen}
				onOpenChange={setRoleChangeDialogOpen}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<ShieldAlert className="h-5 w-5 text-purple-500" />
							Change System Role
						</DialogTitle>
						<DialogDescription>
							Update platform authority for{" "}
							<span className="font-semibold text-foreground font-mono">
								{selectedUser?.email}
							</span>
							.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-2">
						<div className="rounded-xl border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
							<p>
								Current Role:{" "}
								<span className="font-bold text-foreground">
									{selectedUser?.systemRole}
								</span>
							</p>
							<p>
								New Target Role:{" "}
								<span className="font-bold text-purple-600 dark:text-purple-400">
									{targetRole}
								</span>
							</p>
						</div>

						{targetRole === "SUPER_ADMIN" ? (
							<p className="text-xs text-amber-600 dark:text-amber-400">
								Warning: Super Admins gain access to all tenants, billing
								gateways, audit trails, and system configuration.
							</p>
						) : (
							<p className="text-xs text-muted-foreground">
								Demoting this user will revoke access to the SuperAdmin console.
							</p>
						)}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setRoleChangeDialogOpen(false)}
							disabled={updateUserRoleMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								updateUserRoleMutation.mutate({
									userId: selectedUser.id,
									systemRole: targetRole,
								});
							}}
							disabled={updateUserRoleMutation.isPending}
							className="gap-2"
						>
							{updateUserRoleMutation.isPending ? (
								<>
									<RotateCw className="h-4 w-4 animate-spin" />
									Updating...
								</>
							) : (
								`Confirm ${targetRole}`
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

