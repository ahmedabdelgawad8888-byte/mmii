"use client";

import { Copy, Download, Ellipsis, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const pages = [
  { bounce: "24%", path: "/dashboard", time: "3m 12s", views: "64.2k" },
  { bounce: "31%", path: "/pricing", time: "2m 08s", views: "41.8k" },
  { bounce: "18%", path: "/docs/getting-started", time: "4m 44s", views: "28.6k" },
  { bounce: "22%", path: "/blog/analytics-guide", time: "5m 06s", views: "19.3k" },
  { bounce: "42%", path: "/contact", time: "1m 18s", views: "8.9k" },
];

export function TopPages() {
  const handleCopyUrls = () => {
    const urls = pages.map((p) => p.path).join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(urls);
    }
    toast.success("Page URLs copied to clipboard");
  };

  const handleExport = () => {
    toast.success("Page performance report exported (CSV)");
  };

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Page Performance</CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="cursor-pointer" aria-label="Page performance options">
                <Ellipsis className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleCopyUrls} className="cursor-pointer">
                  <Copy />
                  Copy URLs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} className="cursor-pointer">
                  <Download />
                  Export stats
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8" />
              <TableHead className="h-8 w-24 text-right font-normal">Views</TableHead>
              <TableHead className="h-8 w-24 text-right font-normal">Avg Time</TableHead>
              <TableHead className="h-8 w-20 text-right font-normal">Bounce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-border/50">
            {pages.map((page) => (
              <TableRow
                className="cursor-pointer hover:bg-muted/40"
                key={page.path}
                onClick={() =>
                  toast.info(`Performance for ${page.path}`, {
                    description: `${page.views} views · Avg time: ${page.time} · Bounce rate: ${page.bounce}`,
                  })
                }
              >
                <TableCell className="max-w-0 truncate py-4 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>{page.path}</span>
                    <ExternalLink className="size-3 text-muted-foreground opacity-50" />
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{page.views}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">{page.time}</TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">{page.bounce}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
