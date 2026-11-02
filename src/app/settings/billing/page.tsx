"use client";

import {
	ArrowRight,
	Check,
	CheckCircle2,
	CreditCard,
	ExternalLink,
	Loader2,
	ShieldCheck,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { api } from "~/trpc/react";

export default function SettingsBillingPage() {
	const searchParams = useSearchParams();
	const isSuccessRedirect = searchParams.get("status") === "success";

	const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
		"yearly",
	);
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

	const {
		data: subData,
		isLoading: isLoadingSub,
		refetch: refetchSub,
	} = api.billing.getPlatformSubscription.useQuery();

	const { data: availablePlans, isLoading: isLoadingPlans } =
		api.billing.getAvailablePlans.useQuery();

	const checkoutMutation =
		api.billing.createPlatformCheckoutSession.useMutation({
			onSuccess: (data) => {
				if (data.checkoutUrl) {
					window.location.href = data.checkoutUrl;
				}
			},
		});

	const portalMutation = api.billing.createCustomerPortalSession.useMutation({
		onSuccess: (data) => {
			if (data.portalUrl) {
				window.location.href = data.portalUrl;
			}
		},
	});

	const handleUpgrade = (planId: string) => {
		setSelectedPlanId(planId);
		checkoutMutation.mutate({
			planId,
			billingCycle,
			returnUrl: `${window.location.origin}/settings/billing`,
		});
	};

	const handleOpenPortal = () => {
		portalMutation.mutate({
			returnUrl: window.location.href,
		});
	};

	if (isLoadingSub || isLoadingPlans) {
		return (
			<div className="flex h-96 items-center justify-center">
				<div className="flex flex-col items-center gap-3">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<p className="text-muted-foreground text-sm">
						Loading billing & subscription details...
					</p>
				</div>
			</div>
		);
	}

	const org = subData?.organization;
	const currentPlan = subData?.plan;
	const subscription = subData?.subscription;
	const usage = subData?.usage;

	const calculatePercentage = (used: number, max: number) => {
		if (!max || max <= 0) return 0;
		return Math.min(100, Math.round((used / max) * 100));
	};

	return (
		<div className="space-y-8">
			{/* Success Alert Banner on Return from Checkout */}
			{isSuccessRedirect && (
				<div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-900 dark:text-emerald-200">
					<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
					<div className="flex-1 text-sm">
						<span className="font-semibold">Checkout completed!</span> Your
						subscription transaction was submitted to the payment gateway.
						Entitlements and quotas are synchronized in real time.
					</div>
					<Button
						className="rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
						onClick={() => refetchSub()}
						size="sm"
						variant="outline"
					>
						Refresh Status
					</Button>
				</div>
			)}

			{/* Current Subscription Hero */}
			<Card className="rounded-3xl border border-border/70 bg-gradient-to-br from-card to-card/60 shadow-xs">
				<CardHeader className="pb-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="flex items-center gap-2">
								<Badge
									className="rounded-lg border-primary/30 bg-primary/10 font-semibold text-primary"
									variant="outline"
								>
									Current Plan
								</Badge>
								<Badge
									className={`rounded-lg ${
										subscription?.status === "ACTIVE"
											? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
											: "border-amber-500/30 bg-amber-500/10 text-amber-600"
									}`}
									variant="outline"
								>
									{subscription?.status || org?.status || "ACTIVE"}
								</Badge>
							</div>
							<CardTitle className="mt-2 font-bold text-2xl text-foreground tracking-tight sm:text-3xl">
								{currentPlan?.name || org?.plan || "Free Tier"}
							</CardTitle>
							<CardDescription className="mt-1 text-muted-foreground text-xs sm:text-sm">
								{subscription?.currentPeriodEnd
									? `Renews on ${new Date(
											subscription.currentPeriodEnd,
										).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										})} via Dodo Payments`
									: "Standard usage tier with baseline capacity limits."}
							</CardDescription>
						</div>

						<div className="flex items-center gap-2">
							<Button
								className="rounded-2xl border-border/80 font-medium text-foreground text-xs hover:bg-muted sm:text-sm"
								disabled={portalMutation.isPending}
								onClick={handleOpenPortal}
								variant="outline"
							>
								{portalMutation.isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<CreditCard className="mr-2 h-4 w-4 text-primary" />
								)}
								Manage in Customer Portal
								<ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-60" />
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="pt-2">
					<div className="border-border/50 border-t pt-4">
						<h4 className="mb-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
							Resource & Quota Usage
						</h4>
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
							{/* Contacts Meter */}
							<div className="space-y-2 rounded-2xl border border-border/60 bg-background/50 p-4">
								<div className="flex justify-between font-medium text-xs">
									<span className="text-muted-foreground">Contacts</span>
									<span className="font-semibold text-foreground">
										{usage?.contacts.used} / {usage?.contacts.max}
									</span>
								</div>
								<Progress
									className="h-2 rounded-full"
									value={calculatePercentage(
										usage?.contacts.used ?? 0,
										usage?.contacts.max ?? 100,
									)}
								/>
								<div className="text-[11px] text-muted-foreground">
									{calculatePercentage(
										usage?.contacts.used ?? 0,
										usage?.contacts.max ?? 100,
									)}
									% capacity
								</div>
							</div>

							{/* Invoices Meter */}
							<div className="space-y-2 rounded-2xl border border-border/60 bg-background/50 p-4">
								<div className="flex justify-between font-medium text-xs">
									<span className="text-muted-foreground">
										Monthly Invoices
									</span>
									<span className="font-semibold text-foreground">
										{usage?.invoices.used} / {usage?.invoices.max}
									</span>
								</div>
								<Progress
									className="h-2 rounded-full"
									value={calculatePercentage(
										usage?.invoices.used ?? 0,
										usage?.invoices.max ?? 50,
									)}
								/>
								<div className="text-[11px] text-muted-foreground">
									{calculatePercentage(
										usage?.invoices.used ?? 0,
										usage?.invoices.max ?? 50,
									)}
									% capacity
								</div>
							</div>

							{/* Team Seats Meter */}
							<div className="space-y-2 rounded-2xl border border-border/60 bg-background/50 p-4">
								<div className="flex justify-between font-medium text-xs">
									<span className="text-muted-foreground">Team Seats</span>
									<span className="font-semibold text-foreground">
										{usage?.teamSeats.used} / {usage?.teamSeats.max}
									</span>
								</div>
								<Progress
									className="h-2 rounded-full"
									value={calculatePercentage(
										usage?.teamSeats.used ?? 1,
										usage?.teamSeats.max ?? 3,
									)}
								/>
								<div className="text-[11px] text-muted-foreground">
									{calculatePercentage(
										usage?.teamSeats.used ?? 1,
										usage?.teamSeats.max ?? 3,
									)}
									% capacity
								</div>
							</div>

							{/* Automations Meter */}
							<div className="space-y-2 rounded-2xl border border-border/60 bg-background/50 p-4">
								<div className="flex justify-between font-medium text-xs">
									<span className="text-muted-foreground">
										Monthly Automations
									</span>
									<span className="font-semibold text-foreground">
										{usage?.automations.used} / {usage?.automations.max}
									</span>
								</div>
								<Progress
									className="h-2 rounded-full"
									value={calculatePercentage(
										usage?.automations.used ?? 0,
										usage?.automations.max ?? 500,
									)}
								/>
								<div className="text-[11px] text-muted-foreground">
									{calculatePercentage(
										usage?.automations.used ?? 0,
										usage?.automations.max ?? 500,
									)}
									% capacity
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Available Plans & Upgrade Grid */}
			<div className="space-y-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 className="font-bold text-foreground text-xl tracking-tight sm:text-2xl">
							Upgrade or Change Your Plan
						</h3>
						<p className="mt-0.5 text-muted-foreground text-xs sm:text-sm">
							Choose the plan that fits your business volume. Quotas and team
							seats scale immediately upon payment.
						</p>
					</div>

					{/* Billing Cycle Switcher */}
					<div className="flex items-center self-start rounded-2xl border border-border/80 bg-muted/60 p-1 sm:self-auto">
						<button
							className={`rounded-xl px-3 py-1.5 font-medium text-xs transition-all ${
								billingCycle === "monthly"
									? "bg-background text-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setBillingCycle("monthly")}
							type="button"
						>
							Monthly
						</button>
						<button
							className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium text-xs transition-all ${
								billingCycle === "yearly"
									? "bg-background text-foreground shadow-xs"
									: "text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setBillingCycle("yearly")}
							type="button"
						>
							Annual
							<span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 font-semibold text-[10px] text-emerald-600 dark:text-emerald-400">
								Save ~20%
							</span>
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					{availablePlans?.map((plan) => {
						const isCurrent =
							currentPlan?.id === plan.id || org?.planId === plan.id;
						const price =
							billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
						const formattedPrice = new Intl.NumberFormat("en-US", {
							style: "currency",
							currency: plan.currency || "USD",
							maximumFractionDigits: 0,
						}).format(price / 100);

						const isPendingThisPlan =
							checkoutMutation.isPending && selectedPlanId === plan.id;

						return (
							<Card
								className={`flex flex-col justify-between rounded-3xl border transition-all ${
									plan.isPopular
										? "border-primary/50 shadow-md ring-1 ring-primary/30"
										: "border-border/70 hover:border-border"
								}`}
								key={plan.id}
							>
								<CardHeader className="pb-4">
									<div className="flex items-center justify-between">
										<CardTitle className="font-bold text-foreground text-xl">
											{plan.name}
										</CardTitle>
										{plan.isPopular && (
											<Badge className="rounded-lg bg-primary font-semibold text-primary-foreground text-xs">
												Most Popular
											</Badge>
										)}
									</div>
									<CardDescription className="mt-1 line-clamp-2 text-muted-foreground text-xs">
										{plan.description ||
											"Empower your sales, inventory, and billing operations."}
									</CardDescription>

									<div className="mt-4 flex items-baseline gap-1">
										<span className="font-extrabold text-3xl text-foreground tracking-tight">
											{formattedPrice}
										</span>
										<span className="text-muted-foreground text-xs">
											/{billingCycle === "yearly" ? "year" : "mo"}
										</span>
									</div>
								</CardHeader>

								<CardContent className="space-y-3 pt-2 pb-6">
									<div className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Included Quotas:
									</div>
									<ul className="space-y-2 text-foreground/90 text-xs">
										<li className="flex items-center gap-2">
											<Check className="h-4 w-4 shrink-0 text-primary" />
											<span>
												Up to{" "}
												<strong>{plan.maxContacts.toLocaleString()}</strong>{" "}
												contacts
											</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-4 w-4 shrink-0 text-primary" />
											<span>
												Up to{" "}
												<strong>{plan.maxInvoices.toLocaleString()}</strong>{" "}
												invoices
											</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-4 w-4 shrink-0 text-primary" />
											<span>
												<strong>{plan.maxTeamSeats}</strong> team seats included
											</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-4 w-4 shrink-0 text-primary" />
											<span>
												<strong>
													{plan.maxAutomationsMonthly.toLocaleString()}
												</strong>{" "}
												monthly automations
											</span>
										</li>
										<li className="flex items-center gap-2">
											<Check className="h-4 w-4 shrink-0 text-primary" />
											<span>Standard Webhooks & domain event bus</span>
										</li>
									</ul>
								</CardContent>

								<CardFooter className="pt-2">
									<Button
										className="w-full rounded-2xl py-5 font-semibold text-xs sm:text-sm"
										disabled={isCurrent || checkoutMutation.isPending}
										onClick={() => handleUpgrade(plan.id)}
										type="button"
										variant={
											isCurrent
												? "outline"
												: plan.isPopular
													? "default"
													: "secondary"
										}
									>
										{isPendingThisPlan ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Opening Checkout...
											</>
										) : isCurrent ? (
											"Active Plan"
										) : (
											<>
												Upgrade to {plan.name}
												<ArrowRight className="ml-1.5 h-4 w-4" />
											</>
										)}
									</Button>
								</CardFooter>
							</Card>
						);
					})}
				</div>
			</div>

			{/* Dodo Payments Trust & Merchant of Record Note */}
			<div className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-muted/30 p-6 text-muted-foreground text-xs sm:flex-row">
				<ShieldCheck className="h-8 w-8 shrink-0 text-primary" />
				<div className="space-y-1">
					<p className="font-semibold text-foreground text-sm">
						Enterprise-Grade Payment Security & Compliance
					</p>
					<p>
						Transactions are securely processed by{" "}
						<strong>Dodo Payments</strong> (acting as Merchant of Record). All
						major credit/debit cards, Apple Pay, Google Pay, and localized bank
						rails are supported. Regional sales taxes, VAT, and compliant tax
						receipts are issued automatically.
					</p>
				</div>
			</div>
		</div>
	);
}
