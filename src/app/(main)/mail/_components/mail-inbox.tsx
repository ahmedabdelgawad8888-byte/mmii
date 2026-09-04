"use client";

import * as React from "react";

import { Check, Ellipsis, RotateCcw, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import type { Mail } from "./data";
import { MailList } from "./mail-list";
import { useMailStore } from "./use-mail";

interface MailInboxProps {
  mails: Mail[];
  onSelectMail?: (mail: Mail) => void;
}

export function MailInbox({ mails: propMails, onSelectMail }: MailInboxProps) {
  const storeMails = useMailStore((s) => s.mails);
  const mails = storeMails.length > 0 ? storeMails : propMails;
  const searchQuery = useMailStore((s) => s.searchQuery);
  const setSearchQuery = useMailStore((s) => s.setSearchQuery);
  const activeFolder = useMailStore((s) => s.activeFolder);

  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const filteredMails = React.useMemo(() => {
    return mails.filter((mail) => {
      if (activeFolder && mail.folder !== activeFolder && activeFolder !== "all") {
        return false;
      }
      if (unreadOnly && mail.isRead) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          mail.subject.toLowerCase().includes(q) ||
          mail.body.toLowerCase().includes(q) ||
          mail.from.name.toLowerCase().includes(q) ||
          mail.from.email.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [mails, activeFolder, unreadOnly, searchQuery]);

  const pinnedMails = filteredMails.filter((mail) => mail.isPinned);
  const unpinnedMails = filteredMails.filter((mail) => !mail.isPinned);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Inbox synced with IMAP server");
    }, 500);
  };

  const handleToggleUnreadOnly = () => {
    setUnreadOnly((prev) => {
      const next = !prev;
      toast.info(next ? "Filtering by unread messages only" : "Showing all messages");
      return next;
    });
  };

  const getFolderName = () => {
    switch (activeFolder) {
      case "drafts":
        return "Drafts";
      case "sent":
        return "Sent";
      case "archive":
        return "Archive";
      case "trash":
        return "Trash";
      default:
        return "Inbox";
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 pt-3">
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="flex items-center">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 ml-1 h-4 data-vertical:self-center" />
          <h1 className="font-medium text-xl leading-none">{getFolderName()}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={unreadOnly ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={handleToggleUnreadOnly}
            aria-label="Filter unread emails"
          >
            <SlidersHorizontal />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh inbox"
          >
            <RotateCcw className={isRefreshing ? "animate-spin" : ""} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Inbox actions">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Inbox Controls</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => toast.success("All messages marked as read")}>
                  <Check />
                  Mark all as read
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toast.info("Emptied spam folder")}>
                  <Trash2 />
                  Empty spam
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-2">
        <Separator />
      </div>

      <div className="px-2">
        <InputGroup className="h-7 w-full rounded-md">
          <InputGroupInput
            className="h-7 text-xs"
            placeholder="Search mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <Search />
            )}
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        {filteredMails.length > 0 ? (
          <MailList
            groups={[
              {
                id: "pinned",
                title: "Pinned",
                items: pinnedMails,
              },
              {
                id: "inbox",
                title: activeFolder === "inbox" ? "Inbox" : getFolderName(),
                items: unpinnedMails,
              },
            ]}
            onSelectMail={onSelectMail}
          />
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">No messages found in {getFolderName()}</div>
        )}
      </div>
    </div>
  );
}
