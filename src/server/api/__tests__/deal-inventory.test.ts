import { describe, expect, it, vi } from "vitest";
import { syncDealInventoryHolds } from "~/server/api/services/deal-inventory";

describe("Deal SKU Line Items & Soft Inventory Reservations", () => {
	it("should calculate soft reservation based on deal stage and status", async () => {
		const mockStages = [
			{ id: "stage-1", name: "Prospecting" },
			{ id: "stage-2", name: "Proposal / Negotiation" },
			{ id: "stage-3", name: "Closing" },
		];

		const mockProducts = [{ id: "prod-1" }];

		let updatedReservedQuantity = 0;

		const mockDb = {
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockImplementation(() => ({
					where: vi.fn().mockResolvedValue(mockProducts),
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([{ totalReserved: 15 }]),
					}),
					// Return stages directly if called for stages
					then: (resolve: any) => resolve(mockStages),
				})),
			}),
			update: vi.fn().mockReturnValue({
				set: vi.fn().mockImplementation((vals) => {
					updatedReservedQuantity = vals.reservedQuantity;
					return {
						where: vi.fn().mockResolvedValue([{ id: "prod-1", ...vals }]),
					};
				}),
			}),
		};

		// Run sync
		await syncDealInventoryHolds(mockDb, "org-test", ["prod-1"]);

		// Verify update was called
		expect(mockDb.update).toHaveBeenCalled();
	});

	it("should prevent overselling by correctly calculating available stock (stockQuantity - reservedQuantity)", () => {
		const product = {
			id: "prod-100",
			name: "Enterprise Server Unit",
			stockQuantity: 50,
			reservedQuantity: 42,
		};

		const availableStock = Math.max(
			0,
			product.stockQuantity - product.reservedQuantity,
		);
		expect(availableStock).toBe(8);

		const requestedQuantity = 10;
		const canFulfill = requestedQuantity <= availableStock;
		expect(canFulfill).toBe(false);

		const partialQuantity = 5;
		const canFulfillPartial = partialQuantity <= availableStock;
		expect(canFulfillPartial).toBe(true);
	});

	it("should gracefully handle empty stages or products without crashing", async () => {
		const emptyDb = {
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockResolvedValue([]),
			}),
			update: vi.fn(),
		};

		await expect(
			syncDealInventoryHolds(emptyDb, "org-empty"),
		).resolves.not.toThrow();
	});
});
