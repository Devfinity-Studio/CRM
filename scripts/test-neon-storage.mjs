import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

async function main() {
	console.log("Initializing Files SDK with Neon Object Storage adapter...");
	const files = new Files({ adapter: neon({ bucket: "uploads" }) });

	const testFilename = "test-neon-storage.txt";
	const testContent = `Hello from DevCRM using Neon Object Storage!
Verified on: ${new Date().toISOString()}
Status: Working successfully!`;

	console.log(`\n1. Uploading test file: ${testFilename}...`);
	await files.upload(testFilename, testContent, {
		contentType: "text/plain",
	});
	console.log("✓ Upload completed successfully.");

	console.log("\n2. Listing files in 'uploads' bucket...");
	const listResult = await files.list();
	console.log("Bucket objects found:");
	if (listResult && Array.isArray(listResult.items)) {
		for (const item of listResult.items) {
			console.log(` - ${item.key} (size: ${item.size ?? "unknown"} bytes)`);
		}
	} else if (Array.isArray(listResult)) {
		for (const item of listResult) {
			console.log(` - ${item.key || item.name || JSON.stringify(item)}`);
		}
	} else {
		console.log(listResult);
	}

	console.log(`\n3. Reading file back from Neon Object Storage: ${testFilename}...`);
	const downloadedFile = await files.download(testFilename);
	const content = await downloadedFile.text();

	console.log("✓ File read successfully. Contents:");
	console.log("-----------------------------------------");
	console.log(content);
	console.log("-----------------------------------------");
	console.log("\n✓ All Neon Object Storage operations verified successfully!");
}

main().catch((err) => {
	console.error("Error executing Neon Object Storage test:", err);
	process.exit(1);
});
