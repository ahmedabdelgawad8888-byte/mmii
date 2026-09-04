"use client";

import * as React from "react";

import { Settings2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function EcommerceToolbar() {
  const [period, setPeriod] = React.useState("this-month");
  const [channel, setChannel] = React.useState("all-channels");
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [currency, setCurrency] = React.useState("USD");
  const [threshold, setThreshold] = React.useState("15");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Store settings updated successfully", {
      description: `Default currency: ${currency} · Low stock alert: < ${threshold} units`,
    });
    setSettingsOpen(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-end gap-2 lg:w-fit">
        <Select
          value={period}
          onValueChange={(val) => {
            setPeriod(val);
            toast.info(`Time period updated to ${val.replace("-", " ")}`);
          }}
        >
          <SelectTrigger className="w-34" id="ecommerce-period" size="sm">
            <SelectValue placeholder="This Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="year-to-date">Year to Date</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={channel}
          onValueChange={(val) => {
            setChannel(val);
            toast.info(`Sales channel filtered by ${val.replace("-", " ")}`);
          }}
        >
          <SelectTrigger className="w-40" id="ecommerce-channel" size="sm">
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all-channels">All Channels</SelectItem>
              <SelectItem value="online-store">Online Store</SelectItem>
              <SelectItem value="marketplace">Marketplace</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" />

        <Button
          size="icon-sm"
          variant="outline"
          className="cursor-pointer"
          onClick={() => setSettingsOpen(true)}
          title="Store Settings"
        >
          <Settings2 />
        </Button>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveSettings}>
            <DialogHeader>
              <DialogTitle>Store Settings</DialogTitle>
              <DialogDescription>Configure ecommerce store thresholds and notifications.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="store-currency">Operating Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="store-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock-threshold">Low Inventory Alert Threshold (Units)</Label>
                <Input
                  id="stock-threshold"
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  min="1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
