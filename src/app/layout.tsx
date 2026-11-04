import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
	title: "DevCRM - Flagship B2B CRM & Revenue Platform",
	description:
		"Modern B2B CRM, Sales Pipeline Kanban, Multi-currency Invoicing, and Workflow Automations.",
	manifest: "/site.webmanifest",
	icons: {
		icon: [
			{ url: "/favicon.ico" },
			{ url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
			{
				url: "/favicons/android-chrome-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				url: "/favicons/android-chrome-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
		apple: [
			{
				url: "/favicons/apple-touch-icon.png",
				sizes: "180x180",
				type: "image/png",
			},
		],
		shortcut: ["/favicon.ico"],
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#090d16" },
	],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${geist.variable}`} lang="en">
			<body className="bg-background text-foreground flex min-h-dvh flex-col">
				<TRPCReactProvider>
					<TooltipProvider delayDuration={150}>
						<div className="flex min-h-dvh flex-1 flex-col">{children}</div>
					</TooltipProvider>
				</TRPCReactProvider>
				<Toaster />
			</body>
		</html>
	);
}
