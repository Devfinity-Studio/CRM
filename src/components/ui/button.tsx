"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-sm",
				destructive:
					"bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
				outline:
					"border border-border/80 bg-background/60 text-foreground shadow-2xs hover:bg-accent/70 hover:text-foreground hover:border-border",
				secondary:
					"bg-secondary text-secondary-foreground shadow-2xs hover:bg-secondary/80",
				ghost:
					"text-foreground/80 hover:bg-accent/60 hover:text-foreground",
				link: "text-primary underline-offset-4 hover:underline p-0 h-auto font-normal",
			},
			size: {
				default:
					"h-11 min-h-[44px] sm:min-h-9 sm:h-9 px-4 py-2",
				sm: "h-9 min-h-[36px] sm:min-h-8 sm:h-8 rounded-md px-3 text-xs",
				lg: "h-12 min-h-[48px] sm:min-h-10 sm:h-10 rounded-lg px-6 text-base sm:text-sm",
				icon: "h-11 w-11 min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9 sm:h-9 sm:w-9 rounded-lg p-0",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
