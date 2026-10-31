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
					"flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-slate-100 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
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
