"use client";

import { formatDistanceToNow } from "date-fns";
import {
	Building2,
	Calendar,
	CheckCircle2,
	Clock,
	CreditCard,
	DollarSign,
	FileText,
	Loader2,
	Mail,
	MessageSquare,
	PenLine,
	Phone,
	Receipt,
	Send,
	Sparkles,
	TrendingUp,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { RichTextEditor } from "~/components/ui/rich-text-editor";
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
		placeholder: "Log phone conversation takeaways, objections, and next steps...",
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
		placeholder: "Document agenda points, client attendees, and action items...",
	},
];

export function ActivityTimeline({
	companyId,
	dealId,
	contactId,
}: ActivityTimelineProps) {
	const [content, setContent] = useState("");
	const [type, setType] = useState<ActivityType>("NOTE");
	const [isRichEditor, setIsRichEditor] = useState(false);

	const {
		data: timelineData,
		isLoading,
		refetch,
	} = api.crm.getUnifiedTimeline.useQuery(
		{ companyId, contactId },
		{ enabled: !!companyId || !!contactId },
	);

	const addActivity = api.crm.addActivityNote.useMutation({
		onSuccess: () => {
			setContent("");
			toast.success("Activity logged to timeline");
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

	const events = timelineData?.events ?? [];
	const ltv = timelineData?.ltv;

	const formatCurrency = (cents: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			maximumFractionDigits: 0,
		}).format(cents / 100);
	};

	return (
		<div className="flex flex-col gap-6">
			{/* 360° Financial & Pipeline LTV Summary Strip */}
			{ltv && (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div className="rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs">
						<div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
							<DollarSign className="h-3.5 w-3.5" />
							<span>Paid Lifetime Value</span>
						</div>
						<div className="mt-1 font-bold text-lg text-foreground">
							{formatCurrency(ltv.totalPaidRevenue)}
						</div>
						<div className="text-[11px] text-muted-foreground">
							{ltv.totalInvoicesCount} invoices issued
						</div>
					</div>

					<div className="rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs">
						<div className="flex items-center gap-1.5 text-sky-600 text-xs font-medium">
							<TrendingUp className="h-3.5 w-3.5" />
							<span>Won Deals</span>
						</div>
						<div className="mt-1 font-bold text-lg text-foreground">
							{formatCurrency(ltv.wonDealsValue)}
						</div>
						<div className="text-[11px] text-muted-foreground">
							Closed sales volume
						</div>
					</div>

					<div className="rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs">
						<div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium">
							<Building2 className="h-3.5 w-3.5" />
							<span>Active Pipeline</span>
						</div>
						<div className="mt-1 font-bold text-lg text-foreground">
							{formatCurrency(ltv.openPipelineValue)}
						</div>
						<div className="text-[11px] text-muted-foreground">
							{ltv.totalDealsCount} total deals
						</div>
					</div>

					<div className="rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs">
						<div className="flex items-center gap-1.5 text-purple-600 text-xs font-medium">
							<FileText className="h-3.5 w-3.5" />
							<span>Quotes & Proposals</span>
						</div>
						<div className="mt-1 font-bold text-lg text-foreground">
							{ltv.totalQuotesCount}
						</div>
						<div className="text-[11px] text-muted-foreground">
							Created documents
						</div>
					</div>
				</div>
			)}

			{/* Activity Quick-Logger Box */}
			<div className="rounded-2xl border border-border/70 bg-card/75 p-4 shadow-xs backdrop-blur-md">
				<form className="flex flex-col gap-3" onSubmit={handleSubmit}>
					{/* Type Pill Selector & Rich Text Toggle */}
					<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
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

						<button
							className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
								isRichEditor
									? "border-primary/50 bg-primary/10 text-primary font-medium"
									: "border-border/70 text-muted-foreground hover:text-foreground"
							}`}
							onClick={() => setIsRichEditor(!isRichEditor)}
							type="button"
						>
							{isRichEditor ? "Rich Editor (Tiptap)" : "Switch to Rich Editor"}
						</button>
					</div>

					{isRichEditor ? (
						<div className="overflow-hidden rounded-xl border border-border/80 bg-background/60">
							<RichTextEditor
								onChange={setContent}
								placeholder={currentTypeConfig.placeholder}
								value={content}
							/>
						</div>
					) : (
						<Textarea
							className="min-h-[85px] resize-none rounded-xl border-border/80 bg-background/60 p-3 text-xs focus-visible:ring-primary/30"
							onChange={(e) => setContent(e.target.value)}
							placeholder={currentTypeConfig.placeholder}
							value={content}
						/>
					)}

					<div className="flex items-center justify-between pt-1">
						<span className="text-[11px] text-muted-foreground">
							Press Log Activity to sync 360° timeline
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
						360° Unified Chronological Timeline
					</h3>
					<span className="rounded-full bg-accent/60 px-2 py-0.5 text-[11px] text-muted-foreground">
						{events.length} Events
					</span>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center py-10">
						<Loader2 className="h-6 w-6 animate-spin text-primary/70" />
					</div>
				) : events.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 border-dashed p-8 text-center text-muted-foreground">
						<Sparkles className="mb-2 h-7 w-7 text-muted-foreground/40" />
						<p className="font-medium text-foreground text-xs">
							No activity recorded yet
						</p>
						<p className="text-[11px]">
							Activities, deals, proposals, and invoices will appear here automatically.
						</p>
					</div>
				) : (
					<div className="relative pl-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-gradient-to-b before:from-primary/40 before:via-border/60 before:to-border/20">
						<div className="flex flex-col gap-4">
							{events.map((ev) => {
								let icon = MessageSquare;
								let colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
								let glowClass = "ring-amber-500/20";

								if (ev.category === "DEAL") {
									icon = Building2;
									colorClass = "text-sky-500 bg-sky-500/10 border-sky-500/20";
									glowClass = "ring-sky-500/20";
								} else if (ev.category === "QUOTE") {
									icon = FileText;
									colorClass = "text-purple-500 bg-purple-500/10 border-purple-500/20";
									glowClass = "ring-purple-500/20";
								} else if (ev.category === "INVOICE") {
									icon = Receipt;
									colorClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
									glowClass = "ring-emerald-500/20";
								} else {
									const config = ACTIVITY_TYPES.find(
										(t) => t.id === ev.subtype?.toUpperCase(),
									);
									if (config) {
										icon = config.icon;
										colorClass = config.color;
										glowClass = config.glowClass;
									}
								}

								const IconComponent = icon;

								return (
									<div className="relative flex flex-col gap-1" key={ev.id}>
										{/* Node Dot Icon */}
										<div
											className={`absolute top-1.5 -left-[23px] flex h-6 w-6 items-center justify-center rounded-full border shadow-xs ring-2 ${colorClass} ${glowClass}`}
										>
											<IconComponent className="h-3 w-3" />
										</div>

										{/* Event Content Box */}
										<div className="rounded-2xl border border-border/70 bg-card/75 p-3.5 shadow-xs backdrop-blur-md transition-all hover:border-primary/30">
											<div className="mb-1.5 flex items-center justify-between text-xs">
												<div className="flex items-center gap-2">
													<span className="font-semibold text-foreground text-xs">
														{ev.title}
													</span>
													{ev.subtype && (
														<Badge
															className="text-[10px] px-1.5 py-0 uppercase"
															variant="secondary"
														>
															{ev.subtype}
														</Badge>
													)}
												</div>
												<span className="flex items-center gap-1 text-[11px] text-muted-foreground">
													<Clock className="h-3 w-3" />
													{formatDistanceToNow(new Date(ev.createdAt), {
														addSuffix: true,
													})}
												</span>
											</div>
											<div
												className="prose prose-sm max-w-none text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap"
												// biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized rich text from tiptap
												dangerouslySetInnerHTML={{
													__html: ev.content || "",
												}}
											/>
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
