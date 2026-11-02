"use client";

import { driver } from "driver.js";
import { useEffect, useRef } from "react";
import "driver.js/dist/driver.css";
import { useTheme } from "next-themes";
import { api } from "~/trpc/react";

interface UseTourOptions {
	enabled?: boolean;
}

export function useTour(
	steps: any[],
	tourName: string,
	options?: UseTourOptions,
) {
	const driverObj = useRef<any>(null);
	const { theme } = useTheme();
	const { data: onboardingStatus } = api.onboarding.getStatus.useQuery(
		undefined,
		{
			staleTime: 30000,
		},
	);

	// Onboarding check: tour is enabled only if onboarding is complete or not loaded yet
	const isOnboarded = onboardingStatus?.onboardingComplete ?? false;
	const isTourEnabled = (options?.enabled ?? true) && isOnboarded;

	useEffect(() => {
		// Only initialize on client
		driverObj.current = driver({
			showProgress: true,
			steps,
			animate: true,
			doneBtnText: "Done",
			closeBtnText: "Skip",
			nextBtnText: "Next",
			prevBtnText: "Previous",
			popoverClass: theme === "dark" ? "driverjs-theme-dark" : "",
		});
	}, [steps, theme]);

	const startTour = () => {
		if (!isTourEnabled) {
			return false;
		}
		// Basic check if user has seen this tour (could be saved to DB or localStorage)
		const hasSeen = localStorage.getItem(`tour_${tourName}`);
		if (!hasSeen && driverObj.current) {
			driverObj.current.drive();
			localStorage.setItem(`tour_${tourName}`, "true");
			return true;
		}
		return false;
	};

	const forceStartTour = () => {
		if (!isTourEnabled) {
			return false;
		}
		if (driverObj.current) {
			driverObj.current.drive();
			localStorage.setItem(`tour_${tourName}`, "true");
			return true;
		}
		return false;
	};

	return { startTour, forceStartTour, isTourEnabled };
}
