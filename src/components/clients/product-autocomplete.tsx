"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

interface Product {
	id: string;
	name: string;
	sku: string | null;
	unitPrice: number;
	description: string | null;
	unit: string | null;
}

interface ProductAutocompleteProps {
	onSelect: (product: Product | { isNew: true; name: string }) => void;
	placeholder?: string;
}

export function ProductAutocomplete({
	onSelect,
	placeholder = "Search or create item...",
}: ProductAutocompleteProps) {
	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");

	// Use trpc to fetch products
	const { data: products = [], isLoading } =
		api.inventory.getProducts.useQuery();

	const handleSelect = (product: Product) => {
		setOpen(false);
		onSelect(product);
		setSearchValue("");
	};

	const handleCreateNew = () => {
		setOpen(false);
		onSelect({ isNew: true, name: searchValue });
		setSearchValue("");
	};

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className="w-full justify-between font-normal"
					role="combobox"
					variant="outline"
				>
					{placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[300px] p-0">
				<Command shouldFilter={false}>
					<CommandInput
						onValueChange={setSearchValue}
						placeholder="Type item name or SKU..."
						value={searchValue}
					/>
					<CommandList>
						<CommandEmpty className="p-2">
							<div className="flex flex-col items-center justify-center gap-2 py-4">
								<p className="text-muted-foreground text-sm">No item found.</p>
								<Button
									className="mt-2 w-full"
									disabled={!searchValue.trim()}
									onClick={handleCreateNew}
									size="sm"
								>
									<Plus className="mr-2 h-4 w-4" />
									Create "{searchValue}"
								</Button>
							</div>
						</CommandEmpty>
						<CommandGroup>
							{products
								.filter(
									(p) =>
										p.name.toLowerCase().includes(searchValue.toLowerCase()) ||
										(p.sku &&
											p.sku.toLowerCase().includes(searchValue.toLowerCase())),
								)
								.map((product) => (
									<CommandItem
										className="flex cursor-pointer flex-col items-start"
										key={product.id}
										onSelect={() => handleSelect(product)}
										value={product.name}
									>
										<div className="font-medium">{product.name}</div>
										<div className="mt-1 flex w-full justify-between text-muted-foreground text-xs">
											<span>{product.sku || "No SKU"}</span>
											<span>Rs {(product.unitPrice / 100).toFixed(2)}</span>
										</div>
									</CommandItem>
								))}
						</CommandGroup>

						{searchValue.trim() &&
							products.filter(
								(p) => p.name.toLowerCase() === searchValue.toLowerCase(),
							).length === 0 && (
								<div className="border-t p-1">
									<CommandItem
										className="flex cursor-pointer items-center text-primary"
										onSelect={handleCreateNew}
										value={searchValue}
									>
										<Plus className="mr-2 h-4 w-4" />
										Create "{searchValue}" as new item
									</CommandItem>
								</div>
							)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
