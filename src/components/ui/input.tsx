"use client";

import * as React from "react";
import { cn } from "~/lib/utils";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				className={cn(
					"flex h-11 min-h-[44px] sm:min-h-9 sm:h-9 w-full rounded-lg border border-input/80 bg-background/70 px-3.5 py-2 text-foreground text-base sm:text-sm shadow-2xs transition-all file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={ref}
				type={type}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
