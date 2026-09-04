"use client";

import * as React from "react";

import { cn } from "cn";
import { Check, EllipsisVertical, LogOut, PenLine, Settings2, UserPlus, UsersRound } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getInitials } from "@/lib/utils";

import { accounts, type MailNavItem, mailNavigation } from "./data";
import { useMailStore } from "./use-mail";

export function MailSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [selectedAccount, setSelectedAccount] = React.useState(accounts[0]);
  const activeFolder = useMailStore((s) => s.activeFolder);
  const setActiveFolder = useMailStore((s) => s.setActiveFolder);
  const composeMail = useMailStore((s) => s.composeMail);

  const [isComposeOpen, setIsComposeOpen] = React.useState(false);
  const [composeTo, setComposeTo] = React.useState("");
  const [composeSubject, setComposeSubject] = React.useState("");
  const [composeBody, setComposeBody] = React.useState("");

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) {
      toast.error("Please specify a recipient email address");
      return;
    }
    composeMail({
      to: composeTo.trim(),
      subject: composeSubject.trim(),
      body: composeBody.trim(),
    });
    toast.success(`Email sent to ${composeTo.trim()}`);
    setIsComposeOpen(false);
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
  };

  const renderItem = (nav: MailNavItem) => {
    const isCurrent = activeFolder === nav.id;

    return (
      <SidebarMenuItem key={nav.id}>
        <SidebarMenuButton
          className="[&_svg]:size-3.5"
          size="sm"
          isActive={isCurrent}
          tooltip={nav.title}
          onClick={() => {
            setActiveFolder(nav.id);
            toast.info(`Switched to folder: ${nav.title}`);
          }}
        >
          <nav.icon />
          <span className="font-medium">{nav.title}</span>
        </SidebarMenuButton>
        {nav.label && <SidebarMenuBadge className="font-medium">{nav.label}</SidebarMenuBadge>}
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <Sidebar collapsible="icon" className="absolute inset-y-0 h-full **:data-[sidebar=sidebar]:bg-background">
        <SidebarHeader className="gap-3 py-3 pb-1">
          <div className="flex items-center justify-between">
            {isCollapsed ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={accountTriggerClassName}
                    aria-label={`Open ${selectedAccount.label} menu`}
                  >
                    <AccountMarker account={selectedAccount} isSelected />
                  </Button>
                </DropdownMenuTrigger>
                <AccountMenuContent
                  selectedAccountId={selectedAccount.id}
                  onSelectAccount={setSelectedAccount}
                  showAccounts
                  side="right"
                  align="start"
                />
              </DropdownMenu>
            ) : (
              <>
                <ToggleGroup
                  type="single"
                  value={String(selectedAccount.id)}
                  onValueChange={(value) => {
                    const account = accounts.find((item) => item.id === Number(value));
                    if (account) {
                      setSelectedAccount(account);
                      toast.info(`Switched account to ${account.label}`);
                    }
                  }}
                  spacing={2}
                >
                  {accounts.map((account) => (
                    <ToggleGroupItem
                      key={account.id}
                      className={accountTriggerClassName}
                      value={String(account.id)}
                      aria-label={`Select ${account.label}`}
                    >
                      <AccountMarker account={account} />
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Open account menu">
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <AccountMenuContent
                    selectedAccountId={selectedAccount.id}
                    onSelectAccount={(acc) => {
                      setSelectedAccount(acc);
                      toast.info(`Switched account to ${acc.label}`);
                    }}
                  />
                </DropdownMenu>
              </>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-1.5 group-data-[state=collapsed]:hidden">
            <div className="font-medium text-sm leading-none">{selectedAccount.label}</div>
            <div className="truncate text-muted-foreground text-sm leading-none">{selectedAccount.email}</div>
          </div>

          <Button
            size={isCollapsed ? "icon-sm" : "sm"}
            variant="outline"
            className="group-data-[state=expanded]:w-full"
            onClick={() => setIsComposeOpen(true)}
          >
            <PenLine data-icon="inline-start" />
            <span className="group-data-[state=collapsed]:hidden">New email</span>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu className="gap-1">{mailNavigation.navMain.map(renderItem)}</SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="font-normal">Folders</SidebarGroupLabel>
            <SidebarMenu className="gap-1">{mailNavigation.folders.map(renderItem)}</SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu className="gap-1">{mailNavigation.navFooter.map(renderItem)}</SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Compose Email Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleComposeSubmit}>
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
              <DialogDescription>Draft and send an email from {selectedAccount.email}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="compose-to">To</Label>
                <Input
                  id="compose-to"
                  placeholder="recipient@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="compose-subject">Subject</Label>
                <Input
                  id="compose-subject"
                  placeholder="Subject line"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="compose-body">Message</Label>
                <Textarea
                  id="compose-body"
                  placeholder="Write your email here..."
                  rows={6}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsComposeOpen(false)}>
                Discard
              </Button>
              <Button type="submit">Send Email</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

const accountTriggerClassName = cn(
  "relative size-7 min-w-7 rounded-sm p-0 transition-colors",
  "bg-primary text-primary-foreground text-xs hover:bg-primary/90 hover:text-primary-foreground",
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
  "data-[state=on]:ring data-[state=on]:ring-green-600",
  "focus-visible:border-transparent focus-visible:ring-0",
);

type Account = (typeof accounts)[number];

function AccountMarker({ account, isSelected = false }: { account: Account; isSelected?: boolean }) {
  return (
    <>
      {getInitials(account.label).slice(0, 1)}
      <span
        className={cn(
          "absolute right-0 bottom-0 z-10 hidden size-2.5 items-center justify-center rounded-full bg-green-600 text-primary-foreground ring-[1.25px] ring-background group-data-[state=on]/toggle:flex",
          isSelected && "flex",
        )}
      >
        <Check className="size-2" />
      </span>
    </>
  );
}

function AccountMenuContent({
  selectedAccountId,
  onSelectAccount,
  showAccounts = false,
  ...props
}: {
  selectedAccountId: number;
  onSelectAccount: (account: Account) => void;
  showAccounts?: boolean;
} & Pick<React.ComponentProps<typeof DropdownMenuContent>, "align" | "side">) {
  return (
    <DropdownMenuContent className="w-56" {...props}>
      {showAccounts && (
        <>
          <DropdownMenuLabel>Accounts</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuRadioGroup
              value={String(selectedAccountId)}
              onValueChange={(value) => {
                const account = accounts.find((item) => item.id === Number(value));
                if (account) {
                  onSelectAccount(account);
                }
              }}
            >
              {accounts.map((account) => (
                <DropdownMenuRadioItem key={account.id} value={String(account.id)}>
                  <div className="flex min-w-0 flex-col">
                    <span>{account.label}</span>
                    <span className="truncate text-muted-foreground text-xs">{account.email}</span>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuGroup>
        <DropdownMenuItem onSelect={() => toast.info("Opening Account Connection Wizard...")}>
          <UserPlus />
          Add account
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast.info("Opening Account Manager...")}>
          <UsersRound />
          Manage accounts
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => toast.info("Opening Settings...")}>
          <Settings2 />
          Account settings
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onSelect={() => toast.success("Signed out of all accounts")}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}
