"use client";

import { Edit, Package, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
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
		<DashboardLayout>
			<div className="mx-auto flex max-w-[1600px] flex-col gap-6 pb-8">
				{/* Top Control Bar */}
				<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 shadow-sm backdrop-blur-md">
					<div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
						<div className="flex flex-col gap-1.5">
							<div className="flex items-center gap-2.5">
								<span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 font-semibold text-primary text-xs">
									Inventory &amp; SKUs
								</span>
								<span className="text-muted-foreground text-xs">
									Product Catalog &amp; Services
								</span>
							</div>
							<h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								Products &amp; Inventory
							</h1>
							<p className="text-muted-foreground text-sm">
								Manage billable items, SKU codes, pricing tiers, and stock availability.
							</p>
						</div>

						<div className="flex items-center gap-3">
							<Button className="gap-2 rounded-xl shadow-xs" onClick={() => handleOpenDialog()} size="sm">
								<Plus className="h-4 w-4" />
								<span>New Item</span>
							</Button>
						</div>
					</div>
					<div className="pointer-events-none absolute -top-16 -right-16 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
				</section>

				{/* Products Table Card */}
				<Card className="rounded-2xl border border-border/70 bg-card/75 backdrop-blur-md">
					<CardHeader className="border-b border-border/60 pb-4">
						<CardTitle className="font-bold text-foreground text-lg">Catalog Items</CardTitle>
						<CardDescription className="text-muted-foreground text-sm">
							All active products and services available on Quotes and Invoices.
						</CardDescription>
					</CardHeader>
					<CardContent className="pt-4">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Type</TableHead>
									<TableHead>Name / SKU</TableHead>
									<TableHead>Description</TableHead>
									<TableHead>Price</TableHead>
									<TableHead>Inventory</TableHead>
									<TableHead>Visibility</TableHead>
									<TableHead className="w-[100px] text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell className="h-24 text-center text-muted-foreground" colSpan={7}>
											Loading catalog items...
										</TableCell>
									</TableRow>
								) : products?.length === 0 ? (
									<TableRow>
										<TableCell
											className="h-24 text-center text-muted-foreground"
											colSpan={7}
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
												<div className="font-semibold text-foreground">{item.name}</div>
												{item.sku && (
													<div className="mt-0.5 font-mono text-muted-foreground text-xs">
														SKU: {item.sku}
													</div>
												)}
											</TableCell>
											<TableCell className="max-w-xs truncate text-muted-foreground text-sm">
												{item.description || "-"}
											</TableCell>
											<TableCell className="font-mono font-semibold text-foreground">
												{new Intl.NumberFormat("en-US", {
													style: "currency",
													currency: "USD",
												}).format(item.unitPrice / 100)}
												{item.unit && (
													<span className="ml-1 font-normal text-muted-foreground text-xs">
														/ {item.unit}
													</span>
												)}
											</TableCell>
											<TableCell>
												{item.type === "PRODUCT" ? (
													<div className="flex items-center gap-2">
														<Package className="h-4 w-4 text-muted-foreground" />
														<span
															className={
																item.stockQuantity <= 0
																	? "font-medium text-destructive"
																	: "font-medium text-foreground"
															}
														>
															{item.stockQuantity} in stock
														</span>
													</div>
												) : (
													<span className="text-muted-foreground text-xs italic">
														Service (Unlimited)
													</span>
												)}
											</TableCell>
											<TableCell>
												{item.isPublic ? (
													<Badge variant="success">
														Public
													</Badge>
												) : (
													<Badge variant="secondary">Internal</Badge>
												)}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-1">
													<Button
														onClick={() => handleOpenDialog(item)}
														size="icon"
														variant="ghost"
													>
														<Edit className="h-4 w-4" />
													</Button>
													<Button
														className="text-muted-foreground hover:text-destructive"
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
									? "Update the details for this catalog item."
									: "Add a new product or service to your catalog."}
							</DialogDescription>
						</DialogHeader>

						<form className="space-y-4 py-2" onSubmit={handleSubmit}>
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
							<div className="flex flex-col justify-end space-y-2 pt-1 pb-2">
								<label className="flex items-center space-x-2">
									<input
										checked={isPublic}
										className="rounded border-border accent-primary"
										onChange={(e) => setIsPublic(e.target.checked)}
										type="checkbox"
									/>
									<span className="font-medium text-sm text-foreground leading-none">
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
		</DashboardLayout>
	);
}
