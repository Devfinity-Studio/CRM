import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/server/db";
import { apiKeys, companies, organizations } from "~/server/db/schema";

const leadSchema = z.object({
	organizationId: z.string().optional(),
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().optional(),
	email: z.string().email("Valid email is required"),
	phone: z.string().optional(),
	jobTitle: z.string().optional(),
});

export async function POST(req: Request) {
	try {
		const authHeader = req.headers.get("authorization");
		const apiKeyHeader = req.headers.get("x-api-key");
		const rawKey =
			apiKeyHeader ||
			(authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null);

		if (!rawKey) {
			return NextResponse.json(
				{ error: "Unauthorized: Missing API key or Bearer token" },
				{ status: 401 },
			);
		}

		const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
		const keyRecord = await db.query.apiKeys.findFirst({
			where: and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)),
		});

		if (!keyRecord) {
			return NextResponse.json(
				{ error: "Unauthorized: Invalid or revoked API key" },
				{ status: 401 },
			);
		}

		const body = await req.json();
		const parseResult = leadSchema.safeParse(body);
		if (!parseResult.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: parseResult.error.flatten().fieldErrors,
				},
				{ status: 400 },
			);
		}

		const validated = parseResult.data;
		const targetOrgId = keyRecord.organizationId;

		if (validated.organizationId && validated.organizationId !== targetOrgId) {
			return NextResponse.json(
				{ error: "Forbidden: API key does not match requested organization" },
				{ status: 403 },
			);
		}

		const org = await db.query.organizations.findFirst({
			where: eq(organizations.id, targetOrgId),
		});

		if (!org || !org.isActive) {
			return NextResponse.json(
				{ error: "Organization not found or inactive" },
				{ status: 404 },
			);
		}

		const [lead] = await db
			.insert(companies)
			.values({
				organizationId: targetOrgId,
				name: `${validated.firstName} ${validated.lastName || ""}`.trim(),
				email: validated.email,
				phone: validated.phone || null,
				clientType: "INDIVIDUAL",
				taxTreatment: "CONSUMER",
			})
			.returning();

		return NextResponse.json({ success: true, lead }, { status: 201 });
	} catch (error) {
		console.error("Lead ingestion error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
