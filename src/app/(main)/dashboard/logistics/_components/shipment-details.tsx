import { cn } from "cn";
import {
  AlertTriangleIcon,
  Copy,
  Download,
  Eye,
  FileText,
  MapPin,
  Navigation,
  Plane,
  Radio,
  Ship,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Shipment } from "./shipment-data";
import { ShipmentRouteMap } from "./shipment-route-map";

const modeIcons = {
  air: Plane,
  land: Truck,
  sea: Ship,
} as const;

const progressRingClasses: Record<Shipment["status"], string> = {
  Scheduled: "text-muted-foreground",
  "In Transit": "text-primary",
  "Out for Delivery": "text-primary",
  Delivered: "text-green-600",
  Delayed: "text-destructive",
  "On Hold": "text-amber-500",
  "Customs Hold": "text-amber-500",
};

const statusBadgeClasses: Record<Shipment["status"], string> = {
  Scheduled: "border-muted bg-muted/50 text-muted-foreground",
  "In Transit": "border-primary/20 bg-primary/10 text-primary",
  "Out for Delivery": "border-primary/20 bg-primary/10 text-primary",
  Delivered: "border-green-600/20 bg-green-600/10 text-green-600",
  Delayed: "border-destructive/20 bg-destructive/10 text-destructive",
  "On Hold": "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Customs Hold": "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

type ShipmentDetailsProps = {
  shipment: Shipment | null;
};

function getContactLabel(mode: Shipment["mode"]) {
  if (mode === "land") {
    return "Call Driver";
  }

  if (mode === "air") {
    return "Call Airline Support";
  }

  return "Call Captain";
}

function getTransportNumberLabel(mode: Shipment["mode"]) {
  if (mode === "land") {
    return "Vehicle number";
  }

  if (mode === "air") {
    return "Flight number";
  }

  return "Vessel number";
}

function EmptyShipmentOverview() {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-dashed text-muted-foreground text-sm">
      Select a shipment to view details.
    </div>
  );
}

