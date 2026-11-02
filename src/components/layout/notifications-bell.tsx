"use client";

import { Bell, CheckCheck } from "lucide-react";
import React from "react";
import { Button } from "~/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { api } from "~/trpc/react";

export function NotificationsBell() {
	const { data: notifications, refetch } =
		api.notifications.getNotifications.useQuery(undefined, {
			refetchInterval: 30000,
		});

	const markAsRead = api.notifications.markAsRead.useMutation({
		onSuccess: () => refetch(),
	});

	const markAllAsRead = api.notifications.markAllAsRead.useMutation({
		onSuccess: () => refetch(),
	});

	const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					className="relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60"
					size="icon"
					variant="ghost"
					aria-label={`Notifications (${unreadCount} unread)`}
				>
					<Bell className="h-5 w-5" />
					{unreadCount > 0 && (
						<span className="absolute top-2 right-2 flex h-2.5 w-2.5">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
							<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 sm:w-96 p-0 rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden">
				<div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/20">
					<div className="flex items-center gap-2">
						<span className="font-bold text-sm text-foreground">
							Notifications
						</span>
						{unreadCount > 0 && (
							<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
								{unreadCount} new
							</span>
						)}
					</div>
					{unreadCount > 0 && (
						<Button
							className="h-8 px-2 text-primary hover:text-primary/90 text-xs gap-1"
							onClick={() => markAllAsRead.mutate()}
							size="sm"
							variant="ghost"
						>
							<CheckCheck className="h-3.5 w-3.5" />
							Mark all read
						</Button>
					)}
				</div>
				<ScrollArea className="h-80">
					{notifications?.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground text-xs sm:text-sm">
							You&apos;re completely caught up! No unread notifications.
						</div>
					) : (
						<div className="flex flex-col divide-y divide-border/60">
							{notifications?.map((notif) => (
								<div
									className={`p-4 transition-colors cursor-pointer hover:bg-muted/40 ${
										notif.isRead ? "bg-background opacity-60" : "bg-muted/15"
									}`}
									key={notif.id}
									onClick={() => {
										if (!notif.isRead) markAsRead.mutate({ id: notif.id });
									}}
								>
									<div className="flex items-start justify-between gap-2">
										<p className="font-semibold text-foreground text-xs sm:text-sm leading-snug">
											{notif.link ? (
												<a className="hover:underline hover:text-primary transition-colors" href={notif.link}>
													{notif.title}
												</a>
											) : (
												notif.title
											)}
										</p>
										{!notif.isRead && (
											<span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
										)}
									</div>
									<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
										{notif.message}
									</p>
									<p className="mt-2 text-[10px] text-muted-foreground/80 font-mono">
										{new Date(notif.createdAt).toLocaleDateString()} at{" "}
										{new Date(notif.createdAt).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</p>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
}
