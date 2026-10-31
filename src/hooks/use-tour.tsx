"use client";

import { driver } from "driver.js";
import { useEffect, useRef } from "react";
import "driver.js/dist/driver.css";
import { useTheme } from "next-themes";

export function useTour(steps: any[], tourName: string) {
	const driverObj = useRef<any>(null);
	const { theme } = useTheme();

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
		// Basic check if user has seen this tour (could be saved to DB or localStorage)
		const hasSeen = localStorage.getItem(`tour_${tourName}`);
		if (!hasSeen && driverObj.current) {
			driverObj.current.drive();
			localStorage.setItem(`tour_${tourName}`, "true");
		}
	};

	const forceStartTour = () => {
		if (driverObj.current) {
			driverObj.current.drive();
			localStorage.setItem(`tour_${tourName}`, "true");
		}
	};

	return { startTour, forceStartTour };
}
