import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "node",
		env: {
			SKIP_ENV_VALIDATION: "1",
			DATABASE_URL: "postgresql://postgres:password@localhost:5432/test",
			AUTH_SECRET: "test-auth-secret-32-chars-long-minimum!",
			S3_BUCKET_NAME: "test-bucket",
			S3_ACCESS_KEY_ID: "test-key",
			S3_SECRET_ACCESS_KEY: "test-secret",
			S3_ENDPOINT_URL: "https://test.r2.cloudflarestorage.com",
			SVIX_TOKEN: "test_sk_fake_token_value_for_testing",
		},
	},
});
