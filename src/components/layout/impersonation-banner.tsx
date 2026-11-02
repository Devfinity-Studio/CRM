"use client";

import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export function ImpersonationBanner({
	impersonatedOrgId,
	impersonatedOrgName,
}: {
	impersonatedOrgId: string;
	impersonatedOrgName?: string | null;
}) {
	const router = useRouter();
	const stopImpersonation = api.superadmin.stopImpersonation.useMutation({
		onSuccess: () => {
			router.push("/superadmin/tenants");
			router.refresh();
		},
	});

	return (
		<div className="relative z-50 flex flex-wrap items-center justify-between gap-2 bg-amber-600 px-4 py-2 font-medium text-sm text-white shadow-md">
			<div className="flex items-center gap-2">
				<ShieldAlert className="h-4 w-4 shrink-0" />
				<span>
					Viewing workspace as Super Admin impersonator:{" "}
					<strong>{impersonatedOrgName || impersonatedOrgId}</strong>. All tenant mutations and telemetry reflect this workspace.
				</span>
			</div>
			<Button
				className="border-0 bg-white text-amber-700 shadow-sm hover:bg-zinc-100 hover:text-amber-800"
				disabled={stopImpersonation.isPending}
				onClick={() => stopImpersonation.mutate()}
				size="sm"
				variant="outline"
			>
				{stopImpersonation.isPending ? "Exiting..." : "Exit Impersonation"}
			</Button>
		</div>
	);
}
