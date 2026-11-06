import crypto from "crypto";

// Derive deterministic 32-byte key from ENCRYPTION_SECRET or AUTH_SECRET
function getEncryptionKey(): Buffer {
	const secret =
		process.env.ENCRYPTION_SECRET ||
		process.env.AUTH_SECRET ||
		"devcrm-fallback-secret-for-development-and-testing-only-32b";
	return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt sensitive PII using AES-256-GCM.
 * Output format: enc:v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 */
export function encryptPII(plaintext: string | null | undefined): string {
	if (!plaintext || typeof plaintext !== "string" || plaintext.trim() === "") {
		return "";
	}

	const trimmed = plaintext.trim();
	// Avoid double-encrypting if already in enc:v1: format
	if (trimmed.startsWith("enc:v1:")) {
		return trimmed;
	}

	const key = getEncryptionKey();
	const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

	const encrypted = Buffer.concat([
		cipher.update(trimmed, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	return `enc:v1:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt sensitive PII encrypted with AES-256-GCM.
 * Gracefully falls back to plaintext if the value is unencrypted (legacy data).
 */
export function decryptPII(ciphertext: string | null | undefined): string {
	if (
		!ciphertext ||
		typeof ciphertext !== "string" ||
		ciphertext.trim() === ""
	) {
		return "";
	}

	const trimmed = ciphertext.trim();
	// If not an envelope-encrypted string, return as-is (backward compatible)
	if (!trimmed.startsWith("enc:v1:")) {
		return trimmed;
	}

	const parts = trimmed.split(":");
	if (parts.length !== 5) {
		return trimmed;
	}

	try {
		const key = getEncryptionKey();
		const iv = Buffer.from(parts[2]!, "hex");
		const authTag = Buffer.from(parts[3]!, "hex");
		const encryptedData = Buffer.from(parts[4]!, "hex");

		const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
		decipher.setAuthTag(authTag);

		const decrypted = Buffer.concat([
			decipher.update(encryptedData),
			decipher.final(),
		]);

		return decrypted.toString("utf8");
	} catch (err) {
		console.error("[PII Decryption Failed] Tag mismatch or corrupt ciphertext:", err);
		return "[RESTRICTED_PII]";
	}
}

/**
 * Mask an Indian Aadhaar number: XXXX-XXXX-1234
 */
export function maskAadhaar(val: string | null | undefined): string {
	if (!val) return "";
	const clean = val.replace(/[^0-9]/g, "");
	if (clean.length >= 4) {
		return `XXXX-XXXX-${clean.slice(-4)}`;
	}
	return "XXXX-XXXX-XXXX";
}

/**
 * Mask an Indian PAN card number: XXXXX1234X
 */
export function maskPan(val: string | null | undefined): string {
	if (!val) return "";
	const clean = val.trim().toUpperCase();
	if (clean.length === 10) {
		return `XXXXX${clean.slice(5, 9)}${clean.slice(9)}`;
	}
	if (clean.length >= 4) {
		return `XXXXX${clean.slice(-4)}`;
	}
	return "XXXXX-XXXX";
}

/**
 * Mask a Passport number: AXXXX123
 */
export function maskPassport(val: string | null | undefined): string {
	if (!val) return "";
	const clean = val.trim();
	if (clean.length >= 4) {
		const firstChar = clean[0] || "X";
		return `${firstChar}XXXX${clean.slice(-3)}`;
	}
	return "XXXXXX";
}
