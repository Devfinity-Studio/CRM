"use client";

import { Eraser, Pen, UploadCloud } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface SignaturePadProps {
	onSave: (dataUrl: string, type: "DRAW" | "UPLOAD") => void;
	onClear: () => void;
	initialSignature?: string | null;
}

export function SignaturePad({
	onSave,
	onClear,
	initialSignature,
}: SignaturePadProps) {
	const padRef = useRef<SignatureCanvas>(null);
	const [activeTab, setActiveTab] = useState<"draw" | "upload">("draw");
	const [uploadedImage, setUploadedImage] = useState<string | null>(
		initialSignature || null,
	);

	const handleClear = () => {
		if (activeTab === "draw") {
			padRef.current?.clear();
		} else {
			setUploadedImage(null);
		}
		onClear();
	};

	const handleSaveDraw = () => {
		if (padRef.current?.isEmpty()) return;
		const dataUrl = padRef.current?.getTrimmedCanvas().toDataURL("image/png");
		if (dataUrl) {
			onSave(dataUrl, "DRAW");
		}
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				const result = reader.result as string;
				setUploadedImage(result);
				onSave(result, "UPLOAD");
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<div className="w-full max-w-sm overflow-hidden rounded-lg border bg-background shadow-sm">
			<Tabs
				className="w-full"
				onValueChange={(v) => setActiveTab(v as "draw" | "upload")}
				value={activeTab}
			>
				<TabsList className="grid h-12 w-full grid-cols-2 rounded-none border-b">
					<TabsTrigger
						className="flex items-center gap-2 rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2"
						value="draw"
					>
						<Pen className="h-4 w-4" /> Draw
					</TabsTrigger>
					<TabsTrigger
						className="flex items-center gap-2 rounded-none data-[state=active]:border-primary data-[state=active]:border-b-2"
						value="upload"
					>
						<UploadCloud className="h-4 w-4" /> Upload
					</TabsTrigger>
				</TabsList>

				<div className="bg-muted/20 p-4">
					<TabsContent className="mt-0" value="draw">
						<div
							className="overflow-hidden rounded-md border bg-white"
							style={{ height: 160 }}
						>
							<SignatureCanvas
								backgroundColor="rgba(255,255,255,1)"
								canvasProps={{
									className: "w-full h-full",
									style: { width: "100%", height: "100%" },
								}}
								onEnd={handleSaveDraw}
								ref={padRef}
							/>
						</div>
						<div className="mt-3 flex items-center justify-between">
							<span className="text-muted-foreground text-xs italic">
								Sign above
							</span>
							<Button
								className="h-8 text-destructive text-xs hover:bg-destructive/10 hover:text-destructive"
								onClick={handleClear}
								size="sm"
								variant="ghost"
							>
								<Eraser className="mr-1 h-3 w-3" /> Clear
							</Button>
						</div>
					</TabsContent>

					<TabsContent className="mt-0" value="upload">
						{uploadedImage ? (
							<div className="group relative flex h-[160px] items-center justify-center overflow-hidden rounded-md border bg-white">
								<img
									alt="Signature"
									className="max-h-full max-w-full object-contain"
									src={uploadedImage}
								/>
								<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
									<Button onClick={handleClear} size="sm" variant="destructive">
										Remove
									</Button>
								</div>
							</div>
						) : (
							<div className="flex h-[160px] flex-col items-center justify-center gap-2 rounded-md border-2 border-muted-foreground/25 border-dashed bg-muted/10 transition-colors hover:bg-muted/30">
								<UploadCloud className="h-8 w-8 text-muted-foreground" />
								<Label
									className="cursor-pointer font-medium text-primary text-sm hover:underline"
									htmlFor="signature-upload"
								>
									Click to upload image
								</Label>
								<p className="text-muted-foreground text-xs">
									PNG, JPG up to 2MB
								</p>
								<Input
									accept="image/png, image/jpeg"
									className="hidden"
									id="signature-upload"
									onChange={handleFileUpload}
									type="file"
								/>
							</div>
						)}
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
