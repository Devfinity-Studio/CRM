import { and, eq, inArray, sql } from "drizzle-orm";
import { dealProducts, deals, pipelineStages, products } from "~/server/db/schema";

/**
 * Re-synchronizes soft inventory holds (`reservedQuantity`) for all products
 * based on qualifying deals (Deals in 'Negotiation'/'Proposal' stages or 'WON' status).
 */
export async function syncDealInventoryHolds(
	db: any,
	organizationId: string,
	targetProductIds?: string[],
) {
	try {
		// 1. Identify stages that trigger soft inventory reservation
		const stages = await db
			.select({
				id: pipelineStages.id,
				name: pipelineStages.name,
			})
			.from(pipelineStages);

		if (!Array.isArray(stages)) return;

		const holdStageIds = stages
			.filter((s: { id: string; name: string }) => {
				const n = s.name?.toLowerCase() || "";
				return (
					n.includes("negotiat") ||
					n.includes("propos") ||
					n.includes("contract") ||
					n.includes("won") ||
					n.includes("closing")
				);
			})
			.map((s: { id: string }) => s.id);

		// 2. Fetch all products for this organization (or subset)
		const productConditions = [eq(products.organizationId, organizationId)];
		if (targetProductIds && targetProductIds.length > 0) {
			productConditions.push(inArray(products.id, targetProductIds));
		}

		const orgProducts = await db
			.select({ id: products.id })
			.from(products)
			.where(and(...productConditions));

		if (!Array.isArray(orgProducts) || orgProducts.length === 0) return;

		// 3. For each product, calculate total actively reserved quantity across qualifying deals
		for (const p of orgProducts) {
			// Qualifying: status is WON or (status is OPEN and stage is in holdStageIds)
			const [reservation] = await db
				.select({
					totalReserved: sql<number>`cast(coalesce(sum(${dealProducts.quantity}), 0) as integer)`,
				})
				.from(dealProducts)
				.innerJoin(deals, eq(dealProducts.dealId, deals.id))
				.where(
					and(
						eq(dealProducts.productId, p.id),
						eq(deals.organizationId, organizationId),
						sql`(${deals.status} = 'WON' OR (${deals.status} = 'OPEN' AND ${
							holdStageIds.length > 0
								? inArray(deals.stageId, holdStageIds)
								: sql`1 = 0`
						}))`,
					),
				);

			const totalReserved = reservation?.totalReserved ?? 0;

			await db
				.update(products)
				.set({ reservedQuantity: Math.max(0, totalReserved) })
				.where(eq(products.id, p.id));
		}
	} catch (error) {
		console.warn("[syncDealInventoryHolds] Suppressed sync warning:", error);
	}
}
