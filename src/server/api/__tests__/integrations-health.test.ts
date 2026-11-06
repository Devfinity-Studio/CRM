import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSend, mockAppList } = vi.hoisted(() => ({
	mockSend: vi.fn(),
	mockAppList: vi.fn(),
}));

// Mock env
vi.mock("~/env", () => ({
	env: {
		DODO_PAYMENTS_API_KEY: "test_dodo_key",
		DODO_PAYMENTS_WEBHOOK_KEY: "whsec_test",
		DODO_PAYMENTS_ENVIRONMENT: "test_mode",
		SVIX_TOKEN: "test_sk_valid_live_token",
		S3_BUCKET_NAME: "test-devcrm-bucket",
		S3_REGION: "auto",
		S3_ENDPOINT_URL: "https://storage.test.neon.tech",
		S3_PUBLIC_URL: "https://cdn.test.devcrm.io",
		S3_ACCESS_KEY_ID: "key-123",
		S3_SECRET_ACCESS_KEY: "secret-456",
	},
}));

// Mock S3
vi.mock("@aws-sdk/client-s3", () => {
	class MockS3Client {
		send = mockSend;
	}
	class MockHeadBucketCommand {
		constructor(public input: any) {}
	}
	return {
		S3Client: MockS3Client,
		HeadBucketCommand: MockHeadBucketCommand,
	};
});

// Mock Svix
vi.mock("~/lib/svix", () => ({
	svix: {
		application: {
			list: mockAppList,
		},
	},
}));

import { env } from "~/env";
import {
	checkDodoHealth,
	checkEmailHealth,
	checkStorageHealth,
	checkSvixHealth,
	getAllIntegrationsHealth,
} from "../services/integrations-health";

describe("Integrations Diagnostics & Health Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	describe("checkDodoHealth", () => {
		it("should return OPERATIONAL when Dodo API responds successfully", async () => {
			(global.fetch as any).mockResolvedValueOnce({
				status: 200,
				ok: true,
			});

			const res = await checkDodoHealth();
			expect(res.id).toBe("dodo");
			expect(res.status).toBe("OPERATIONAL");
			expect(res.details.environment).toBe("test_mode");
			expect(res.latencyMs).toBeGreaterThanOrEqual(0);
		});

		it("should return ERROR when Dodo API returns 401 Unauthorized", async () => {
			(global.fetch as any).mockResolvedValueOnce({
				status: 401,
				ok: false,
			});

			const res = await checkDodoHealth();
			expect(res.status).toBe("ERROR");
			expect(res.error).toContain("Authentication failed");
		});

		it("should return NOT_CONFIGURED when DODO_PAYMENTS_API_KEY is empty", async () => {
			const originalKey = env.DODO_PAYMENTS_API_KEY;
			(env as any).DODO_PAYMENTS_API_KEY = "";

			const res = await checkDodoHealth();
			expect(res.status).toBe("NOT_CONFIGURED");
			expect(res.error).toContain("DODO_PAYMENTS_API_KEY is not configured");

			(env as any).DODO_PAYMENTS_API_KEY = originalKey;
		});
	});

	describe("checkSvixHealth", () => {
		it("should return OPERATIONAL when Svix API list succeeds", async () => {
			mockAppList.mockResolvedValueOnce({ data: [] });

			const res = await checkSvixHealth();
			expect(res.id).toBe("svix");
			expect(res.status).toBe("OPERATIONAL");
			expect(res.details.isProductionReady).toBe(true);
		});

		it("should return ERROR when Svix API list fails", async () => {
			mockAppList.mockRejectedValueOnce(new Error("Svix 401 Unauthorized"));

			const res = await checkSvixHealth();
			expect(res.status).toBe("ERROR");
			expect(res.error).toContain("Svix 401 Unauthorized");
		});

		it("should return DEGRADED when placeholder development token is detected", async () => {
			const originalToken = env.SVIX_TOKEN;
			(env as any).SVIX_TOKEN = "test_sk_fake_token_for_devcrm";

			const res = await checkSvixHealth();
			expect(res.status).toBe("DEGRADED");

			(env as any).SVIX_TOKEN = originalToken;
		});
	});

	describe("checkStorageHealth", () => {
		it("should return OPERATIONAL when HeadBucketCommand succeeds", async () => {
			mockSend.mockResolvedValueOnce({});

			const res = await checkStorageHealth();
			expect(res.id).toBe("storage");
			expect(res.status).toBe("OPERATIONAL");
			expect(res.details.bucket).toBe("test-devcrm-bucket");
		});

		it("should return ERROR when HeadBucketCommand fails", async () => {
			mockSend.mockRejectedValueOnce(new Error("BucketNotFound"));

			const res = await checkStorageHealth();
			expect(res.status).toBe("ERROR");
			expect(res.error).toContain("BucketNotFound");
		});
	});

	describe("checkEmailHealth", () => {
		it("should return MOCK_ACTIVE when no third-party email credentials are set", async () => {
			delete process.env.RESEND_API_KEY;
			delete process.env.SMTP_HOST;

			const res = await checkEmailHealth();
			expect(res.id).toBe("email");
			expect(res.status).toBe("MOCK_ACTIVE");
		});

		it("should return OPERATIONAL when RESEND_API_KEY is present", async () => {
			process.env.RESEND_API_KEY = "re_123456789";

			const res = await checkEmailHealth();
			expect(res.status).toBe("OPERATIONAL");
			expect(res.details.provider).toBe("Resend");

			delete process.env.RESEND_API_KEY;
		});
	});

	describe("getAllIntegrationsHealth", () => {
		it("should aggregate all 4 services and compute overallStatus", async () => {
			(global.fetch as any).mockResolvedValueOnce({ status: 200 });
			mockAppList.mockResolvedValueOnce({ data: [] });
			mockSend.mockResolvedValueOnce({});

			const health = await getAllIntegrationsHealth();
			expect(health.services).toHaveLength(4);
			expect(health.summary.total).toBe(4);
			expect(health.overallStatus).toBe("OPERATIONAL");
		});
	});
});
