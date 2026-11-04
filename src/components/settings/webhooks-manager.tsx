"use client";

import { Loader2 } from "lucide-react";
import React from "react";
import { api } from "~/trpc/react";

export function WebhooksManager() {
	const { data, isLoading, error } = api.webhooks.getAppPortalUrl.useQuery(
		undefined,
		{
			refetchOnWindowFocus: false,
		},
	);

	return (
		<div className="h-[calc(100vh-220px)] min-h-[500px] space-y-6">
			<div>
				<h3 className="font-bold text-foreground text-xl tracking-tight">
					Outbound Webhooks
				</h3>
				<p className="text-muted-foreground text-sm">
					Configure webhook endpoints to receive real-time events from your CRM
					(powered by Svix).
				</p>
			</div>

			{isLoading ? (
				<div className="flex h-64 items-center justify-center rounded-2xl border border-border border-dashed bg-card/50">
					<div className="flex flex-col items-center gap-2 text-muted-foreground">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="font-medium text-sm">
							Provisioning Webhooks Portal...
						</p>
					</div>
				</div>
			) : error ? (
				<div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-destructive/50 bg-destructive/10 p-6 text-destructive">
					<p className="font-semibold">Failed to load webhooks portal.</p>
					<p className="text-xs opacity-90 sm:text-sm">{error.message}</p>
				</div>
			) : data?.url ? (
				<div className="h-full w-full overflow-hidden rounded-2xl border border-border shadow-sm">
					<iframe
						allow="clipboard-write"
						className="h-full w-full border-0"
						src={data.url}
						title="Svix Webhooks Portal"
					/>
				</div>
			) : (
				<div className="flex h-64 items-center justify-center rounded-2xl border border-border border-dashed">
					<p className="text-muted-foreground text-sm">
						Could not generate portal URL. Please check Svix configuration.
					</p>
				</div>
			)}
		</div>
	);
}
