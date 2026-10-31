"use client";

import { Bell } from "lucide-react";
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
			refetchInterval: 30000, // poll every 30s
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
				<Button className="relative" size="icon" variant="ghost">
					<Bell className="h-5 w-5 text-muted-foreground" />
					{unreadCount > 0 && (
						<span className="absolute top-1 right-1 h-2 w-2 animate-pulse rounded-full bg-red-500" />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-80 p-0">
				<div className="flex items-center justify-between border-b px-4 py-3">
					<span className="font-semibold text-sm">
						Notifications ({unreadCount})
					</span>
					{unreadCount > 0 && (
						<Button
							className="h-8 px-2 text-muted-foreground text-xs"
							onClick={() => markAllAsRead.mutate()}
							size="sm"
							variant="ghost"
						>
							Mark all read
						</Button>
					)}
				</div>
				<ScrollArea className="h-80">
					{notifications?.length === 0 ? (
						<div className="p-4 text-center text-muted-foreground text-sm">
							You're all caught up!
						</div>
					) : (
						<div className="flex flex-col">
							{notifications?.map((notif) => (
								<div
									className={`border-b p-4 transition-colors last:border-0 ${notif.isRead ? "bg-background opacity-60" : "bg-muted/30"}`}
									key={notif.id}
									onClick={() => {
										if (!notif.isRead) markAsRead.mutate({ id: notif.id });
									}}
								>
									<div className="flex items-start justify-between gap-2">
										<p className="font-semibold text-foreground text-sm leading-none">
											{notif.link ? (
												<a className="hover:underline" href={notif.link}>
													{notif.title}
												</a>
											) : (
												notif.title
											)}
										</p>
										{!notif.isRead && (
											<span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
										)}
									</div>
									<p className="mt-1.5 text-muted-foreground text-xs">
										{notif.message}
									</p>
									<p className="mt-2 text-[10px] text-muted-foreground/60">
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
