import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		DATABASE_URL: z.string().url(),
		AUTH_SECRET: z.string().default("devcrm-secret-key-change-in-production"),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		S3_BUCKET_NAME: z.string().min(1),
		S3_REGION: z.string().default("auto"),
		S3_ACCESS_KEY_ID: z.string().min(1),
		S3_SECRET_ACCESS_KEY: z.string().min(1),
		S3_ENDPOINT_URL: z.string().url(),
		S3_PUBLIC_URL: z.string().url().optional(),
		SVIX_TOKEN: z.string().min(1).default("test_sk_fake_token_for_devcrm"),
		DODO_PAYMENTS_API_KEY: z.string().optional(),
		DODO_PAYMENTS_WEBHOOK_KEY: z.string().optional(),
		DODO_PAYMENTS_ENVIRONMENT: z.enum(["test_mode", "live_mode"]).default("test_mode"),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		// NEXT_PUBLIC_CLIENTVAR: z.string(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		AUTH_SECRET: process.env.AUTH_SECRET,
		NODE_ENV: process.env.NODE_ENV,
		S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
		S3_REGION: process.env.S3_REGION,
		S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
		S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
		S3_ENDPOINT_URL: process.env.S3_ENDPOINT_URL,
		S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
		SVIX_TOKEN: process.env.SVIX_TOKEN,
		DODO_PAYMENTS_API_KEY: process.env.DODO_PAYMENTS_API_KEY,
		DODO_PAYMENTS_WEBHOOK_KEY: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
		DODO_PAYMENTS_ENVIRONMENT: process.env.DODO_PAYMENTS_ENVIRONMENT,
		// NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
