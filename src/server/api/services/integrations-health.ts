import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "~/env";
import { svix } from "~/lib/svix";

export type ServiceStatus = "OPERATIONAL" | "DEGRADED" | "ERROR" | "NOT_CONFIGURED" | "MOCK_ACTIVE";

export interface IntegrationHealthResult {
	id: string;
	name: string;
	category: string;
	status: ServiceStatus;
	latencyMs: number;
	lastChecked: string;
	details: Record<string, any>;
	error?: string;
}

const s3 = new S3Client({
	region: env.S3_REGION,
	endpoint: env.S3_ENDPOINT_URL,
	credentials: {
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY,
	},
	forcePathStyle: true,
});

export async function checkDodoHealth(): Promise<IntegrationHealthResult> {
	const start = Date.now();
	const isConfigured = Boolean(env.DODO_PAYMENTS_API_KEY);
	const webhookConfigured = Boolean(env.DODO_PAYMENTS_WEBHOOK_KEY);
	const environment = env.DODO_PAYMENTS_ENVIRONMENT;

	if (!isConfigured) {
		return {
			id: "dodo",
			name: "Dodo Payments",
			category: "Billing & Subscriptions",
			status: "NOT_CONFIGURED",
			latencyMs: 0,
			lastChecked: new Date().toISOString(),
			details: {
				environment,
				webhookConfigured,
				apiKeyConfigured: false,
			},
			error: "DODO_PAYMENTS_API_KEY is not configured",
		};
	}

	try {
		const baseUrl =
			environment === "live_mode"
				? "https://live.dodopayments.com"
				: "https://test.dodopayments.com";

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);

		const res = await fetch(`${baseUrl}/products?limit=1`, {
			headers: {
				Authorization: `Bearer ${env.DODO_PAYMENTS_API_KEY}`,
			},
			signal: controller.signal,
		});
		clearTimeout(timeoutId);

		const latencyMs = Date.now() - start;

		if (res.status === 401) {
			return {
				id: "dodo",
				name: "Dodo Payments",
				category: "Billing & Subscriptions",
				status: "ERROR",
				latencyMs,
				lastChecked: new Date().toISOString(),
				details: {
					environment,
					webhookConfigured,
					httpStatus: 401,
				},
				error: "Authentication failed. Invalid DODO_PAYMENTS_API_KEY.",
			};
		}

		return {
			id: "dodo",
			name: "Dodo Payments",
			category: "Billing & Subscriptions",
			status: "OPERATIONAL",
			latencyMs,
			lastChecked: new Date().toISOString(),
			details: {
				environment,
				webhookConfigured,
				httpStatus: res.status,
			},
		};
	} catch (err: any) {
		return {
			id: "dodo",
			name: "Dodo Payments",
			category: "Billing & Subscriptions",
			status: "ERROR",
			latencyMs: Date.now() - start,
			lastChecked: new Date().toISOString(),
			details: {
				environment,
				webhookConfigured,
			},
			error: err?.message || "Failed to reach Dodo Payments API",
		};
	}
}

export async function checkSvixHealth(): Promise<IntegrationHealthResult> {
	const start = Date.now();
	const token = env.SVIX_TOKEN;
	const isFakeToken = token === "test_sk_fake_token_for_devcrm" || !token;

	if (isFakeToken) {
		return {
			id: "svix",
			name: "Svix Webhooks",
			category: "Event Streaming",
			status: "DEGRADED",
			latencyMs: 1,
			lastChecked: new Date().toISOString(),
			details: {
				configuredToken: "test_mode_mock",
				isProductionReady: false,
			},
			error: "SVIX_TOKEN is set to development placeholder token.",
		};
	}

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);

		// svix client application listing
		const listPromise = svix.application.list({ limit: 1 });
		const timeoutPromise = new Promise((_, reject) =>
			setTimeout(() => reject(new Error("Svix connection timed out")), 5000),
		);

		await Promise.race([listPromise, timeoutPromise]);
		clearTimeout(timeoutId);

		const latencyMs = Date.now() - start;
		return {
			id: "svix",
			name: "Svix Webhooks",
			category: "Event Streaming",
			status: "OPERATIONAL",
			latencyMs,
			lastChecked: new Date().toISOString(),
			details: {
				isProductionReady: true,
			},
		};
	} catch (err: any) {
		return {
			id: "svix",
			name: "Svix Webhooks",
			category: "Event Streaming",
			status: "ERROR",
			latencyMs: Date.now() - start,
			lastChecked: new Date().toISOString(),
			details: {
				isProductionReady: false,
			},
			error: err?.message || "Failed to connect to Svix API",
		};
	}
}

