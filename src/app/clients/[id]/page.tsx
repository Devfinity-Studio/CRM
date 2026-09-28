"use client";

import React from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "~/components/layout/dashboard-layout";
import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Loader2, ArrowLeft, Building2, MapPin, Mail, Phone, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { LedgerView } from "~/components/billing/ledger-view";

export default function ClientProfilePage() {
  const params = useParams();
  const clientId = params.id as string;

  const { data: client, isLoading } = api.crm.getCompanyById.useQuery({ id: clientId });
  const { data: pocs, isLoading: pocsLoading } = api.crm.getPOCsByCompanyId.useQuery({ companyId: clientId });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
          <Building2 className="h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Client Not Found</h3>
          <p className="text-slate-400 max-w-sm mb-6">
            The client profile you are looking for does not exist or you do not have permission to view it.
          </p>
          <Button asChild>
            <Link href="/clients">Return to Clients</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {client.name}
              {client.clientType && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {client.clientType}
                </Badge>
              )}
            </h2>
            <p className="text-slate-400 text-sm">
              {client.industry || "No industry specified"} {client.country ? `• ${client.country}` : ""}
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ledger">Ledger & Statements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>General details about the client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400 block mb-1">Company Name</span>
                    <span className="text-white font-medium">{client.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Industry</span>
                    <span className="text-white font-medium">{client.industry || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Alias</span>
                    <span className="text-white font-medium">{client.alias || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Client UID</span>
                    <span className="text-white font-medium">{client.uid || "-"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax & Financial Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400 block mb-1">Tax Treatment</span>
                    <span className="text-white font-medium">{client.taxTreatment || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">GSTIN</span>
                    <span className="text-white font-medium">{client.gstin || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">PAN</span>
                    <span className="text-white font-medium">{client.businessPan || "-"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Points of Contact (POCs)</CardTitle>
                  <CardDescription>Individuals linked to this company</CardDescription>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/contacts/new">Add POC</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {pocsLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin text-slate-500" /></div>
                ) : pocs && pocs.length > 0 ? (
                  <div className="space-y-4">
                    {pocs.map((poc) => (
                      <div key={poc.id} className="flex items-start justify-between p-4 bg-slate-900 border border-slate-800 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-medium">
                            {poc.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">{poc.salutation} {poc.firstName} {poc.lastName}</p>
                              {poc.qualificationStatus !== "NONE" && (
                                <Badge variant={poc.qualificationStatus === "SQL" ? "default" : poc.qualificationStatus === "MQL" ? "secondary" : "destructive"} className="text-[10px] h-4 px-1.5">
                                  {poc.qualificationStatus}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-slate-400">UID: {poc.uid}</p>
                              {poc.leadScore > 0 && <p className="text-xs font-medium text-blue-400">Score: {poc.leadScore}</p>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          {poc.email && <div className="text-xs text-slate-300 flex items-center gap-1 justify-end"><Mail className="h-3 w-3" /> {poc.email}</div>}
                          {poc.phone && <div className="text-xs text-slate-300 flex items-center gap-1 justify-end"><Phone className="h-3 w-3" /> {poc.phone}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 border border-dashed border-slate-800 rounded-md text-slate-500 text-sm">
                    No POCs found. Click "Add POC" to link a contact.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-slate-800 p-2 rounded-md">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Email</span>
                      <a href={`mailto:${client.email}`} className="text-blue-400 hover:underline">{client.email}</a>
                    </div>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-slate-800 p-2 rounded-md">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Phone</span>
                      <a href={`tel:${client.phone}`} className="text-blue-400 hover:underline">{client.phone}</a>
                    </div>
                  </div>
                )}

                {(client.addressCity || client.country) && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-slate-800 p-2 rounded-md">
                      <MapPin className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Location</span>
                      <span className="text-white">
                        {[client.addressCity, client.addressState, client.country].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </TabsContent>

        <TabsContent value="ledger">
          <LedgerView companyId={clientId} />
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
