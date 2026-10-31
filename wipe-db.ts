import { sql } from "drizzle-orm";
import postgres from "postgres";
import { env } from "./src/env";
import { db } from "./src/server/db/index";

async function main() {
	const client = postgres(env.DATABASE_URL);

	try {
		await client`DROP SCHEMA public CASCADE;`;
		await client`CREATE SCHEMA public;`;
		await client`GRANT ALL ON SCHEMA public TO public;`;
		console.log("Successfully wiped database schema.");
	} catch (error) {
		console.error("Failed to wipe:", error);
	} finally {
		await client.end();
		process.exit(0);
	}
}

main();
