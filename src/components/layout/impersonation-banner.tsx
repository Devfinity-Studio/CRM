"use client";

import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export function ImpersonationBanner({
	impersonatedOrgId,
}: {
	impersonatedOrgId: string;
}) {
	const router = useRouter();
	const stopImpersonation = api.superadmin.stopImpersonation.useMutation({
		onSuccess: () => {
			router.push("/admin/organizations");
			router.refresh();
		},
	});

	return (
		<div className="relative z-50 flex items-center justify-between bg-red-600 px-4 py-2 font-medium text-sm text-white shadow-md">
			<div className="flex items-center gap-2">
				<ShieldAlert className="h-4 w-4" />
				<span>
					You are currently impersonating an organization ({impersonatedOrgId}).
					All actions are being performed as this organization.
				</span>
			</div>
			<Button
				className="border-0 bg-white text-red-600 shadow-sm hover:bg-zinc-100 hover:text-red-700"
				disabled={stopImpersonation.isPending}
				onClick={() => stopImpersonation.mutate()}
				size="sm"
				variant="outline"
			>
				{stopImpersonation.isPending ? "Stopping..." : "Stop Impersonating"}
			</Button>
		</div>
	);
}
