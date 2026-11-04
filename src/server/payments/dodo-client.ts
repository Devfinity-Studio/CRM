import DodoPayments from "dodopayments";

/**
 * Returns an initialized DodoPayments SDK client.
 * Automatically resolves environment based on the API key prefix or DODO_PAYMENTS_ENVIRONMENT.
 */
export function getDodoClient(): DodoPayments {
	const apiKey = process.env.DODO_PAYMENTS_API_KEY;
	if (!apiKey) {
		throw new Error(
			"DODO_PAYMENTS_API_KEY is not configured in environment variables.",
		);
	}

	const isLive =
		apiKey.startsWith("dodo_live_") ||
		process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode";

	return new DodoPayments({
		bearerToken: apiKey,
		environment: isLive ? "live_mode" : "test_mode",
		webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
	});
}

/**
 * Safely checks if Dodo Payments credentials are configured.
 */
export function isDodoConfigured(): boolean {
	return Boolean(process.env.DODO_PAYMENTS_API_KEY);
}

