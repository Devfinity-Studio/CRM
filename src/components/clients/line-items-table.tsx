"use client";

import { GripVertical, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { RichTextEditor } from "~/components/ui/rich-text-editor";
import { ProductAutocomplete } from "./product-autocomplete";

export interface LineItem {
	id: string;
	productId?: string;
	name: string;
	description: string;
	quantity: number;
	rate: number;
	amount: number;
	unit: string;
	imageUrl?: string;
}

interface LineItemsTableProps {
	items: LineItem[];
	onChange: (items: LineItem[]) => void;
	currencySymbol: string;
}

export function LineItemsTable({
	items,
	onChange,
	currencySymbol,
}: LineItemsTableProps) {
	const addItem = () => {
		onChange([
			...items,
			{
				id: crypto.randomUUID(),
				name: "",
				description: "",
				quantity: 1,
				rate: 0,
				amount: 0,
				unit: "pcs",
			},
		]);
	};

	const updateItem = (id: string, updates: Partial<LineItem>) => {
		onChange(
			items.map((item) => {
				if (item.id === id) {
					const updated = { ...item, ...updates };
					updated.amount = updated.quantity * updated.rate;
					return updated;
				}
				return item;
			}),
		);
	};

	const removeItem = (id: string) => {
		onChange(items.filter((item) => item.id !== id));
	};

	return (
		<div className="w-full">
			{/* Header Row */}
			<div className="grid grid-cols-[auto_1fr_100px_150px_150px_auto] gap-4 rounded-t-md bg-slate-900 px-4 py-3 font-medium text-sm text-white">
				<div className="w-6"></div>
				<div>Item Name / Description</div>
				<div className="text-right">Qty</div>
				<div className="text-right">Rate</div>
				<div className="text-right">Amount</div>
				<div className="w-8"></div>
			</div>

			{/* Items */}
			<div className="divide-y rounded-b-md border border-t-0">
				{items.map((item, index) => (
					<div
						className="group grid grid-cols-[auto_1fr_100px_150px_150px_auto] items-start gap-4 p-4"
						key={item.id}
					>
						{/* Drag Handle */}
						<div className="w-6 cursor-grab pt-2 text-slate-300 hover:text-slate-500 active:cursor-grabbing">
							<GripVertical className="h-4 w-4" />
						</div>

						{/* Main Item Area */}
						<div className="flex flex-col gap-3">
							<ProductAutocomplete
								onSelect={(selected) => {
									if ("isNew" in selected) {
										updateItem(item.id, { name: selected.name });
									} else {
										updateItem(item.id, {
											productId: selected.id,
											name: selected.name,
											rate: selected.unitPrice / 100,
											unit: selected.unit || "pcs",
											description: selected.description || "",
										});
									}
								}}
								placeholder="Select or type item name..."
							/>

							{/* Fallback to Input if they don't want to use autocomplete, or let the autocomplete input double as name */}
							{item.name && (
								<div className="pl-1 font-medium text-slate-800 text-sm">
									{item.name}
								</div>
							)}

							<RichTextEditor
								className="bg-white"
								onChange={(html) => updateItem(item.id, { description: html })}
								placeholder="Item description (optional)"
								value={item.description}
							/>
						</div>

						{/* Quantity */}
						<div className="flex flex-col gap-1">
							<Input
								className="h-9 text-right"
								min={0}
								onChange={(e) =>
									updateItem(item.id, {
										quantity: parseFloat(e.target.value) || 0,
									})
								}
								step={0.01}
								type="number"
								value={item.quantity || ""}
							/>
							<Input
								className="h-7 border-transparent px-1 text-center text-slate-500 text-xs hover:border-input"
								onChange={(e) => updateItem(item.id, { unit: e.target.value })}
								placeholder="Unit (pcs)"
								value={item.unit}
							/>
						</div>

						{/* Rate */}
						<div className="flex items-center gap-1">
							<span className="text-slate-400 text-sm">{currencySymbol}</span>
							<Input
								className="h-9 text-right"
								min={0}
								onChange={(e) =>
									updateItem(item.id, { rate: parseFloat(e.target.value) || 0 })
								}
								step={0.01}
								type="number"
								value={item.rate || ""}
							/>
						</div>

						{/* Amount */}
						<div className="pt-2 text-right font-medium text-slate-800 tabular-nums">
							{currencySymbol}{" "}
							{item.amount.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</div>

						{/* Actions */}
						<div className="w-8 pt-1">
							<Button
								className="h-8 w-8 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
								onClick={() => removeItem(item.id)}
								size="icon"
								variant="ghost"
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				))}

				{items.length === 0 && (
					<div className="p-8 text-center text-slate-500">
						No items added yet. Click the button below to add your first item.
					</div>
				)}
			</div>

			<div className="mt-4 flex gap-2">
				<Button
					className="bg-slate-50"
					onClick={addItem}
					size="sm"
					variant="outline"
				>
					<Plus className="mr-2 h-4 w-4" /> Add Item
				</Button>
			</div>
		</div>
	);
}
