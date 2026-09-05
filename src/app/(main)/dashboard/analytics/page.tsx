import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  AcquisitionAnalytics,
  AudienceAnalytics,
  ConversionAnalytics,
  EngagementAnalytics,
} from "./_components/analytics-sections";

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-muted-foreground text-xs uppercase tracking-widest">Intelligence · Operating performance</p>
        <h1 className="mt-2 font-semibold text-3xl tracking-tight">See where execution changes the outcome.</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Markets, creator stages, delivery workload, and commercial outcomes from this workspace.
        </p>
      </header>
      <Tabs defaultValue="commercial">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="creators">Creator pipeline</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="commercial">
          <ConversionAnalytics />
        </TabsContent>
        <TabsContent value="markets">
          <AudienceAnalytics />
        </TabsContent>
        <TabsContent value="creators">
          <AcquisitionAnalytics />
        </TabsContent>
        <TabsContent value="delivery">
          <EngagementAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
