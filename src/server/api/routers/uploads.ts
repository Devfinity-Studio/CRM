import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "~/env";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { organizationMembers } from "~/server/db/schema";

const s3 = new S3Client({
	region: env.S3_REGION,
	endpoint: env.S3_ENDPOINT_URL,
	credentials: {
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY,
	},
	// Required for Neon Object Storage: path-style addressing
	forcePathStyle: true,
});

const DISALLOWED_MIME_TYPES = [
	"text/html",
	"application/xhtml+xml",
	"application/javascript",
	"text/javascript",
	"image/svg+xml",
	"application/x-msdownload",
	"application/x-sh",
	"application/x-executable",
];

export const uploadsRouter = createTRPCRouter({
	getPresignedUrl: protectedProcedure
		.input(
			z.object({
				filename: z.string().min(1),
				contentType: z.string().min(1),
				folder: z.string().default("misc"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (DISALLOWED_MIME_TYPES.includes(input.contentType.toLowerCase())) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "The requested file type is not permitted for upload.",
				});
			}

			// 1. Get user's organization to isolate files
			const orgId =
				ctx.session?.user?.organizationId ||
				(
					await ctx.db.query.organizationMembers.findFirst({
						where: eq(organizationMembers.userId, ctx.session.user.id),
					})
				)?.organizationId;

			if (!orgId) {
				throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
			}

			// 2. Generate a unique key with sanitized folder and filename
			const uuid = crypto.randomUUID();
			const sanitizedFolder = input.folder.replace(/[^a-zA-Z0-9_-]/g, "") || "misc";
			const sanitizedFilename = input.filename.replace(/[^a-zA-Z0-9.-]/g, "_");
			const key = `${orgId}/${sanitizedFolder}/${uuid}-${sanitizedFilename}`;

			// 3. Create the presigned URL
			const command = new PutObjectCommand({
				Bucket: env.S3_BUCKET_NAME,
				Key: key,
				ContentType: input.contentType,
			});

			// Expires in 5 minutes
			const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

			// 4. Determine the public URL
			let publicUrl = "";
			if (env.S3_PUBLIC_URL) {
				// Remove trailing slash if exists, then append key
				const base = env.S3_PUBLIC_URL.replace(/\/$/, "");
				publicUrl = `${base}/${key}`;
			} else {
				// Fallback to direct bucket access if no public domain is set
				publicUrl = `${env.S3_ENDPOINT_URL}/${env.S3_BUCKET_NAME}/${key}`;
			}

			return {
				uploadUrl,
				publicUrl,
				key,
			};
		}),
});
