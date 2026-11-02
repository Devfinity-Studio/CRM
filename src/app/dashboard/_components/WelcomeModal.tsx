"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";

interface WelcomeModalProps {
	onStartTour?: () => void;
}

export function WelcomeModal({ onStartTour }: WelcomeModalProps = {}) {
	const [isOpen, setIsOpen] = useState(false);
	const { data: status, refetch } = api.onboarding.getStatus.useQuery();
	const markSeen = api.onboarding.markWelcomeSeen.useMutation({
		onSuccess: () => refetch(),
	});

	useEffect(() => {
		// Only display welcome modal when user has completed onboarding and has not seen the welcome modal yet
		if (status && status.onboardingComplete && !status.hasSeenWelcome) {
			setIsOpen(true);
		}
	}, [status]);

	const handleClose = () => {
		setIsOpen(false);
		markSeen.mutate();
		if (onStartTour) {
			onStartTour();
		}
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Welcome to DevCRM! 🎉</DialogTitle>
					<DialogDescription>
						We are thrilled to have you here. DevCRM is your all-in-one platform
						to manage your business operations, clients, and sales.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<p className="text-muted-foreground text-sm">
						Get started by checking out your personalized setup checklist on the
						dashboard. It will guide you through creating your first products,
						leads, and configuring your profile.
					</p>
				</div>
				<DialogFooter>
					<Button className="min-h-[44px] w-full sm:w-auto font-medium" onClick={handleClose}>
						Let's go!
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
