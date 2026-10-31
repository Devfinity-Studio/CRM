import { NextResponse } from "next/server";
import { createTRPCContext } from "~/server/api/trpc";

export async function GET(req: Request) {
	// Use the TRPC Context creation which now handles API keys
	const ctx = await createTRPCContext({ headers: req.headers });

	if (!ctx.session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	return NextResponse.json({
		message: "Authenticated successfully",
		user: {
			id: ctx.session.user.id,
			name: ctx.session.user.name,
			email: ctx.session.user.email,
			organizationId: ctx.session.user.organizationId,
		},
	});
}