function ShipmentOverview({ shipment }: { shipment: Shipment }) {
  const ContactIcon = modeIcons[shipment.mode];
  const contactLabel = getContactLabel(shipment.mode);
  const transportNumberLabel = getTransportNumberLabel(shipment.mode);

  const handleCopyShipmentId = () => {
    navigator.clipboard?.writeText(shipment.id);
    toast.success(`Copied shipment #${shipment.id} to clipboard`);
  };

  const handleCopyCustomerId = () => {
    navigator.clipboard?.writeText(shipment.customer.id);
    toast.success(`Copied customer ID ${shipment.customer.id}`);
  };

  const handleContactDispatch = () => {
    toast.success(`Dispatch radio link established: Calling ${contactLabel.toLowerCase()}...`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2">
          <h1 className="font-medium text-lg tabular-nums tracking-tight sm:text-xl">#{shipment.id}</h1>
          <Button variant="ghost" size="icon-sm" aria-label="Copy shipment ID" onClick={handleCopyShipmentId}>
            <Copy className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Badge variant="outline" className={cn("gap-1.5", statusBadgeClasses[shipment.status])}>
            <span className={cn("size-1.5 rounded-full bg-current", progressRingClasses[shipment.status])} />
            {shipment.status}
          </Badge>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground tabular-nums">{shipment.progress}% complete</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-foreground tabular-nums">
            ETA: {shipment.eta} {shipment.etaMeta}
          </span>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="size-9 after:rounded-sm">
            <AvatarFallback className="rounded-sm">{shipment.customer.initials}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1">
            <div className="font-medium text-sm leading-none">{shipment.customer.name}</div>
            <button
              type="button"
              className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
              onClick={handleCopyCustomerId}
            >
              <span className="text-xs tabular-nums leading-none tracking-tight">{shipment.customer.id}</span>
              <Copy className="size-3" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary">
            <Star className="size-3" />
            {shipment.customer.tier}
          </Badge>
          <div className="text-muted-foreground text-xs leading-none">{shipment.customer.tierLabel}</div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-medium">Cargo details</h2>

          <Button variant="outline" size="sm" onClick={handleContactDispatch}>
            <ContactIcon data-icon="inline-start" />
            {contactLabel}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-[1.35fr_1fr_1.1fr_1.15fr_1fr]">
          <div className="col-span-2 flex flex-col gap-1 md:col-span-1 md:gap-2">
            <div className="text-muted-foreground text-xs leading-none md:invisible md:text-sm">Cargo</div>
            <div className="whitespace-nowrap text-sm leading-none">{shipment.cargo}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-xs leading-none md:text-sm">Total weight</div>
            <div className="text-sm leading-none">{shipment.weight}</div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-xs leading-none md:text-sm">Transport mode</div>
            <div className="text-sm capitalize leading-none">
              {shipment.mode} · {shipment.routeType}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-muted-foreground text-xs leading-none md:text-sm">{transportNumberLabel}</div>
            <div className="text-sm leading-none">{shipment.transportNumber}</div>
          </div>

          <div className="flex flex-col gap-2 md:text-right">
            <div className="text-muted-foreground text-xs leading-none md:text-sm">Status</div>
            <div className="text-sm leading-none">{shipment.progress}% complete</div>
          </div>
        </div>
      </div>

      <Separator />

      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
        <AlertTriangleIcon />
        <AlertTitle>{shipment.handling.label}</AlertTitle>
        <AlertDescription className="space-y-2">
          <div className="border-amber-900 text-amber-900 leading-none dark:border-amber-50 dark:text-amber-50">
            {shipment.handling.note}
          </div>

          <Separator className="bg-amber-800 dark:bg-amber-50" />

          <div className="flex flex-wrap gap-2">
            {shipment.handling.tags.map(({ icon: TagIcon, label }) => (
              <Badge
                className="rounded-sm border-amber-200 bg-background/50 text-amber-900 dark:border-amber-900 dark:text-amber-50"
                key={label}
                variant="outline"
              >
                <TagIcon data-icon="inline-start" />
                {label}
              </Badge>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function ShipmentDetails({ shipment }: ShipmentDetailsProps) {
  if (!shipment) {
    return (
      <div className="grid h-full min-h-0 grid-rows-[320px_1fr] overflow-hidden lg:grid-rows-[420px_1fr]">
        <div className="min-h-0 overflow-hidden">
          <ShipmentRouteMap shipment={null} />
        </div>
        <div className="min-h-0 overflow-hidden p-4">
          <EmptyShipmentOverview />
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[320px_1fr] overflow-hidden lg:grid-rows-[420px_1fr]">
      <div className="min-h-0 overflow-hidden">
        <ShipmentRouteMap shipment={shipment} />
      </div>
      <div className="min-h-0 overflow-hidden">
        <div className="h-full min-h-0 py-2">
          <Tabs defaultValue="overview" className="h-full gap-0">
            <TabsList
              className="w-full justify-start gap-2 border-b px-4 **:data-[slot=tabs-trigger]:text-xs sm:gap-4 sm:**:data-[slot=tabs-trigger]:text-sm"
              variant="line"
            >
              <TabsTrigger className="flex-none" value="overview">
                Overview
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="route">
                Route
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="cargo">
                Cargo
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="documents">
                Documents
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="activity">
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent className="min-h-0 overflow-auto p-4" value="overview">
              <ShipmentOverview shipment={shipment} />
            </TabsContent>

            {/* Route Tab */}
            <TabsContent className="min-h-0 space-y-4 overflow-auto p-4" value="route">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase">
                    <MapPin className="size-4 text-emerald-500" />
                    Origin Terminal
                  </div>
                  <p className="font-semibold text-base">{shipment.origin.display}</p>
                  <p className="text-muted-foreground text-xs">
                    {shipment.origin.country} ({shipment.origin.countryCode})
                  </p>
                  <div className="pt-2 text-muted-foreground text-xs">
                    Coordinates: {shipment.origin.coordinates.join(", ")}
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-2 font-semibold text-muted-foreground text-xs uppercase">
                    <Navigation className="size-4 text-primary" />
                    Destination Hub
                  </div>
                  <p className="font-semibold text-base">{shipment.destination.display}</p>
                  <p className="text-muted-foreground text-xs">
                    {shipment.destination.country} ({shipment.destination.countryCode})
                  </p>
                  <div className="pt-2 text-muted-foreground text-xs">
                    Coordinates: {shipment.destination.coordinates.join(", ")}
                  </div>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <Radio className="size-4 animate-pulse text-emerald-500" />
                    Live Route Telemetry
                  </div>
                  <Badge variant="outline">{shipment.progress}% complete</Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  Carrier assigned: {shipment.transportNumber} ({shipment.mode.toUpperCase()}) • Est. Arrival:{" "}
                  {shipment.eta} ({shipment.etaMeta})
                </p>
              </div>
            </TabsContent>

            {/* Cargo Tab */}
            <TabsContent className="min-h-0 space-y-4 overflow-auto p-4" value="cargo">
              <div className="space-y-3 rounded-xl border bg-card p-4">
                <h3 className="font-semibold text-base">Manifest & Freight Profile</h3>
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <span className="text-muted-foreground text-xs">Description</span>
                    <p className="font-medium">{shipment.cargo}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Total Mass</span>
                    <p className="font-medium">{shipment.weight}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Route Mode</span>
                    <p className="font-medium capitalize">
                      {shipment.mode} ({shipment.routeType})
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
                <h4 className="mb-1 font-semibold text-amber-900 text-sm dark:text-amber-100">
                  {shipment.handling.label}
                </h4>
                <p className="text-amber-800 text-xs dark:text-amber-200">{shipment.handling.note}</p>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent className="min-h-0 space-y-3 overflow-auto p-4" value="documents">
              {[
                { name: `Bill_of_Lading_BOL-${shipment.id}.pdf`, type: "Master Waybill", size: "420 KB" },
                { name: `Commercial_Invoice_CI-${shipment.id}.pdf`, type: "Customs Valuation", size: "185 KB" },
                { name: `Export_Clearance_Declaration.pdf`, type: "Regulatory Permit", size: "290 KB" },
                { name: `Proof_of_Delivery_Receipt.pdf`, type: "Carrier Verification", size: "94 KB" },
              ].map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{doc.name}</p>
                      <span className="text-muted-foreground text-xs">
                        {doc.type} • {doc.size}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => toast.info(`Viewing ${doc.name}`)}
                      title="View document"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      onClick={() => toast.success(`Downloading ${doc.name}`)}
                      title="Download PDF"
                    >
                      <Download className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent className="min-h-0 overflow-auto p-4" value="activity">
              <div className="relative space-y-4 pl-6 before:absolute before:top-2 before:bottom-2 before:left-2.5 before:w-0.5 before:bg-border">
                {[
                  { title: "Out for final hub transit", time: "2 hours ago", done: true },
                  { title: "Customs clearance inspection completed", time: "Yesterday, 18:30", done: true },
                  { title: `Departed origin terminal (${shipment.origin.display})`, time: "3 days ago", done: true },
                  { title: "Freight manifest registered & approved", time: "4 days ago", done: true },
                  { title: `Order booked by ${shipment.customer.name}`, time: "5 days ago", done: true },
                ].map((act) => (
                  <div key={act.title} className="relative flex flex-col gap-0.5">
                    <span className="absolute top-1 -left-6 flex size-3 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
                    <span className="font-medium text-sm leading-tight">{act.title}</span>
                    <span className="text-muted-foreground text-xs">{act.time}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
