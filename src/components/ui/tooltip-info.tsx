import { HelpCircle } from "lucide-react";
import type * as React from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";

interface InfoTooltipProps {
	content: React.ReactNode;
}

export function InfoTooltip({ content }: InfoTooltipProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<HelpCircle className="ml-1 inline-block h-4 w-4 cursor-help text-muted-foreground transition-colors hover:text-foreground" />
			</TooltipTrigger>
			<TooltipContent className="max-w-[250px] text-center">
				{content}
			</TooltipContent>
		</Tooltip>
	);
}
