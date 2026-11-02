"use client";

import { AlertCircle } from "lucide-react";
import React, { use } from "react";
import { DocumentViewer } from "~/components/public/document-viewer";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { api } from "~/trpc/react";

export default function PublicQuotePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);

	const { data, isLoading, error } = api.public.getPublicQuote.useQuery(
		{
			id: resolvedParams.id,
		},
		{
			retry: false,
		},
	);

	if (isLoading) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-background">
				<div className="animate-pulse text-xs font-medium text-muted-foreground">Loading Proposal Document...</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex min-h-dvh items-center justify-center bg-background p-4">
				<Alert className="max-w-md rounded-2xl border-destructive/20 bg-destructive/10" variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error Loading Quote</AlertTitle>
					<AlertDescription className="text-xs">
						{error?.message ||
							"This quote could not be found or is not available for public viewing."}
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="min-h-dvh bg-background px-4 py-8">
			<DocumentViewer data={data} type="quote" />
		</div>
	);
}
