"use client";

import React from "react";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { DollarSign, Trophy, XCircle, BarChart3, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";

export default function ForecastPage() {
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId as string;

  // For MVP, we'll just pick the first pipeline (or default). In a real app, there'd be a pipeline selector.
  const { data: pipelines } = api.deals.getPipelines.useQuery(
    { organizationId: orgId },
    { enabled: !!orgId }
  );
  const defaultPipelineId = pipelines?.[0]?.id;

  const { data: metrics, isLoading } = api.deals.getMetricsSummary.useQuery(
    { organizationId: orgId, pipelineId: defaultPipelineId! },
    { enabled: !!orgId && !!defaultPipelineId }
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/deals">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Pipeline Forecast & Reports</h2>
              <p className="text-muted-foreground text-sm">
                Track revenue, win rates, and overall deal pipeline health.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Open Pipeline</CardDescription>
                <CardTitle className="text-2xl text-emerald-500 flex items-center">
                  <DollarSign className="h-6 w-6 mr-1" />
                  {(metrics.totalPipelineValue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Across {metrics.openDealsCount} open deal(s)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Forecasted Revenue</CardDescription>
                <CardTitle className="text-2xl text-blue-500 flex items-center">
                  <DollarSign className="h-6 w-6 mr-1" />
                  {(metrics.forecastedRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Based on win probabilities per stage
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Deals Won</CardDescription>
                <CardTitle className="text-2xl text-foreground flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-emerald-500" />
                  {metrics.wonDealsCount}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Closed Won deals
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Win Rate</CardDescription>
                <CardTitle className="text-2xl text-foreground flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  {metrics.winRate}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={metrics.winRate} className="mt-2" />
                <div className="text-xs text-muted-foreground mt-2 flex justify-between">
                  <span>{metrics.wonDealsCount} Won</span>
                  <span>{metrics.lostDealsCount} Lost</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center p-12 bg-card border rounded-lg">
            No pipeline data available.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
