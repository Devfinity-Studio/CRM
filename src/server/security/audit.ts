import { systemAuditLogs } from "~/server/db/schema";

export interface LogSuperAdminActionParams {
	actorId: string;
	actorEmail: string;
	action: string;
	targetType?: string;
	targetId?: string;
	metadata?: Record<string, any>;
	ipAddress?: string;
}

/**
 * Centrally records immutable Super Admin activity logs for compliance and auditing.
 * Fail-safe: Contains errors to prevent crashing the underlying administrative operation.
 */
export async function logSuperAdminAction(
	db: any,
	params: LogSuperAdminActionParams,
): Promise<void> {
	try {
		const metadataStr = params.metadata
			? JSON.stringify(params.metadata)
			: null;

		await db.insert(systemAuditLogs).values({
			actorId: params.actorId,
			actorEmail: params.actorEmail,
			action: params.action,
			targetType: params.targetType || null,
			targetId: params.targetId || null,
			metadata: metadataStr,
			ipAddress: params.ipAddress || null,
		});
	} catch (err) {
		console.error("[System Audit Logging Failed]", err, params);
	}
}

