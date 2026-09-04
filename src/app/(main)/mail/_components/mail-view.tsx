"use client";

import * as React from "react";

import { cn } from "cn";
import { format } from "date-fns/format";
import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Forward,
  MailOpen,
  Paperclip,
  Pin,
  Reply,
  ReplyAll,
  Send,
  Smile,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { SimpleIcon } from "@/components/simple-icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { Mail } from "./data";
import { useMail, useMailStore } from "./use-mail";

interface MailDisplayProps {
  mail: Mail | null;
  onClose?: () => void;
}

export function MailView({ mail, onClose }: MailDisplayProps) {
  const [, setMail] = useMail();
  const navigateMail = useMailStore((s) => s.navigateMail);
  const togglePinMail = useMailStore((s) => s.togglePinMail);
  const archiveMail = useMailStore((s) => s.archiveMail);
  const deleteMail = useMailStore((s) => s.deleteMail);
  const markMailUnread = useMailStore((s) => s.markMailUnread);
  const sendReply = useMailStore((s) => s.sendReply);

  const [replyText, setReplyText] = React.useState("");
  const replyInputRef = React.useRef<HTMLInputElement>(null);

  function handleClose() {
    setMail({ selected: null });
    onClose?.();
  }

  const handleSendReply = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!mail || !replyText.trim()) return;
    sendReply(mail.id, replyText.trim());
    toast.success(`Reply sent to ${mail.from.name}`);
    setReplyText("");
  };

  const handleArchive = () => {
    if (!mail) return;
    archiveMail(mail.id);
    toast.success("Thread archived", {
      action: {
        label: "Undo",
        onClick: () => toast.info("Archive undone"),
      },
    });
  };

  const handleDelete = () => {
    if (!mail) return;
    deleteMail(mail.id);
    toast.success("Moved thread to trash", {
      action: {
        label: "Undo",
        onClick: () => toast.info("Restored from trash"),
      },
    });
  };

  const handlePin = () => {
    if (!mail) return;
    togglePinMail(mail.id);
    toast.info(mail.isPinned ? "Thread unpinned" : "Thread pinned to top");
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 px-2 py-3">
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close message" onClick={handleClose}>
                <X />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close message</TooltipContent>
          </Tooltip>
          <Separator className="h-4 data-vertical:self-center" orientation="vertical" />
          <div className="flex items-center gap-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Previous message"
                  onClick={() => navigateMail("prev")}
                >
                  <ChevronLeft />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous message</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Next message" onClick={() => navigateMail("next")}>
                  <ChevronRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next message</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Pin thread"
                onClick={handlePin}
                className={cn(mail?.isPinned && "text-primary")}
              >
                <Pin />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{mail?.isPinned ? "Unpin thread" : "Pin thread"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Archive" onClick={handleArchive}>
                <Archive />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Reply" onClick={() => replyInputRef.current?.focus()}>
                <Reply />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
          <Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="More actions">
                    <EllipsisVertical />
                  </Button>
                </TooltipTrigger>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => {
                      replyInputRef.current?.focus();
                      setReplyText(`Cc all: `);
                    }}
                  >
                    <ReplyAll />
                    Reply all
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      toast.info(`Forward draft created for "${mail?.subject}"`);
                    }}
                  >
                    <Forward />
                    Forward
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => {
                      if (!mail) return;
                      markMailUnread(mail.id);
                      toast.info("Marked as unread");
                    }}
                  >
                    <MailOpen />
                    Mark as unread
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      toast.success(`Label "Work" added to email`);
                    }}
                  >
                    <Tag />
                    Add label
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipContent>More actions</TooltipContent>
          </Tooltip>
          <Separator className="h-4 data-vertical:self-center" orientation="vertical" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Move to trash" onClick={handleDelete}>
                <Trash2 className="text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Separator />

      <div className="flex min-h-0 flex-1 flex-col">
        {mail ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="space-y-1.5">
              <div className="font-medium leading-none">{mail.subject}</div>

              <div className="text-muted-foreground text-xs leading-none">
                {format(new Date(mail.receivedAt), "EEE, d MMM yyyy, h:mm a")}
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Avatar className="size-9 after:rounded-sm">
                <AvatarFallback className="rounded-sm bg-background">{mail.from.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex h-full flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="text-xs">{mail.from.name}</div>
                  <Separator className="h-3 data-vertical:self-center" orientation="vertical" />
                  <div className="text-muted-foreground text-xs">{mail.from.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-muted-foreground text-xs">
                    To: <span className="text-foreground">{mail.to.map((recipient) => recipient.name).join(", ")}</span>
                  </div>

                  {mail.cc?.length ? (
                    <div className="text-muted-foreground text-xs">
                      Cc:{" "}
                      <span className="text-foreground">{mail.cc.map((recipient) => recipient.name).join(", ")}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <Separator />

            {mail.attachments?.length ? (
              <>
                <Collapsible defaultOpen>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "group p-0 font-normal text-muted-foreground",
                        "hover:bg-transparent hover:text-muted-foreground dark:hover:bg-transparent",
                        "data-[state=open]:bg-transparent data-[state=open]:text-muted-foreground",
                      )}
                    >
                      Attachments ({mail.attachments.length})
                      <ChevronDown className="group-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="flex flex-wrap gap-2">
                      {mail.attachments.map((attachment) => (
                        <Button
                          size="xs"
                          variant="secondary"
                          key={attachment.id}
                          onClick={() => toast.success(`Downloading ${attachment.name}...`)}
                        >
                          <SimpleIcon icon={attachment.icon} className="size-3 fill-current" />
                          <span className="font-normal">{attachment.name}</span>
                          <span className="font-normal text-muted-foreground">{attachment.size}</span>
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-2" />
              </>
            ) : null}

            <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap text-sm">{mail.body}</div>

            <form onSubmit={handleSendReply} className="mt-auto flex flex-col gap-3">
              <Separator />
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Reply />
                </InputGroupAddon>
                <InputGroupInput
                  ref={replyInputRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="text-xs"
                  placeholder={`Reply to ${mail.from.name}...`}
                />
                <InputGroupAddon className="gap-1" align="inline-end">
                  <InputGroupButton
                    variant="ghost"
                    type="button"
                    onClick={() => setReplyText((prev) => `${prev} 👍`)}
                    aria-label="Add emoji"
                  >
                    <Smile />
                  </InputGroupButton>
                  <InputGroupButton
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setReplyText((prev) => `${prev} [Attached file: snippet.ts]`);
                      toast.info("Attached snippet.ts");
                    }}
                    aria-label="Attach file"
                  >
                    <Paperclip />
                  </InputGroupButton>
                  <InputGroupButton variant="ghost" type="submit" disabled={!replyText.trim()} aria-label="Send reply">
                    <Send />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </form>
          </div>
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground text-sm">No email selected</div>
        )}
      </div>
    </div>
  );
}
