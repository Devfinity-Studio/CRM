"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Loader2, MessageSquare, Phone, Mail, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ActivityTimelineProps {
  companyId?: string;
  dealId?: string;
  contactId?: string;
}

export function ActivityTimeline({ companyId, dealId, contactId }: ActivityTimelineProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("NOTE");

  const { data: activities, isLoading, refetch } = api.crm.getActivityNotes.useQuery(
    { companyId, dealId, contactId },
    { enabled: !!companyId || !!dealId || !!contactId }
  );

  const addActivity = api.crm.addActivityNote.useMutation({
    onSuccess: () => {
      setContent("");
      setType("NOTE");
      toast.success("Activity logged");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    }
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

  const getIcon = (activityType: string) => {
    switch (activityType) {
      case "CALL": return <Phone className="h-4 w-4" />;
      case "EMAIL": return <Mail className="h-4 w-4" />;
      case "MEETING": return <Calendar className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Activity Input */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Log a note, call, email, or meeting..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="w-32">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTE">Note</SelectItem>
                    <SelectItem value="CALL">Call</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="MEETING">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm" disabled={!content.trim() || addActivity.isPending}>
                {addActivity.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Timeline Feed */}
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {isLoading ? (
          <div className="flex justify-center py-4 relative z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities?.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4 relative z-10 bg-background/80">
            No activity history yet.
          </div>
        ) : (
          activities?.map((activity) => (
            <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 dark:bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                {getIcon(activity.type)}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border bg-card shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-foreground capitalize">
                    {activity.type.toLowerCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {activity.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
