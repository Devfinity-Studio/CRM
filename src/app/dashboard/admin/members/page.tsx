"use client";

import { format } from "date-fns";
import { Loader2, Mail, Trash2, UserPlus, Users } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export default function TenantAdminMembersPage() {
	const [isInviteOpen, setIsInviteOpen] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">(
		"MEMBER",
	);

	const {
		data: members,
		isLoading,
		refetch,
	} = api.settings.getMembers.useQuery();

	const inviteMutation = api.settings.inviteMember.useMutation({
		onSuccess: () => {
			toast.success("Team member added successfully");
			setIsInviteOpen(false);
			setInviteEmail("");
			setInviteRole("MEMBER");
			refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to add member");
		},
	});

	const updateRoleMutation = api.settings.updateMemberRole.useMutation({
		onSuccess: () => {
			toast.success("Member role updated");
			refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update role");
		},
	});

	const removeMemberMutation = api.settings.removeMember.useMutation({
		onSuccess: () => {
			toast.success("Member removed from workspace");
			refetch();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to remove member");
		},
	});

	const handleInviteSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inviteEmail.trim()) return;
		inviteMutation.mutate({
			email: inviteEmail.trim(),
			role: inviteRole,
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h3 className="font-bold text-foreground text-xl tracking-tight">
						Team Members
					</h3>
					<p className="text-muted-foreground text-sm">
						Manage member access roles, workspace seats, and member invitations.
					</p>
				</div>

				<Dialog onOpenChange={setIsInviteOpen} open={isInviteOpen}>
					<DialogTrigger asChild>
						<Button className="font-semibold shadow-xs">
							<UserPlus className="mr-2 h-4 w-4" />
							Add Member
						</Button>
					</DialogTrigger>
					<DialogContent>
						<form onSubmit={handleInviteSubmit}>
							<DialogHeader>
								<DialogTitle>Add Team Member</DialogTitle>
								<DialogDescription>
									Invite a colleague to collaborate in this workspace.
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor="email">Email Address</Label>
									<Input
										autoFocus
										id="email"
										onChange={(e) => setInviteEmail(e.target.value)}
										placeholder="colleague@company.com"
										type="email"
										value={inviteEmail}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="role">Workspace Role</Label>
									<Select
										defaultValue="MEMBER"
										onValueChange={(val: "ADMIN" | "MEMBER" | "VIEWER") =>
											setInviteRole(val)
										}
										value={inviteRole}
									>
										<SelectTrigger id="role">
											<SelectValue placeholder="Select role" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ADMIN">
												Admin (Full administrative access)
											</SelectItem>
											<SelectItem value="MEMBER">
												Member (Standard CRM access)
											</SelectItem>
											<SelectItem value="VIEWER">
												Viewer (Read-only access)
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<Button
									onClick={() => setIsInviteOpen(false)}
									type="button"
									variant="outline"
								>
									Cancel
								</Button>
								<Button
									disabled={!inviteEmail.trim() || inviteMutation.isPending}
									type="submit"
								>
									{inviteMutation.isPending ? "Adding Member..." : "Add Member"}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
				<CardHeader className="border-border/60 border-b pb-4">
					<div className="flex items-center gap-2">
						<Users className="h-4 w-4 text-primary" />
						<CardTitle className="font-bold text-base text-foreground sm:text-lg">
							Workspace Seats ({members?.length || 0})
						</CardTitle>
					</div>
					<CardDescription className="text-muted-foreground text-xs">
						Active users who have permission to access deals, contacts, and
						invoices.
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Joined</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell
										className="h-28 text-center text-muted-foreground"
										colSpan={4}
									>
										<div className="flex items-center justify-center gap-2">
											<Loader2 className="h-4 w-4 animate-spin text-primary" />
											<span>Loading workspace team...</span>
										</div>
									</TableCell>
								</TableRow>
							) : members?.length === 0 ? (
								<TableRow>
									<TableCell
										className="h-28 text-center text-muted-foreground"
										colSpan={4}
									>
										No team members found.
									</TableCell>
								</TableRow>
							) : (
								members?.map((member) => (
									<TableRow key={member.id}>
										<TableCell>
											<div className="flex items-center gap-3">
												<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 font-bold text-primary text-xs border border-border">
													{member.userName?.slice(0, 2).toUpperCase() || "U"}
												</div>
												<div>
													<p className="font-semibold text-foreground text-sm">
														{member.userName || "Unnamed User"}
													</p>
													<p className="flex items-center gap-1 text-muted-foreground text-xs">
														<Mail className="h-3 w-3" />
														{member.userEmail}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell>
											{member.role === "OWNER" ? (
												<Badge
													className="font-bold text-xs uppercase tracking-wider"
													variant="default"
												>
													OWNER
												</Badge>
											) : (
												<Select
													defaultValue={member.role}
													disabled={updateRoleMutation.isPending}
													onValueChange={(
														val: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER",
													) => {
														updateRoleMutation.mutate({
															memberId: member.id,
															role: val,
														});
													}}
													value={member.role}
												>
													<SelectTrigger className="h-8 w-[120px] font-semibold text-xs">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="ADMIN">ADMIN</SelectItem>
														<SelectItem value="MEMBER">MEMBER</SelectItem>
														<SelectItem value="VIEWER">VIEWER</SelectItem>
													</SelectContent>
												</Select>
											)}
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">
											{member.createdAt
												? format(new Date(member.createdAt), "MMM d, yyyy")
												: "—"}
										</TableCell>
										<TableCell className="text-right">
											{member.role !== "OWNER" && (
												<Button
													className="text-destructive hover:bg-destructive/10"
													disabled={removeMemberMutation.isPending}
													onClick={() => {
														if (
															confirm(
																`Are you sure you want to remove ${member.userName || member.userEmail} from this workspace?`,
															)
														) {
															removeMemberMutation.mutate({
																memberId: member.id,
															});
														}
													}}
													size="icon"
													variant="ghost"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
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
