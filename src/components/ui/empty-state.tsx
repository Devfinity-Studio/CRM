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
				"flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center backdrop-blur-xs transition-all",
				className,
			)}
			{...props}
		>
			<div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
				{Icon && (
					<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
						<Icon className="h-8 w-8" />
					</div>
				)}
				<h3 className="font-semibold text-foreground text-lg tracking-tight">
					{title}
				</h3>
				<p className="mt-2 mb-6 text-muted-foreground text-sm leading-relaxed">
					{description}
				</p>
				{action && <div className="flex items-center gap-3">{action}</div>}
			</div>
		</div>
	);
}
