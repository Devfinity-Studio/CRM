"use client";

import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
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

export default function AdsPage() {
	const session = useSession()?.data;
	const orgId = session?.user?.organizationId as string;

	const {
		data: campaigns,
		isLoading,
		refetch,
	} = api.marketing.getCampaigns.useQuery(
		{ organizationId: orgId },
		{
			enabled: !!orgId,
		},
	);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [name, setName] = useState("");
	const [platform, setPlatform] = useState("GOOGLE_ADS");
	const [spend, setSpend] = useState("0");

	const createMutation = api.marketing.createCampaign.useMutation({
		onSuccess: () => {
			toast.success("Campaign created.");
			setDialogOpen(false);
			setName("");
			setSpend("0");
			refetch();
		},
		onError: (err) => toast.error(err.message),
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate({
			organizationId: orgId,
			name,
			platform,
			spend: parseFloat(spend) * 100, // convert to cents
		});
	};

	return (
		<DashboardLayout>
			<div className="mx-auto flex max-w-[1700px] flex-col gap-6 pb-12">
				{/* Header Section */}
				<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
									Ad Integrations
								</span>
								<span className="text-muted-foreground text-xs">
									Attribution & Webhook Tracking
								</span>
							</div>
							<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Ad Campaigns & ROAS
							</h1>
							<p className="text-muted-foreground text-xs sm:text-sm">
								Track conversions, generated leads, and spend efficiency across advertising networks.
							</p>
						</div>
						<Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
							<DialogTrigger asChild>
								<Button className="gap-2 rounded-xl min-h-[44px] sm:min-h-0">
									<Plus className="h-4 w-4" />
									<span>Connect Campaign</span>
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Connect Ad Campaign</DialogTitle>
									<DialogDescription className="text-xs">
										Configure a campaign name and initial budget attribution.
									</DialogDescription>
								</DialogHeader>
								<form className="space-y-4 py-2" onSubmit={handleSubmit}>
									<div className="space-y-1.5">
										<Label className="text-xs">Campaign Name</Label>
										<Input
											className="h-10 text-sm"
											onChange={(e) => setName(e.target.value)}
											placeholder="e.g. Q3 Search Retargeting"
											required
											value={name}
										/>
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs">Platform</Label>
										<Select onValueChange={setPlatform} value={platform}>
											<SelectTrigger className="h-10">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
												<SelectItem value="FACEBOOK_ADS">Facebook Ads</SelectItem>
												<SelectItem value="LINKEDIN_ADS">LinkedIn Ads</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs">Initial Spend ($)</Label>
										<Input
											className="h-10 text-sm"
											min="0"
											onChange={(e) => setSpend(e.target.value)}
											required
											step="0.01"
											type="number"
											value={spend}
										/>
									</div>
									<DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
										<Button
											className="min-h-[44px] sm:min-h-0"
											onClick={() => setDialogOpen(false)}
											type="button"
											variant="outline"
										>
											Cancel
										</Button>
										<Button
											className="min-h-[44px] sm:min-h-0"
											disabled={createMutation.isPending}
											type="submit"
										>
											{createMutation.isPending ? "Connecting..." : "Connect"}
										</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
					</div>
				</section>

				<Card className="rounded-3xl border border-border/70 bg-card/75 shadow-sm backdrop-blur-md">
					<CardHeader className="p-4 sm:p-6 pb-2">
						<CardTitle className="text-lg font-bold">Active Ad Campaigns</CardTitle>
						<CardDescription className="text-xs">
							All ad campaigns linked via Webhook integration. Webhook endpoint:{" "}
							<code className="font-mono text-primary bg-muted px-1.5 py-0.5 rounded">/api/webhooks/ads</code>
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0 sm:p-6 sm:pt-0">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow className="border-border/60">
										<TableHead className="text-xs font-semibold">Campaign</TableHead>
										<TableHead className="text-xs font-semibold">Platform</TableHead>
										<TableHead className="text-xs font-semibold">Spend</TableHead>
										<TableHead className="text-xs font-semibold">Leads Generated</TableHead>
										<TableHead className="text-xs font-semibold text-right">Cost per Lead (CPL)</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{isLoading ? (
										<TableRow>
											<TableCell className="h-28 text-center text-muted-foreground text-xs" colSpan={5}>
												Loading campaigns...
											</TableCell>
										</TableRow>
									) : campaigns?.length === 0 ? (
										<TableRow>
											<TableCell
												className="h-28 text-center text-muted-foreground text-xs"
												colSpan={5}
											>
												No campaigns connected yet. Click Connect Campaign above to get started.
											</TableCell>
										</TableRow>
									) : (
										campaigns?.map((c) => (
											<TableRow className="border-border/60 hover:bg-accent/40" key={c.id}>
												<TableCell className="font-semibold text-foreground text-xs">
													{c.name}
												</TableCell>
												<TableCell className="text-xs">
													<Badge variant="outline">{c.platform}</Badge>
												</TableCell>
												<TableCell className="font-mono font-bold text-foreground text-xs tabular-nums">
													${(c.spend / 100).toFixed(2)}
												</TableCell>
												<TableCell className="font-mono font-bold text-sky-500 text-xs tabular-nums">
													{c.conversions}
												</TableCell>
												<TableCell className="font-mono font-bold text-emerald-500 text-xs text-right tabular-nums">
													${c.cpl}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
