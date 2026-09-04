"use client";

import * as React from "react";

import { cn } from "cn";
import {
  AlarmClock,
  ArrowLeft,
  Copy,
  Flag,
  Link,
  MoreHorizontal,
  Paperclip,
  PhoneCall,
  Send,
  Smile,
  Sparkles,
  Tag,
  Type,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Message, MessageAvatar, MessageContent, MessageFooter } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getInitials } from "@/lib/utils";

import { type Message as ChatMessage, type Contact, currentUser } from "./data";

interface ChatThreadProps {
  contact: Contact;
  messages: ChatMessage[];
  onSendMessage?: (text: string) => void;
  onOpenContact?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function ChatThread({
  contact,
  messages,
  onSendMessage,
  onOpenContact,
  onBack,
  showBackButton,
  className,
}: ChatThreadProps) {
  const handleCall = () => {
    toast.info(`Calling ${contact.name} at ${contact.phone}...`);
  };

  const handleAddTag = () => {
    toast.success(`Tagged conversation with "${contact.name}" as Urgent.`);
  };

  const handleSnooze = () => {
    toast.info(`Conversation with ${contact.name} snoozed until 9:00 AM tomorrow.`);
  };

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(contact.email);
    toast.success(`Copied ${contact.email} to clipboard.`);
  };

  const handleMarkPriority = () => {
    toast.success(`Marked thread with ${contact.name} as High Priority (P0).`);
  };

  const handleBlock = () => {
    toast.error(`Contact ${contact.name} blocked.`);
  };

  return (
    <div className={cn("flex h-full flex-col py-3", className)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label="Back to conversations"
                onClick={onBack}
              >
                <ArrowLeft />
              </Button>
            )}
            <Avatar className="size-8">
              <AvatarFallback className="bg-background text-foreground">{getInitials(contact.name)}</AvatarFallback>
              <AvatarBadge className="bg-green-600 dark:bg-green-800" />
            </Avatar>
            <div>
              <div className="font-medium text-sm">{contact.name}</div>
              <div className="text-muted-foreground text-xs leading-3">{contact.role}</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Call" onClick={handleCall}>
                  <PhoneCall />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Call</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Tag" onClick={handleAddTag}>
                  <Tag />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Tag</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Snooze" onClick={handleSnooze}>
                  <AlarmClock />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Snooze</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={onOpenContact}>
                    <UserRound />
                    View profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleCopyEmail}>
                    <Copy />
                    Copy email
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleMarkPriority}>
                    <Flag />
                    Mark priority
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onSelect={handleBlock}>
                    Block contact
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Separator />
      </div>

      <MessageScrollerProvider autoScroll>
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-6 px-2 py-8">
              <Marker variant="separator">
                <MarkerContent>May 6, 2026</MarkerContent>
              </Marker>

              {messages.map((message) => {
                const isOutbound = message.align === "end";
                const reactionAlign = isOutbound ? "start" : "end";
                const senderName = isOutbound ? currentUser.name : contact.name;

                return (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={String(message.id)}
                    scrollAnchor={message.align === "end"}
                  >
                    <Message align={message.align}>
                      <MessageAvatar>
                        <Avatar>
                          <AvatarFallback
                            className={cn(
                              "bg-muted text-foreground text-xs",
                              isOutbound && "bg-primary text-primary-foreground",
                            )}
                          >
                            {getInitials(senderName)}
                          </AvatarFallback>
                        </Avatar>
                      </MessageAvatar>

                      <MessageContent>
                        <BubbleGroup>
                          <Bubble variant={isOutbound ? "default" : "muted"} align={message.align}>
                            <BubbleContent>{message.text}</BubbleContent>
                            {message.reaction ? (
                              <BubbleReactions aria-label={`Reaction: ${message.reaction}`} align={reactionAlign}>
                                <span>{message.reaction}</span>
                              </BubbleReactions>
                            ) : null}
                          </Bubble>
                        </BubbleGroup>
                        <MessageFooter>{message.time}</MessageFooter>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                );
              })}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="px-2">
        <Tabs defaultValue="reply" className="gap-0 rounded-md border">
          <TabsList
            variant="line"
            className="w-full justify-start gap-2 border-b px-3 **:data-[slot=tabs-trigger]:border-x-0 **:data-[slot=tabs-trigger]:px-6 group-data-horizontal/tabs:h-10"
          >
            <TabsTrigger value="reply" className="flex-none px-1">
              Reply
            </TabsTrigger>
            <TabsTrigger value="note" className="flex-none px-1">
              Internal note
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reply" className="m-0">
            <MessageComposer placeholder="Type your message..." onSend={onSendMessage} />
          </TabsContent>
          <TabsContent value="note" className="m-0">
            <MessageComposer
              placeholder="Write an internal note visible only to your team..."
              onSend={(text) => {
                toast.success(`Internal note saved: "${text.slice(0, 30)}..."`);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MessageComposer({ placeholder, onSend }: { placeholder: string; onSend?: (text: string) => void }) {
  const [text, setText] = React.useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    onSend?.(text);
    setText("");
  };

  const handleFormat = () => {
    setText((prev) => (prev ? `**${prev}**` : "**bold text**"));
    toast.info("Applied bold markdown styling");
  };

  const handleEmoji = () => {
    setText((prev) => `${prev} 👍`);
  };

  const handleAttach = () => {
    setText((prev) => `${prev} [Attachment: diagnostics_report.pdf]`);
    toast.success("Attached diagnostics_report.pdf");
  };

  const handleInsertLink = () => {
    setText((prev) => `${prev} https://github.com/next-shadcn/`);
  };

  const handleAiAssist = () => {
    const aiDraft =
      "Thanks for the update! I checked the cluster metrics and resolved the staging probe mismatch. Please test again.";
    setText(aiDraft);
    toast.success("AI generated a contextual response");
  };

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <InputGroup className="border-0 bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-0 has-[[data-slot][aria-invalid=true]]:border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0 has-[[data-slot][aria-invalid=true]]:ring-0 dark:bg-transparent dark:has-[[data-slot][aria-invalid=true]]:ring-0">
        <InputGroupTextarea
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          className="min-h-14 px-3 py-2.5 text-sm ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:aria-invalid:ring-0"
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton aria-label="Format" type="button" size="icon-sm" onClick={handleFormat}>
            <Type />
          </InputGroupButton>
          <InputGroupButton aria-label="Emoji" type="button" size="icon-sm" onClick={handleEmoji}>
            <Smile />
          </InputGroupButton>
          <InputGroupButton aria-label="Attach file" type="button" size="icon-sm" onClick={handleAttach}>
            <Paperclip />
          </InputGroupButton>
          <InputGroupButton aria-label="Insert link" type="button" size="icon-sm" onClick={handleInsertLink}>
            <Link />
          </InputGroupButton>
          <InputGroupButton
            aria-label="AI assist"
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={handleAiAssist}
          >
            <Sparkles />
          </InputGroupButton>
          <InputGroupButton type="submit" variant="default" size="icon-sm" className="ml-auto" disabled={!text.trim()}>
            <Send />
            <span className="sr-only">Send</span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
