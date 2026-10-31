import Link from "next/link";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { auth } from "~/server/auth";

export default async function MarketingPage() {
	const session = await auth();

	const mockCampaigns = [
		{
			id: "1",
			name: "Q3 Developer Search Ads",
			platform: "Google Ads",
			spend: "$4,500",
			clicks: 3200,
			conversions: 140,
			cpl: "$32.14",
		},
		{
			id: "2",
			name: "SaaS Enterprise Retargeting",
			platform: "LinkedIn Ads",
			spend: "$8,200",
			clicks: 1100,
			conversions: 65,
			cpl: "$126.15",
		},
		{
			id: "3",
			name: "Dev Tools Community Promo",
			platform: "Twitter/X",
			spend: "$1,800",
			clicks: 4500,
			conversions: 210,
			cpl: "$8.57",
		},
	];

	return (
		<DashboardLayout
			userEmail={session?.user?.email || "marketing@devcrm.io"}
			userName={session?.user?.name || "Marketing Manager"}
			userRole={session?.user?.systemRole || "USER"}
		>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-2xl text-white tracking-tight">
							Ad Campaigns & ROI Analytics
						</h2>
						<p className="text-slate-400 text-sm">
							Track multi-channel ad spend, lead conversions, Cost Per Lead
							(CPL), and acquisition ROI.
						</p>
					</div>
					<Button>+ Connect New Campaign</Button>
				</div>

				{/* Marketing KPI Metrics */}
				<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
					<Card className="border-slate-800 bg-slate-900/60">
						<CardHeader className="py-3">
							<CardTitle className="font-mono text-slate-400 text-xs uppercase">
								Total Ad Spend
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-white">$14,500</div>
						</CardContent>
					</Card>
					<Card className="border-slate-800 bg-slate-900/60">
						<CardHeader className="py-3">
							<CardTitle className="font-mono text-slate-400 text-xs uppercase">
								Total Leads Captured
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-blue-400">415 Leads</div>
						</CardContent>
					</Card>
					<Card className="border-slate-800 bg-slate-900/60">
						<CardHeader className="py-3">
							<CardTitle className="font-mono text-slate-400 text-xs uppercase">
								Average CPL
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-emerald-400">$34.93</div>
						</CardContent>
					</Card>
					<Card className="border-slate-800 bg-slate-900/60">
						<CardHeader className="py-3">
							<CardTitle className="font-mono text-slate-400 text-xs uppercase">
								Blended CAC
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-purple-400">$215.00</div>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Active Ad Campaigns</CardTitle>
					</CardHeader>
					<CardContent>
						<table className="w-full text-left text-slate-300 text-sm">
							<thead className="border-slate-800 border-b bg-slate-950/50 text-slate-400 text-xs uppercase">
								<tr>
									<th className="p-3">Campaign Name</th>
									<th className="p-3">Platform</th>
									<th className="p-3">Spend</th>
									<th className="p-3">Clicks</th>
									<th className="p-3">Conversions</th>
									<th className="p-3">Cost / Lead (CPL)</th>
								</tr>
							</thead>
							<tbody>
								{mockCampaigns.map((c) => (
									<tr
										className="border-slate-800/50 border-b hover:bg-slate-800/30"
										key={c.id}
									>
										<td className="p-3 font-medium text-white">{c.name}</td>
										<td className="p-3">
											<Badge variant="outline">{c.platform}</Badge>
										</td>
										<td className="p-3 font-bold text-white">{c.spend}</td>
										<td className="p-3">{c.clicks.toLocaleString()}</td>
										<td className="p-3 font-bold text-blue-400">
											{c.conversions}
										</td>
										<td className="p-3 font-bold text-emerald-400">{c.cpl}</td>
									</tr>
								))}
							</tbody>
						</table>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
