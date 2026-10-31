import type * as React from "react";
import { cn } from "~/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
	icon?: React.ElementType;
	title: string;
	description: string;
	action?: React.ReactNode;
}

export function EmptyState({
	className,
	icon: Icon,
	title,
	description,
	action,
	...props
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"fade-in-50 flex min-h-[400px] animate-in flex-col items-center justify-center rounded-md border border-dashed p-8 text-center",
				className,
			)}
			{...props}
		>
			<div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
				{Icon && (
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
						<Icon className="h-10 w-10 text-muted-foreground" />
					</div>
				)}
				<h3 className="mt-4 font-semibold text-lg">{title}</h3>
				<p className="mt-2 mb-4 text-muted-foreground text-sm">{description}</p>
				{action}
			</div>
		</div>
	);
}
