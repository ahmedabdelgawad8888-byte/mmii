"use client";

import * as React from "react";

import { Ellipsis, FileDown, FileUp, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AnalyticsToolbar() {
  const [range, setRange] = React.useState("last-4-weeks");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    toast.success("Analytics report exported (CSV)", {
      description: "Downloaded complete traffic, conversion, and bounce rate metrics.",
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`Imported analytics dataset: ${file.name}`);
      e.target.value = "";
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("https://trygc.hub/dashboard/analytics");
    }
    toast.success("Dashboard link copied to clipboard");
  };

  const handleRefresh = () => {
    toast.success("Metrics refreshed from analytics pipeline");
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={range}
        onValueChange={(val) => {
          setRange(val);
          toast.info(`Time range updated to ${val.replace(/-/g, " ")}`);
        }}
      >
        <SelectTrigger className="w-34">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="last-7-days">Last 7 days</SelectItem>
            <SelectItem value="last-4-weeks">Last 4 weeks</SelectItem>
            <SelectItem value="last-3-months">Last 3 months</SelectItem>
            <SelectItem value="year-to-date">Year to date</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline" aria-label="More analytics actions" className="cursor-pointer">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Analytics actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleExport} className="cursor-pointer">
              <FileDown />
              Export report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
              <FileUp />
              Import data
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
              <Share2 />
              Share dashboard
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleRefresh} className="cursor-pointer">
              <RefreshCw />
              Refresh metrics
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.json" onChange={handleImport} />
    </div>
  );
}
