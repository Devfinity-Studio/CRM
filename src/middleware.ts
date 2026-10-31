import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "~/server/auth";

const protectedRoutes = [
	"/dashboard",
	"/admin",
	"/clients",
	"/pipeline",
	"/billing",
	"/products",
	"/marketing",
	"/tasks",
];

const authRoutes = ["/login", "/register"];

export default auth((req) => {
	const isLoggedIn = !!req.auth;
	const { nextUrl } = req;

	const isProtectedRoute = protectedRoutes.some((route) =>
		nextUrl.pathname.startsWith(route),
	);

	const isAuthRoute = authRoutes.some((route) =>
		nextUrl.pathname.startsWith(route),
	);

	if (isProtectedRoute && !isLoggedIn) {
		return NextResponse.redirect(new URL("/login", nextUrl));
	}

	if (isAuthRoute && isLoggedIn) {
		return NextResponse.redirect(new URL("/dashboard", nextUrl));
	}

	return NextResponse.next();
});

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
