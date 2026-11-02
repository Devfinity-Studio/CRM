"use client";

import { Minus, Plus, ShoppingBag, ShoppingCart } from "lucide-react";
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
	DialogDescription,
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
			<div className="min-h-dvh flex items-center justify-center p-12 text-center text-muted-foreground">
				Loading Catalogue...
			</div>
		);
	if (!data)
		return (
			<div className="min-h-dvh flex items-center justify-center p-12 text-center text-destructive">
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
		<div className="min-h-dvh flex flex-col bg-background">
			<header className="sticky top-0 z-20 border-b border-border/70 bg-card/85 backdrop-blur-md">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
					<div>
						<h1 className="font-bold text-foreground text-lg sm:text-xl tracking-tight">
							{data.organization.name}
						</h1>
						<p className="text-muted-foreground text-xs">Product & Service Catalog</p>
					</div>

					<Dialog onOpenChange={setCheckoutOpen} open={checkoutOpen}>
						<DialogTrigger asChild>
							<Button className="relative rounded-xl min-h-[44px] sm:min-h-9">
								<ShoppingBag className="mr-2 h-4 w-4" />
								<span>Request Quote</span>
								{totalItems > 0 && (
									<span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-mono text-[11px] text-primary-foreground font-bold shadow-sm">
										{totalItems}
									</span>
								)}
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Submit Quote Request</DialogTitle>
								<DialogDescription className="text-xs">
									Send your requested items to {data.organization.name} for an official proposal.
								</DialogDescription>
							</DialogHeader>
							{cartItems.length === 0 ? (
								<div className="py-8 text-center text-muted-foreground text-xs">
									Your cart is empty. Add catalog items below to request a quote.
								</div>
							) : (
								<form className="mt-2 space-y-4" onSubmit={handleSubmit}>
									<div className="space-y-1.5">
										<Label className="text-xs">Your Name</Label>
										<Input
											className="h-10 text-sm"
											onChange={(e) => setName(e.target.value)}
											required
											value={name}
										/>
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs">Email Address</Label>
										<Input
											className="h-10 text-sm"
											onChange={(e) => setEmail(e.target.value)}
											required
											type="email"
											value={email}
										/>
									</div>
									<div className="space-y-1.5">
										<Label className="text-xs">Phone (Optional)</Label>
										<Input
											className="h-10 text-sm"
											onChange={(e) => setPhone(e.target.value)}
											value={phone}
										/>
									</div>

									<div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-border/70 p-3 bg-muted/30">
										{cartItems.map((item) => (
											<div
												className="flex items-center justify-between text-xs"
												key={item.product.id}
											>
												<span className="font-medium text-foreground">
													{item.quantity}× {item.product.name}
												</span>
												<span className="font-mono font-semibold text-foreground">
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
										className="w-full min-h-[44px] rounded-xl"
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

			<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
				{data.products.length === 0 ? (
					<div className="rounded-3xl border border-border/70 border-dashed bg-card/50 py-20 text-center">
						<p className="text-muted-foreground text-sm">
							No products currently available in this catalog.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{data.products.map((product) => (
							<Card className="flex flex-col rounded-3xl border border-border/70 bg-card/85 shadow-sm backdrop-blur-md" key={product.id}>
								<CardHeader className="p-5 pb-2">
									<CardTitle className="text-base font-bold text-foreground">{product.name}</CardTitle>
									<CardDescription className="text-xs font-mono">{product.sku || "SERVICE"}</CardDescription>
								</CardHeader>
								<CardContent className="flex-1 p-5 pt-0">
									<p className="line-clamp-3 text-muted-foreground text-xs">
										{product.description || "No description provided."}
									</p>
								</CardContent>
								<CardFooter className="flex items-center justify-between border-t border-border/60 p-5 pt-4">
									<span className="font-bold font-mono text-foreground text-sm">
										${(product.unitPrice / 100).toFixed(2)}
									</span>
									<Button
										className="min-h-[44px] sm:min-h-9 rounded-xl"
										onClick={() => handleAddToCart(product)}
										size="sm"
									>
										Add to Cart
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
