import { sql } from "drizzle-orm";
import postgres from "postgres";
import { env } from "./src/env";
import { db } from "./src/server/db/index";

async function main() {
	const client = postgres(env.DATABASE_URL);

	try {
		await client`DROP TABLE IF EXISTS quotation_items CASCADE;`;
		await client`DROP SEQUENCE IF EXISTS quotation_items_id_seq CASCADE;`;
		console.log("Successfully dropped quotation_items and its sequence.");
	} catch (error) {
		console.error("Failed to drop:", error);
	} finally {
		await client.end();
		process.exit(0);
	}
}

main();
