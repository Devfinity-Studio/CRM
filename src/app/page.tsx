import Link from "next/link";

import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
	return (
		<HydrateClient>
			<main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
				<div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 text-center">
					<h1 className="font-extrabold text-5xl text-blue-500 tracking-tight sm:text-6xl">
						Dev<span className="text-white">CRM</span>
					</h1>
					<p className="max-w-lg text-lg text-slate-400">
						Multi-Tenant Customer Relationship & SaaS Subscription Platform
					</p>

					<div className="flex gap-4">
						<Link
							className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
							href="/admin"
						>
							Super Admin Portal →
						</Link>
						<Link
							className="rounded-lg border border-slate-800 bg-slate-900 px-6 py-3 font-semibold text-slate-200 transition hover:bg-slate-800"
							href="/dashboard"
						>
							Client Workspace →
						</Link>
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}
