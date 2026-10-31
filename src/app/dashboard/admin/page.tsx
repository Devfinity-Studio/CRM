import { redirect } from "next/navigation";

export default function TenantAdminIndex() {
	redirect("/dashboard/admin/workspace");
}
