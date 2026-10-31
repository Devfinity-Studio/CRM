"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface UseS3UploadOptions {
	onSuccess?: (publicUrl: string) => void;
	onError?: (error: Error) => void;
}

export function useS3Upload(options?: UseS3UploadOptions) {
	const [isUploading, setIsUploading] = useState(false);
	const [progress, setProgress] = useState(0);

	const getPresignedUrl = api.uploads.getPresignedUrl.useMutation();

	const uploadFile = async (file: File, folder = "misc") => {
		try {
			setIsUploading(true);
			setProgress(0);

			// 1. Get the presigned URL from our tRPC backend
			const { uploadUrl, publicUrl } = await getPresignedUrl.mutateAsync({
				filename: file.name,
				contentType: file.type,
				folder,
			});

			// 2. Upload the file directly to S3 using XMLHttpRequest for progress tracking
			await new Promise<void>((resolve, reject) => {
				const xhr = new XMLHttpRequest();

				xhr.upload.onprogress = (event) => {
					if (event.lengthComputable) {
						const percentComplete = Math.round(
							(event.loaded / event.total) * 100,
						);
						setProgress(percentComplete);
					}
				};

				xhr.onload = () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						resolve();
					} else {
						reject(new Error(`Upload failed with status ${xhr.status}`));
					}
				};

				xhr.onerror = () =>
					reject(new Error("Network error occurred during upload"));

				xhr.open("PUT", uploadUrl);
				xhr.setRequestHeader("Content-Type", file.type);
				xhr.send(file);
			});

			setProgress(100);
			setIsUploading(false);

			if (options?.onSuccess) {
				options.onSuccess(publicUrl);
			}

			return publicUrl;
		} catch (error) {
			setIsUploading(false);
			setProgress(0);
			const e = error instanceof Error ? error : new Error("Unknown error");
			if (options?.onError) {
				options.onError(e);
			} else {
				console.error("Upload error:", e);
			}
			throw e;
		}
	};

	return {
		uploadFile,
		isUploading,
		progress,
	};
}
