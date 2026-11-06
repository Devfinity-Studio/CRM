import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/server/auth";

const protectedRoutes = [
	"/dashboard",
	"/admin",
	"/superadmin",
	"/deals",
	"/clients",
	"/pipeline",
	"/billing",
	"/products",
	"/inventory",
	"/automations",
	"/marketing",
	"/tasks",
	"/settings",
	"/onboarding",
];

const authRoutes = ["/login", "/register"];

export default auth((req) => {
	const isLoggedIn = !!req.auth;
	const isSuperAdmin = req.auth?.user?.systemRole === "SUPER_ADMIN";
	const { nextUrl } = req;

	const isSuperAdminRoute =
		nextUrl.pathname.startsWith("/superadmin") ||
		nextUrl.pathname.startsWith("/admin");

	const isProtectedRoute = protectedRoutes.some((route) =>
		nextUrl.pathname.startsWith(route),
	);

	const isAuthRoute = authRoutes.some((route) =>
		nextUrl.pathname.startsWith(route),
	);

	if (isProtectedRoute && !isLoggedIn) {
		return NextResponse.redirect(new URL("/login", nextUrl));
	}

	if (isSuperAdminRoute && (!isLoggedIn || !isSuperAdmin)) {
		return NextResponse.redirect(
			new URL(isLoggedIn ? "/dashboard" : "/login", nextUrl),
		);
	}

	if (isAuthRoute && isLoggedIn) {
		return NextResponse.redirect(new URL("/dashboard", nextUrl));
	}

	return NextResponse.next();
});

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
