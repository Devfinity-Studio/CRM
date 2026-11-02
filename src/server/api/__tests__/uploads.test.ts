import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock AWS S3 client and presigner
vi.mock("@aws-sdk/s3-request-presigner", () => ({
	getSignedUrl: vi
		.fn()
		.mockResolvedValue(
			"https://uploads.storage.neon.tech/presigned-upload-url",
		),
}));

vi.mock("@aws-sdk/client-s3", () => {
	class MockS3Client {
		send = vi.fn().mockResolvedValue({});
	}
	class MockPutObjectCommand {
		constructor(public input: any) {}
	}
	return {
		S3Client: MockS3Client,
		PutObjectCommand: MockPutObjectCommand,
	};
});

// Mock auth before importing appRouter
vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
	handlers: {},
	signIn: vi.fn(),
	signOut: vi.fn(),
}));

// Mock DB
vi.mock("~/server/db", () => ({
	db: {
		query: {
			organizationMembers: {
				findFirst: vi.fn(),
			},
		},
	},
}));

import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("Uploads Router", () => {
	const mockUser = {
		id: "user-uploads-1",
		email: "uploader@devcrm.io",
		name: "File Uploader",
		systemRole: "USER" as const,
		organizationId: "org-uploads-300",
	};

	const createCaller = appRouter.createCaller;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should generate a presigned upload URL and public URL scoped to organization", async () => {
		vi.mocked(db.query.organizationMembers.findFirst).mockResolvedValue({
			organizationId: "org-uploads-300",
			userId: "user-uploads-1",
			role: "OWNER",
		} as any);

		const caller = createCaller({
			session: {
				user: mockUser,
				expires: "2099-01-01",
			},
			db: db as any,
		});

		const result = await caller.uploads.getPresignedUrl({
			filename: "my-contract.pdf",
			contentType: "application/pdf",
			folder: "contracts",
		});

		expect(result).toBeDefined();
		expect(result.uploadUrl).toBe(
			"https://uploads.storage.neon.tech/presigned-upload-url",
		);
		expect(result.key).toContain("org-uploads-300/contracts/");
		expect(result.key).toContain("my-contract.pdf");
		expect(result.publicUrl).toBeDefined();
	});
});

