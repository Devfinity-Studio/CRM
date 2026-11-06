import { describe, expect, it } from "vitest";
import {
	decryptPII,
	encryptPII,
	maskAadhaar,
	maskPan,
	maskPassport,
} from "../encryption";

describe("PII Encryption & Masking Engine", () => {
	const samplePan = "ABCDE1234F";
	const sampleAadhaar = "987654321098";
	const samplePassport = "Z9876543";

	describe("encryptPII", () => {
		it("should encrypt plaintext into AES-256-GCM envelope format", () => {
			const encrypted = encryptPII(samplePan);
			expect(encrypted).toMatch(/^enc:v1:[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/);
		});

		it("should generate unique ciphertexts for identical plaintexts (random IV)", () => {
			const enc1 = encryptPII(samplePan);
			const enc2 = encryptPII(samplePan);
			expect(enc1).not.toBe(enc2);
		});

		it("should handle empty or null values gracefully", () => {
			expect(encryptPII("")).toBe("");
			expect(encryptPII(null)).toBe("");
			expect(encryptPII(undefined)).toBe("");
		});

		it("should not double-encrypt if string already starts with enc:v1:", () => {
			const enc = encryptPII(samplePan);
			const doubleEnc = encryptPII(enc);
			expect(doubleEnc).toBe(enc);
		});
	});

	describe("decryptPII", () => {
		it("should decrypt ciphertext back to original plaintext", () => {
			const encrypted = encryptPII(samplePan);
			const decrypted = decryptPII(encrypted);
			expect(decrypted).toBe(samplePan);
		});

		it("should decrypt long Aadhaar numbers accurately", () => {
			const encrypted = encryptPII(sampleAadhaar);
			const decrypted = decryptPII(encrypted);
			expect(decrypted).toBe(sampleAadhaar);
		});

		it("should gracefully return legacy unencrypted plaintext as-is", () => {
			expect(decryptPII("PLAINTEXT_PAN_123")).toBe("PLAINTEXT_PAN_123");
			expect(decryptPII("")).toBe("");
			expect(decryptPII(null)).toBe("");
		});

		it("should safely handle tampered ciphertext or tag mismatch", () => {
			const encrypted = encryptPII(samplePan);
			const parts = encrypted.split(":");
			// Corrupt the ciphertext payload (parts[4])
			const tamperedCiphertext =
				parts[4]!.substring(0, parts[4]!.length - 2) + "ff";
			const tampered = `enc:v1:${parts[2]}:${parts[3]}:${tamperedCiphertext}`;

			const result = decryptPII(tampered);
			expect(result).toBe("[RESTRICTED_PII]");
		});
	});

	describe("Masking Functions", () => {
		it("should mask Aadhaar number to XXXX-XXXX-1234", () => {
			expect(maskAadhaar("123456789012")).toBe("XXXX-XXXX-9012");
			expect(maskAadhaar("1234 5678 9012")).toBe("XXXX-XXXX-9012");
			expect(maskAadhaar("")).toBe("");
		});

		it("should mask PAN number to XXXXX1234X", () => {
			expect(maskPan("ABCDE1234F")).toBe("XXXXX1234F");
			expect(maskPan("")).toBe("");
		});

		it("should mask Passport number to AXXXX123", () => {
			expect(maskPassport("Z9876543")).toBe("ZXXXX543");
			expect(maskPassport("")).toBe("");
		});
	});
});
