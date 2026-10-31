"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useParams } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

export default function PublicCataloguePage() {
	const { orgId } = useParams<{ orgId: string }>();
	const { data, isLoading } = api.public.getCatalogue.useQuery({ orgId });
	const submitRequest = api.public.submitQuoteRequest.useMutation({
		onSuccess: () => {
			toast.success("Quote request submitted successfully!");
			setCart({});
			setCheckoutOpen(false);
		},
		onError: (err) => {
			toast.error(`Error: ${err.message}`);
		},
	});

	const [cart, setCart] = useState<
		Record<string, { product: any; quantity: number }>
	>({});
	const [checkoutOpen, setCheckoutOpen] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");

	if (isLoading)
		return (
			<div className="p-12 text-center text-muted-foreground">
				Loading Catalogue...
			</div>
		);
	if (!data)
		return (
			<div className="p-12 text-center text-destructive">
				Catalogue not found.
			</div>
		);

	const handleAddToCart = (product: any) => {
		setCart((prev) => ({
			...prev,
			[product.id]: {
				product,
				quantity: (prev[product.id]?.quantity || 0) + 1,
			},
		}));
		toast.success(`${product.name} added to cart`);
	};

	const cartItems = Object.values(cart);
	const totalItems = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (cartItems.length === 0) return toast.error("Cart is empty");

		submitRequest.mutate({
			orgId,
			name,
			email,
			phone,
			items: cartItems.map((item) => ({
				productId: item.product.id,
				quantity: item.quantity,
				price: item.product.unitPrice,
			})),
		});
	};

	return (
		<div className="min-h-screen bg-slate-50">
			<header className="sticky top-0 z-10 border-b bg-white">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
					<div>
						<h1 className="font-bold text-xl">{data.organization.name}</h1>
						<p className="text-muted-foreground text-sm">Product Catalogue</p>
					</div>

					<Dialog onOpenChange={setCheckoutOpen} open={checkoutOpen}>
						<DialogTrigger asChild>
							<Button className="relative">
								<ShoppingCart className="mr-2 h-4 w-4" />
								Request Quote
								{totalItems > 0 && (
									<span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
										{totalItems}
									</span>
								)}
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Submit Quote Request</DialogTitle>
							</DialogHeader>
							{cartItems.length === 0 ? (
								<div className="py-8 text-center text-muted-foreground">
									Your cart is empty.
								</div>
							) : (
								<form className="mt-4 space-y-4" onSubmit={handleSubmit}>
									<div className="space-y-2">
										<Label>Your Name</Label>
										<Input
											onChange={(e) => setName(e.target.value)}
											required
											value={name}
										/>
									</div>
									<div className="space-y-2">
										<Label>Email Address</Label>
										<Input
											onChange={(e) => setEmail(e.target.value)}
											required
											type="email"
											value={email}
										/>
									</div>
									<div className="space-y-2">
										<Label>Phone (Optional)</Label>
										<Input
											onChange={(e) => setPhone(e.target.value)}
											value={phone}
										/>
									</div>

									<div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
										{cartItems.map((item) => (
											<div
												className="flex items-center justify-between text-sm"
												key={item.product.id}
											>
												<span>
													{item.quantity}x {item.product.name}
												</span>
												<span className="font-medium">
													$
													{(
														(item.product.unitPrice * item.quantity) /
														100
													).toFixed(2)}
												</span>
											</div>
										))}
									</div>

									<Button
										className="w-full"
										disabled={submitRequest.isPending}
										type="submit"
									>
										{submitRequest.isPending ? "Submitting..." : "Send Request"}
									</Button>
								</form>
							)}
						</DialogContent>
					</Dialog>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 py-8">
				{data.products.length === 0 ? (
					<div className="rounded-xl border border-dashed bg-white py-20 text-center">
						<p className="text-muted-foreground">
							No products available in this catalogue currently.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
						{data.products.map((product) => (
							<Card className="flex flex-col" key={product.id}>
								<CardHeader>
									<CardTitle className="text-lg">{product.name}</CardTitle>
									<CardDescription>{product.sku || "No SKU"}</CardDescription>
								</CardHeader>
								<CardContent className="flex-1">
									<p className="line-clamp-3 text-muted-foreground text-sm">
										{product.description || "No description provided."}
									</p>
								</CardContent>
								<CardFooter className="flex items-center justify-between border-t pt-4">
									<span className="font-bold">
										${(product.unitPrice / 100).toFixed(2)}
									</span>
									<Button onClick={() => handleAddToCart(product)} size="sm">
										Add
									</Button>
								</CardFooter>
							</Card>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
