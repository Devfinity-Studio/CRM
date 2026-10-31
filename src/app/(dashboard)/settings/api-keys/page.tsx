"use client";

import { format } from "date-fns";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export default function ApiKeysPage() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [keyName, setKeyName] = useState("");
	const [newKey, setNewKey] = useState<{ rawKey: string; name: string } | null>(
		null,
	);

	const utils = api.useUtils();
	const { data: apiKeys, isLoading } = api.apiKeys.list.useQuery();

	const createKeyMutation = api.apiKeys.create.useMutation({
		onSuccess: (data) => {
			setNewKey(data);
			utils.apiKeys.list.invalidate();
			setKeyName("");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create API key");
		},
	});

	const revokeKeyMutation = api.apiKeys.revoke.useMutation({
		onSuccess: () => {
			toast.success("API key revoked");
			utils.apiKeys.list.invalidate();
		},
		onError: (err) => {
			toast.error(err.message || "Failed to revoke API key");
		},
	});

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		if (!keyName.trim()) return;
		createKeyMutation.mutate({ name: keyName });
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Copied to clipboard!");
		} catch (err) {
			toast.error("Failed to copy");
		}
	};

	const handleCloseDialog = () => {
		setIsCreateOpen(false);
		// Only clear the new key when the dialog is actually closed
		// so we don't flash empty state during the exit animation
		setTimeout(() => setNewKey(null), 300);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-lg">API Keys</h3>
					<p className="text-muted-foreground text-sm">
						Manage API keys for programmatic access to your DevCRM account.
					</p>
				</div>

				<Dialog onOpenChange={setIsCreateOpen} open={isCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Generate New Key
						</Button>
					</DialogTrigger>
					<DialogContent>
						{!newKey ? (
							<form onSubmit={handleCreate}>
								<DialogHeader>
									<DialogTitle>Generate New API Key</DialogTitle>
									<DialogDescription>
										This key will allow access to your DevCRM data. Keep it
										secure.
									</DialogDescription>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="grid gap-2">
										<Label htmlFor="name">Key Name</Label>
										<Input
											autoFocus
											id="name"
											onChange={(e) => setKeyName(e.target.value)}
											placeholder="e.g. Production Server, Zapier Integration"
											value={keyName}
										/>
									</div>
								</div>
								<DialogFooter>
									<Button
										onClick={() => setIsCreateOpen(false)}
										type="button"
										variant="outline"
									>
										Cancel
									</Button>
									<Button
										disabled={!keyName.trim() || createKeyMutation.isPending}
										type="submit"
									>
										{createKeyMutation.isPending ? "Generating..." : "Generate"}
									</Button>
								</DialogFooter>
							</form>
						) : (
							<div>
								<DialogHeader>
									<DialogTitle>API Key Generated</DialogTitle>
									<DialogDescription className="font-semibold text-destructive">
										Please copy this key now. You won't be able to see it again!
									</DialogDescription>
								</DialogHeader>
								<div className="py-6">
									<div className="flex items-center space-x-2">
										<Input
											className="font-mono"
											readOnly
											value={newKey.rawKey}
										/>
										<Button
											onClick={() => copyToClipboard(newKey.rawKey)}
											size="icon"
											type="button"
											variant="secondary"
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
								</div>
								<DialogFooter>
									<Button onClick={handleCloseDialog}>
										I have copied it safely
									</Button>
								</DialogFooter>
							</div>
						)}
					</DialogContent>
				</Dialog>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell className="h-24 text-center" colSpan={3}>
									Loading API keys...
								</TableCell>
							</TableRow>
						) : apiKeys?.length === 0 ? (
							<TableRow>
								<TableCell
									className="h-24 text-center text-muted-foreground"
									colSpan={3}
								>
									No API keys generated yet.
								</TableCell>
							</TableRow>
						) : (
							apiKeys?.map((apiKey) => (
								<TableRow key={apiKey.id}>
									<TableCell className="font-medium">{apiKey.name}</TableCell>
									<TableCell>
										{format(new Date(apiKey.createdAt), "MMM d, yyyy")}
									</TableCell>
									<TableCell className="text-right">
										<Button
											className="text-destructive hover:bg-destructive/10"
											disabled={revokeKeyMutation.isPending}
											onClick={() => {
												if (
													confirm(
														`Are you sure you want to revoke the key "${apiKey.name}"?`,
													)
												) {
													revokeKeyMutation.mutate({ id: apiKey.id });
												}
											}}
											size="icon"
											variant="ghost"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
