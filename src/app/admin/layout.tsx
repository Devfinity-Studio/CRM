import { redirect } from "next/navigation";
import { SuperAdminLayout } from "~/components/layout/superadmin-layout";
import { auth } from "~/server/auth";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	// Strict guard for Super Admin
	if (session.user.systemRole !== "SUPER_ADMIN") {
		redirect("/dashboard");
	}

	return (
		<SuperAdminLayout
			userEmail={session.user.email ?? undefined}
			userName={session.user.name ?? undefined}
		>
			{children}
		</SuperAdminLayout>
	);
}
