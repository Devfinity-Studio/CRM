import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { companies } from "~/server/db/schema";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { organizationId, firstName, lastName, email, phone, jobTitle } =
			body;

		if (!organizationId || !firstName || !lastName || !email) {
			return NextResponse.json(
				{ error: "Missing required lead fields." },
				{ status: 400 },
			);
		}

		const [lead] = await db
			.insert(companies)
			.values({
				organizationId,
				name: `${firstName} ${lastName}`.trim(),
				email,
				phone: phone || null,
				clientType: "INDIVIDUAL",
				taxTreatment: "CONSUMER",
			})
			.returning();

		return NextResponse.json({ success: true, lead }, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
