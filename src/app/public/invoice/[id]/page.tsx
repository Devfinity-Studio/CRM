"use client";

import { AlertCircle } from "lucide-react";
import React, { use } from "react";
import { DocumentViewer } from "~/components/public/document-viewer";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { api } from "~/trpc/react";

export default function PublicInvoicePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const resolvedParams = use(params);

	const { data, isLoading, error } = api.public.getPublicInvoice.useQuery(
		{
			id: resolvedParams.id,
		},
		{
			retry: false,
		},
	);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-50">
				<div className="animate-pulse text-slate-500">Loading Document...</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
				<Alert className="max-w-md" variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>
						{error?.message ||
							"This invoice could not be found or is not available for public viewing."}
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 px-4 py-8">
			<DocumentViewer data={data} type="invoice" />
		</div>
	);
}
