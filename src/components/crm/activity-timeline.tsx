"use client";

import { formatDistanceToNow } from "date-fns";
import {
	Calendar,
	Clock,
	Loader2,
	Mail,
	MessageSquare,
	Phone,
	Send,
	Sparkles,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

interface ActivityTimelineProps {
	companyId?: string;
	dealId?: string;
	contactId?: string;
}

type ActivityType = "NOTE" | "CALL" | "EMAIL" | "MEETING";

const ACTIVITY_TYPES: {
	id: ActivityType;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	color: string;
	glowClass: string;
	placeholder: string;
}[] = [
	{
		id: "NOTE",
		label: "Note",
		icon: MessageSquare,
		color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
		glowClass: "ring-amber-500/20",
		placeholder: "Record meeting insights, internal notes, or follow-ups...",
	},
	{
		id: "CALL",
		label: "Call",
		icon: Phone,
		color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
		glowClass: "ring-sky-500/20",
		placeholder:
			"Log phone conversation takeaways, objections, and next steps...",
	},
	{
		id: "EMAIL",
		label: "Email",
		icon: Mail,
		color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
		glowClass: "ring-indigo-500/20",
		placeholder: "Log email summary, proposal delivery, or client queries...",
	},
	{
		id: "MEETING",
		label: "Meeting",
		icon: Calendar,
		color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
		glowClass: "ring-emerald-500/20",
		placeholder:
			"Document agenda points, client attendees, and action items...",
	},
];

export function ActivityTimeline({
	companyId,
	dealId,
	contactId,
}: ActivityTimelineProps) {
	const [content, setContent] = useState("");
	const [type, setType] = useState<ActivityType>("NOTE");

	const {
		data: activities,
		isLoading,
		refetch,
	} = api.crm.getActivityNotes.useQuery(
		{ companyId, dealId, contactId },
		{ enabled: !!companyId || !!dealId || !!contactId },
	);

	const addActivity = api.crm.addActivityNote.useMutation({
		onSuccess: () => {
			setContent("");
			toast.success("Activity logged");
			refetch();
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!content.trim()) return;

		addActivity.mutate({
			companyId,
			dealId,
			contactId,
			type,
			content,
		});
	};

	const currentTypeConfig =
		ACTIVITY_TYPES.find((t) => t.id === type) ??
		(ACTIVITY_TYPES[0] as (typeof ACTIVITY_TYPES)[number]);

	return (
		<div className="flex flex-col gap-6">
			{/* Activity Quick-Logger Box */}
			<div className="rounded-2xl border border-border/70 bg-card/75 p-4 shadow-xs backdrop-blur-md">
				<form className="flex flex-col gap-3" onSubmit={handleSubmit}>
					{/* Type Pill Selector */}
					<div className="flex items-center gap-1.5 overflow-x-auto pb-1">
						{ACTIVITY_TYPES.map((t) => {
							const Icon = t.icon;
							const isSelected = type === t.id;
							return (
								<button
									className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 font-medium text-xs transition-all ${
										isSelected
											? "bg-primary font-semibold text-primary-foreground shadow-xs"
											: "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
									}`}
									key={t.id}
									onClick={() => setType(t.id)}
									type="button"
								>
									<Icon className="h-3.5 w-3.5" />
									<span>{t.label}</span>
								</button>
							);
						})}
					</div>

					<Textarea
						className="min-h-[85px] resize-none rounded-xl border-border/80 bg-background/60 p-3 text-xs focus-visible:ring-primary/30"
						onChange={(e) => setContent(e.target.value)}
						placeholder={currentTypeConfig.placeholder}
						value={content}
					/>

					<div className="flex items-center justify-between pt-1">
						<span className="text-[11px] text-muted-foreground">
							Press Log Activity to sync timeline
						</span>
						<Button
							className="h-8 gap-1.5 rounded-xl bg-primary px-3 font-semibold text-primary-foreground text-xs shadow-xs hover:bg-primary/90"
							disabled={!content.trim() || addActivity.isPending}
							size="sm"
							type="submit"
						>
							{addActivity.isPending ? (
								<Loader2 className="h-3.5 w-3.5 animate-spin" />
							) : (
								<Send className="h-3.5 w-3.5" />
							)}
							<span>Log Activity</span>
						</Button>
					</div>
				</form>
			</div>

			{/* Timeline Feed Container */}
			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between px-1">
					<h3 className="font-semibold text-foreground text-sm tracking-tight">
						Chronological Timeline
					</h3>
					<span className="rounded-full bg-accent/60 px-2 py-0.5 text-[11px] text-muted-foreground">
						{activities?.length ?? 0} Events
					</span>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-10">
						<Loader2 className="h-6 w-6 animate-spin text-primary/70" />
					</div>
				) : activities?.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 border-dashed p-8 text-center text-muted-foreground">
						<Sparkles className="mb-2 h-7 w-7 text-muted-foreground/40" />
						<p className="font-medium text-foreground text-xs">
							No activity recorded yet
						</p>
						<p className="text-[11px]">
							Use the logger above to track client calls, emails, notes, or
							meetings.
						</p>
					</div>
				) : (
					<div className="relative pl-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-gradient-to-b before:from-primary/40 before:via-border/60 before:to-border/20">
						<div className="flex flex-col gap-4">
							{activities?.map((activity) => {
								const config =
									ACTIVITY_TYPES.find(
										(t) => t.id === activity.type.toUpperCase(),
									) ?? (ACTIVITY_TYPES[0] as (typeof ACTIVITY_TYPES)[number]);
								const Icon = config.icon;

								return (
									<div
										className="relative flex flex-col gap-1"
										key={activity.id}
									>
										{/* Node Dot Icon */}
										<div
											className={`absolute top-1.5 -left-[23px] flex h-6 w-6 items-center justify-center rounded-full border shadow-xs ring-2 ${config.color} ${config.glowClass}`}
										>
											<Icon className="h-3 w-3" />
										</div>

										{/* Activity Content Box */}
										<div className="rounded-2xl border border-border/70 bg-card/75 p-3.5 shadow-xs backdrop-blur-md transition-all hover:border-primary/30">
											<div className="mb-1.5 flex items-center justify-between text-xs">
												<span className="font-semibold text-foreground text-xs capitalize">
													{activity.type.toLowerCase()}
												</span>
												<span className="flex items-center gap-1 text-[11px] text-muted-foreground">
													<Clock className="h-3 w-3" />
													{formatDistanceToNow(new Date(activity.createdAt), {
														addSuffix: true,
													})}
												</span>
											</div>
											<p className="whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">
												{activity.content}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