export async function checkStorageHealth(): Promise<IntegrationHealthResult> {
	const start = Date.now();
	try {
		const command = new HeadBucketCommand({
			Bucket: env.S3_BUCKET_NAME,
		});

		await s3.send(command);
		const latencyMs = Date.now() - start;

		return {
			id: "storage",
			name: "Neon Object Storage",
			category: "File Storage & Attachments",
			status: "OPERATIONAL",
			latencyMs,
			lastChecked: new Date().toISOString(),
			details: {
				bucket: env.S3_BUCKET_NAME,
				region: env.S3_REGION,
				endpoint: env.S3_ENDPOINT_URL,
				publicUrlConfigured: Boolean(env.S3_PUBLIC_URL),
			},
		};
	} catch (err: any) {
		return {
			id: "storage",
			name: "Neon Object Storage",
			category: "File Storage & Attachments",
			status: "ERROR",
			latencyMs: Date.now() - start,
			lastChecked: new Date().toISOString(),
			details: {
				bucket: env.S3_BUCKET_NAME,
				region: env.S3_REGION,
				endpoint: env.S3_ENDPOINT_URL,
			},
			error: err?.message || "Failed to reach Neon S3 storage bucket",
		};
	}
}

export async function checkEmailHealth(): Promise<IntegrationHealthResult> {
	const start = Date.now();
	const resendKey = process.env.RESEND_API_KEY;
	const smtpHost = process.env.SMTP_HOST;

	if (resendKey) {
		return {
			id: "email",
			name: "Email Delivery",
			category: "Notifications",
			status: "OPERATIONAL",
			latencyMs: Date.now() - start,
			lastChecked: new Date().toISOString(),
			details: {
				provider: "Resend",
				configured: true,
			},
		};
	}

	if (smtpHost) {
		return {
			id: "email",
			name: "Email Delivery",
			category: "Notifications",
			status: "OPERATIONAL",
			latencyMs: Date.now() - start,
			lastChecked: new Date().toISOString(),
			details: {
				provider: "SMTP",
				host: smtpHost,
				configured: true,
			},
		};
	}

	return {
		id: "email",
		name: "Email Delivery",
		category: "Notifications",
		status: "MOCK_ACTIVE",
		latencyMs: 1,
		lastChecked: new Date().toISOString(),
		details: {
			provider: "Internal Mock Dispatcher",
			configured: false,
			note: "Emails logged to console/DB in development mode.",
		},
	};
}

export async function getAllIntegrationsHealth(): Promise<{
	overallStatus: "OPERATIONAL" | "DEGRADED" | "CRITICAL";
	services: IntegrationHealthResult[];
	summary: {
		total: number;
		operational: number;
		degraded: number;
		error: number;
		notConfigured: number;
	};
}> {
	const results = await Promise.all([
		checkDodoHealth(),
		checkSvixHealth(),
		checkStorageHealth(),
		checkEmailHealth(),
	]);

	const operational = results.filter((r) => r.status === "OPERATIONAL" || r.status === "MOCK_ACTIVE").length;
	const degraded = results.filter((r) => r.status === "DEGRADED").length;
	const error = results.filter((r) => r.status === "ERROR").length;
	const notConfigured = results.filter((r) => r.status === "NOT_CONFIGURED").length;

	let overallStatus: "OPERATIONAL" | "DEGRADED" | "CRITICAL" = "OPERATIONAL";
	if (error > 0) {
		overallStatus = "CRITICAL";
	} else if (degraded > 0 || notConfigured > 0) {
		overallStatus = "DEGRADED";
	}

	return {
		overallStatus,
		services: results,
		summary: {
			total: results.length,
			operational,
			degraded,
			error,
			notConfigured,
		},
	};
}

