import postgres from "postgres";

const sql = postgres(
	"postgresql://neondb_owner:npg_or9TbtHsR6OY@ep-bitter-darkness-azznf1fc-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
);

async function main() {
	try {
		await sql`ALTER TABLE "devcrm_organization" ADD COLUMN "svixAppId" varchar(255);`;
		console.log("Column svixAppId added successfully!");
	} catch (err: any) {
		console.error("Error adding column:", err.message);
	} finally {
		await sql.end();
	}
}

main();
