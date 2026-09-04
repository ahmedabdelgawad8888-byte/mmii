"use client";

import { TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";

export function FinanceNotification() {
  const handleViewDetails = () => {
    toast.info("Credit Score Breakdown: 782 (Excellent)", {
      description: "Payment History: 100% on time · Credit Utilization: 12% · Credit Age: 6 yrs",
    });
  };

  return (
    <Item className="rounded-xl" variant="outline">
      <ItemMedia variant="icon">
        <TrendingUp />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Credit score updated</ItemTitle>
        <ItemDescription>Your score increased by 14 points to 782.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="outline" onClick={handleViewDetails}>
          View details
        </Button>
      </ItemActions>
    </Item>
  );
}
