"use client";

import { Image as ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useS3Upload } from "~/hooks/use-s3-upload";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";

interface FileUploadDropzoneProps {
	onUploadSuccess: (url: string) => void;
	folder?: string;
	accept?: string;
	maxSizeMB?: number;
	className?: string;
	currentImageUrl?: string;
	onRemove?: () => void;
}

export function FileUploadDropzone({
	onUploadSuccess,
	folder = "uploads",
	accept = "image/*",
	maxSizeMB = 5,
	className,
	currentImageUrl,
	onRemove,
}: FileUploadDropzoneProps) {
	const [dragActive, setDragActive] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const { uploadFile, isUploading, progress } = useS3Upload({
		onSuccess: (url) => {
			onUploadSuccess(url);
			setError(null);
		},
		onError: (err) => {
			setError(err.message || "Failed to upload file");
		},
	});

	const handleDrag = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	}, []);

	const validateAndUpload = (file: File) => {
		setError(null);
		if (!file.type.match(accept.replace("*", ".*"))) {
			setError(`Invalid file type. Accepted: ${accept}`);
			return;
		}
		if (file.size > maxSizeMB * 1024 * 1024) {
			setError(`File size exceeds ${maxSizeMB}MB`);
			return;
		}
		uploadFile(file, folder);
	};

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setDragActive(false);

			if (e.dataTransfer.files && e.dataTransfer.files[0]) {
				validateAndUpload(e.dataTransfer.files[0]);
			}
		},
		[validateAndUpload],
	);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.preventDefault();
		if (e.target.files && e.target.files[0]) {
			validateAndUpload(e.target.files[0]);
		}
	};

	if (currentImageUrl && !isUploading) {
		return (
			<div
				className={cn(
					"group relative flex items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50",
					className,
				)}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					alt="Uploaded"
					className="max-h-full max-w-full object-contain p-2"
					src={currentImageUrl}
				/>
				{onRemove && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
						<Button
							onClick={(e) => {
								e.preventDefault();
								onRemove();
							}}
							size="sm"
							variant="destructive"
						>
							<X className="mr-1 h-4 w-4" /> Remove
						</Button>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="w-full">
			<div
				className={cn(
					"relative flex w-full flex-col items-center justify-center rounded-md border-2 border-dashed transition-colors",
					dragActive
						? "border-blue-500 bg-blue-50/50"
						: "border-slate-300 bg-slate-50 hover:bg-slate-100",
					isUploading ? "pointer-events-none opacity-70" : "cursor-pointer",
					className,
				)}
				onClick={() => !isUploading && inputRef.current?.click()}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
			>
				<input
					accept={accept}
					className="hidden"
					disabled={isUploading}
					onChange={handleChange}
					ref={inputRef}
					type="file"
				/>

				{isUploading ? (
					<div className="flex w-full flex-col items-center justify-center space-y-3 p-6">
						<Loader2 className="h-8 w-8 animate-spin text-blue-500" />
						<div className="w-full max-w-xs space-y-1">
							<div className="flex justify-between font-medium text-slate-500 text-xs">
								<span>Uploading...</span>
								<span>{progress}%</span>
							</div>
							<Progress className="h-2 w-full" value={progress} />
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center space-y-2 p-6 text-center">
						<div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
							<UploadCloud className="h-5 w-5 text-blue-600" />
						</div>
						<p className="font-medium text-slate-700 text-sm">
							<span className="text-blue-600">Click to upload</span> or drag and
							drop
						</p>
						<p className="text-slate-500 text-xs">
							SVG, PNG, JPG or GIF (max. {maxSizeMB}MB)
						</p>
					</div>
				)}
			</div>
			{error && (
				<p className="mt-2 font-medium text-red-500 text-sm">{error}</p>
			)}
		</div>
	);
}
