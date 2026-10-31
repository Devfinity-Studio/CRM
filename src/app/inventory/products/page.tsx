"use client";

import { Edit, Package, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

export default function ProductsPage() {
	const {
		data: products,
		isLoading,
		refetch,
	} = api.inventory.getProducts.useQuery();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<any>(null);

	// Form State
	const [name, setName] = useState("");
	const [sku, setSku] = useState("");
	const [type, setType] = useState<"PRODUCT" | "SERVICE">("PRODUCT");
	const [description, setDescription] = useState("");
	const [unitPrice, setUnitPrice] = useState("");
	const [unit, setUnit] = useState("");
	const [stockQuantity, setStockQuantity] = useState("0");
	const [isPublic, setIsPublic] = useState(false);

	const createMutation = api.inventory.createProduct.useMutation({
		onSuccess: () => {
			toast.success("Item created successfully.");
			setDialogOpen(false);
			refetch();
		},
		onError: (err) => toast.error(`Error: ${err.message}`),
	});

	const updateMutation = api.inventory.updateProduct.useMutation({
		onSuccess: () => {
			toast.success("Item updated successfully.");
			setDialogOpen(false);
			refetch();
		},
		onError: (err) => toast.error(`Error: ${err.message}`),
	});

	const deleteMutation = api.inventory.deleteProduct.useMutation({
		onSuccess: () => {
			toast.success("Item deleted successfully.");
			refetch();
		},
		onError: (err) => toast.error(`Error: ${err.message}`),
	});

	const handleOpenDialog = (item?: any) => {
		if (item) {
			setEditingItem(item);
			setName(item.name);
			setSku(item.sku || "");
			setType(item.type);
			setDescription(item.description || "");
			setUnitPrice((item.unitPrice / 100).toString());
			setUnit(item.unit || "");
			setStockQuantity(item.stockQuantity.toString());
			setIsPublic(item.isPublic || false);
		} else {
			setEditingItem(null);
			setName("");
			setSku("");
			setType("PRODUCT");
			setDescription("");
			setUnitPrice("");
			setUnit("pcs");
			setStockQuantity("0");
			setIsPublic(false);
		}
		setDialogOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const priceCents = Math.round(parseFloat(unitPrice) * 100);
		const stock = parseInt(stockQuantity, 10) || 0;

		if (editingItem) {
			updateMutation.mutate({
				id: editingItem.id,
				name,
				sku: sku || undefined,
				type,
				description: description || undefined,
				unitPrice: priceCents,
				unit: unit || undefined,
				stockQuantity: type === "PRODUCT" ? stock : 0,
				isPublic,
			});
		} else {
			createMutation.mutate({
				name,
				sku: sku || undefined,
				type,
				description: description || undefined,
				unitPrice: priceCents,
				unit: unit || undefined,
				stockQuantity: type === "PRODUCT" ? stock : 0,
				isPublic,
			});
		}
	};

	const handleDelete = (id: string) => {
		if (confirm("Are you sure you want to delete this item?")) {
			deleteMutation.mutate({ id });
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Products & Services
					</h1>
					<p className="mt-1 text-muted-foreground">
						Manage your catalog of billable items and track inventory.
					</p>
				</div>
				<Button onClick={() => handleOpenDialog()}>
					<Plus className="mr-2 h-4 w-4" /> New Item
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Catalog</CardTitle>
					<CardDescription>
						A list of all products and services available to be added to Quotes
						and Invoices.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Name / SKU</TableHead>
								<TableHead>Description</TableHead>
								<TableHead>Price</TableHead>
								<TableHead>Inventory</TableHead>
								<TableHead>Public Catalogue</TableHead>
								<TableHead className="w-[100px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell className="h-24 text-center" colSpan={6}>
										Loading...
									</TableCell>
								</TableRow>
							) : products?.length === 0 ? (
								<TableRow>
									<TableCell
										className="h-24 text-center text-muted-foreground"
										colSpan={6}
									>
										No items in catalog yet. Add one to get started.
									</TableCell>
								</TableRow>
							) : (
								products?.map((item) => (
									<TableRow key={item.id}>
										<TableCell>
											<Badge
												variant={
													item.type === "PRODUCT" ? "default" : "secondary"
												}
											>
												{item.type}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="font-medium">{item.name}</div>
											{item.sku && (
												<div className="mt-1 text-slate-500 text-xs">
													SKU: {item.sku}
												</div>
											)}
										</TableCell>
										<TableCell className="max-w-xs truncate text-slate-600">
											{item.description || "-"}
										</TableCell>
										<TableCell className="font-semibold text-slate-700">
											{new Intl.NumberFormat("en-US", {
												style: "currency",
												currency: "USD", // TODO: use org currency
											}).format(item.unitPrice / 100)}
											{item.unit && (
												<span className="ml-1 font-normal text-slate-400 text-xs">
													/ {item.unit}
												</span>
											)}
										</TableCell>
										<TableCell>
											{item.type === "PRODUCT" ? (
												<div className="flex items-center gap-2">
													<Package className="h-4 w-4 text-slate-400" />
													<span
														className={
															item.stockQuantity <= 0
																? "font-medium text-destructive"
																: "text-slate-700"
														}
													>
														{item.stockQuantity} in stock
													</span>
												</div>
											) : (
												<span className="text-slate-400 text-xs italic">
													N/A
												</span>
											)}
										</TableCell>
										<TableCell>
											{item.isPublic ? (
												<Badge className="bg-emerald-500/10 text-emerald-500">
													Visible
												</Badge>
											) : (
												<Badge variant="secondary">Hidden</Badge>
											)}
										</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Button
													onClick={() => handleOpenDialog(item)}
													size="icon"
													variant="ghost"
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													className="text-destructive"
													onClick={() => handleDelete(item.id)}
													size="icon"
													variant="ghost"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editingItem ? "Edit Item" : "New Item"}</DialogTitle>
						<DialogDescription>
							{editingItem
								? "Update the details for this item."
								: "Add a new product or service to your catalog."}
						</DialogDescription>
					</DialogHeader>

					<form className="space-y-4 py-4" onSubmit={handleSubmit}>
						<div className="grid grid-cols-[120px_1fr] gap-4">
							<div className="space-y-2">
								<Label>Type</Label>
								<Select onValueChange={(val: any) => setType(val)} value={type}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="PRODUCT">Product</SelectItem>
										<SelectItem value="SERVICE">Service</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>
									Item Name <span className="text-destructive">*</span>
								</Label>
								<Input
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. Website Design"
									required
									value={name}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>SKU (Optional)</Label>
								<Input
									onChange={(e) => setSku(e.target.value)}
									placeholder="e.g. WD-001"
									value={sku}
								/>
							</div>
							<div className="space-y-2">
								<Label>Unit (Optional)</Label>
								<Input
									onChange={(e) => setUnit(e.target.value)}
									placeholder="e.g. hr, pcs, setup"
									value={unit}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Description (Optional)</Label>
							<Textarea
								className="resize-none"
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Detailed description for the invoice..."
								value={description}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>
									Unit Price ($) <span className="text-destructive">*</span>
								</Label>
								<Input
									min="0"
									onChange={(e) => setUnitPrice(e.target.value)}
									required
									step="0.01"
									type="number"
									value={unitPrice}
								/>
							</div>
							{type === "PRODUCT" && (
								<div className="space-y-2">
									<Label>
										Stock Quantity <span className="text-destructive">*</span>
									</Label>
									<Input
										onChange={(e) => setStockQuantity(e.target.value)}
										required
										step="1"
										type="number"
										value={stockQuantity}
									/>
								</div>
							)}
						</div>
						<div className="flex flex-col justify-end space-y-2 pb-2">
							<label className="flex items-center space-x-2">
								<input
									checked={isPublic}
									className="rounded border-gray-300"
									onChange={(e) => setIsPublic(e.target.checked)}
									type="checkbox"
								/>
								<span className="font-medium text-sm leading-none">
									Visible in Public Catalogue
								</span>
							</label>
						</div>

						<DialogFooter className="pt-4">
							<Button
								onClick={() => setDialogOpen(false)}
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
							<Button
								disabled={createMutation.isPending || updateMutation.isPending}
								type="submit"
							>
								{editingItem ? "Save Changes" : "Create Item"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
