import { Inter } from "next/font/google";
import type React from "react";
import { TRPCReactProvider } from "~/trpc/react";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
});

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className={`min-h-dvh bg-background text-foreground font-sans ${inter.variable}`}>
			<TRPCReactProvider>{children}</TRPCReactProvider>
		</div>
	);
}
