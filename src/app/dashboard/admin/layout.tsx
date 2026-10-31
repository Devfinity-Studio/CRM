import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { organizationMembers } from "~/server/db/schema";
import { TenantAdminLayout } from "./client-layout";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	if (!session?.user) {
		redirect("/login");
	}

	// We need to check if they are OWNER or ADMIN
	const member = await db.query.organizationMembers.findFirst({
		where: eq(organizationMembers.userId, session.user.id),
	});

	if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
		redirect("/dashboard");
	}

	return (
		<DashboardLayout>
			<TenantAdminLayout>{children}</TenantAdminLayout>
		</DashboardLayout>
	);
}
