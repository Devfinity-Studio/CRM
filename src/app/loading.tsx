import { Loader2 } from "lucide-react";

export default function Loading() {
	return (
		<div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center p-8 text-center">
			<div className="flex flex-col items-center gap-3">
				<div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-xs">
					<Loader2 className="h-7 w-7 animate-spin text-primary" />
				</div>
				<p className="text-xs font-medium text-muted-foreground animate-pulse">
					Loading workspace data...
				</p>
			</div>
		</div>
	);
}

