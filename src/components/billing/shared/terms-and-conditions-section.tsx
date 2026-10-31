"use client";

import { Plus, X } from "lucide-react";
import * as React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { RichTextEditor } from "~/components/ui/rich-text-editor";
import type { DocumentData } from "~/types/document";

interface TermsAndConditionsSectionProps {
	data: DocumentData;
	onChange: (data: DocumentData) => void;
}

export function TermsAndConditionsSection({
	data,
	onChange,
}: TermsAndConditionsSectionProps) {
	const [activeEditor, setActiveEditor] = React.useState<
		"notes" | "attachments" | "info" | null
	>(null);

	const handleAddTerm = () => {
		onChange({ ...data, termsList: [...data.termsList, ""] });
	};

	const handleTermChange = (index: number, val: string) => {
		const newTerms = [...data.termsList];
		newTerms[index] = val;
		onChange({ ...data, termsList: newTerms });
	};

	const handleRemoveTerm = (index: number) => {
		const newTerms = data.termsList.filter((_, i) => i !== index);
		onChange({ ...data, termsList: newTerms });
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.currentTarget.blur();
		}
	};

	return (
		<div className="mt-8 space-y-8">
			{/* Action Buttons for Rich Text Fields */}
			<div className="flex gap-2">
				<Button
					onClick={() =>
						setActiveEditor(activeEditor === "notes" ? null : "notes")
					}
					size="sm"
					variant={activeEditor === "notes" ? "default" : "outline"}
				>
					{data.notes ? "Edit Notes" : "Add Notes"}
				</Button>
				<Button
					onClick={() =>
						setActiveEditor(
							activeEditor === "attachments" ? null : "attachments",
						)
					}
					size="sm"
					variant={activeEditor === "attachments" ? "default" : "outline"}
				>
					{data.attachments ? "Edit Attachments" : "Add Attachments"}
				</Button>
				<Button
					onClick={() =>
						setActiveEditor(activeEditor === "info" ? null : "info")
					}
					size="sm"
					variant={activeEditor === "info" ? "default" : "outline"}
				>
					{data.info ? "Edit Info" : "Add Info"}
				</Button>
			</div>

			{/* Active Editor */}
			{activeEditor && (
				<div className="mt-4 rounded-lg border bg-card p-4">
					<h3 className="mb-2 font-semibold text-sm capitalize">
						{activeEditor}
					</h3>
					<RichTextEditor
						onChange={(val) => onChange({ ...data, [activeEditor]: val })}
						value={data[activeEditor] || ""}
					/>
				</div>
			)}

			{/* Terms and Conditions */}
			<div className="mt-8">
				<Input
					className="mb-4 h-10 w-full max-w-[300px] border-dashed bg-transparent px-1 font-bold text-xl hover:bg-slate-50"
					onChange={(e) => onChange({ ...data, termsTitle: e.target.value })}
					value={data.termsTitle}
				/>

				<div className="space-y-2">
					{data.termsList.map((term, i) => (
						<div className="flex items-start gap-2" key={i}>
							<span className="mt-2 w-6 text-muted-foreground text-sm">
								{i + 1}.
							</span>
							<Input
								className="flex-1"
								onChange={(e) => handleTermChange(i, e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Type term..."
								value={term}
							/>
							<Button
								className="text-muted-foreground hover:text-destructive"
								onClick={() => handleRemoveTerm(i)}
								size="icon"
								variant="ghost"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>

				<div className="mt-4 flex gap-2">
					<Button onClick={handleAddTerm} size="sm" variant="outline">
						<Plus className="mr-2 h-4 w-4" /> Add T&C
					</Button>
					<Button onClick={handleAddTerm} size="sm" variant="outline">
						<Plus className="mr-2 h-4 w-4" /> Add Group
					</Button>
				</div>
			</div>
		</div>
	);
}
