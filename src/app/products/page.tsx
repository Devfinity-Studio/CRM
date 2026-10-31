import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { InfoTooltip } from "~/components/ui/tooltip-info";
import { auth } from "~/server/auth";

export default async function ProductsPage() {
	const session = await auth();

	const mockProducts = [
		{
			id: "1",
			name: "Developer API Pro Tier",
			sku: "API-PRO-01",
			price: "$499/mo",
			stock: 999,
		},
		{
			id: "2",
			name: "Custom SDK Integration Package",
			sku: "SDK-INT-02",
			price: "$2,500",
			stock: 45,
		},
		{
			id: "3",
			name: "Enterprise Support SLA (1 Year)",
			sku: "SUP-ENT-03",
			price: "$12,000",
			stock: 10,
		},
	];

	return (
		<DashboardLayout
			userEmail={session?.user?.email || "user@devcrm.io"}
			userName={session?.user?.name || "CRM Admin"}
			userRole={session?.user?.systemRole || "USER"}
		>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-2xl text-white tracking-tight">
							Products & Services Catalog
						</h2>
						<p className="text-slate-400 text-sm">
							Manage inventory stock, pricing tiers, and SKUs.
						</p>
					</div>
					<Button>+ Add Product / Service</Button>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Catalog Items</CardTitle>
					</CardHeader>
					<CardContent>
						{mockProducts.length === 0 ? (
							<EmptyState
								action={
									<Button>
										<Plus className="mr-2 h-4 w-4" /> Add Product / Service
									</Button>
								}
								description="Your product catalog is empty. Add items to start generating quotes and invoices."
								icon={Package}
								title="No products found"
							/>
						) : (
							<table className="w-full text-left text-slate-300 text-sm">
								<thead className="border-slate-800 border-b bg-slate-950/50 text-slate-400 text-xs uppercase">
									<tr>
										<th className="p-3">Product Name</th>
										<th className="p-3">
											SKU
											<InfoTooltip content="Stock Keeping Unit: a unique identifier for this product/service." />
										</th>
										<th className="p-3">Unit Price</th>
										<th className="p-3">Stock Quantity</th>
										<th className="p-3 text-right">Actions</th>
									</tr>
								</thead>
								<tbody>
									{mockProducts.map((p) => (
										<tr
											className="border-slate-800/50 border-b hover:bg-slate-800/30"
											key={p.id}
										>
											<td className="p-3 font-medium text-white">{p.name}</td>
											<td className="p-3 font-mono text-slate-400 text-xs">
												{p.sku}
											</td>
											<td className="p-3 font-bold text-emerald-400">
												{p.price}
											</td>
											<td className="p-3">{p.stock} units</td>
											<td className="p-3 text-right">
												<Button size="sm" variant="ghost">
													Edit Item
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
