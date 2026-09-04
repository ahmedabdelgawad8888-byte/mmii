"use client";

import {
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  Globe,
  Link,
  Mail,
  MapPin,
  Monitor,
  MoreHorizontal,
  Phone,
  PhoneCall,
  Share2,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials } from "@/lib/utils";

import type { Contact } from "./data";

interface ChatProfileDetailsProps {
  contact: Contact;
  onClose?: () => void;
}

const mockFiles = [
  { name: "deployment_manifest.yaml", size: "24 KB", icon: FileCode, date: "May 5, 2026" },
  { name: "cluster_audit_report.pdf", size: "1.4 MB", icon: FileText, date: "May 3, 2026" },
  { name: "service_quotas_q2.xlsx", size: "380 KB", icon: FileSpreadsheet, date: "Apr 28, 2026" },
];

const mockActivity = [
  { action: "Deployment triggered on Staging", time: "10 mins ago", status: "Success" },
  { action: "Support ticket #8821 assigned", time: "2 hours ago", status: "Open" },
  { action: "Zoom sync call completed (24m)", time: "Yesterday", status: "Completed" },
  { action: "Permissions updated to Enterprise Dev", time: "3 days ago", status: "Updated" },
];

export function ChatProfileDetails({ contact, onClose }: ChatProfileDetailsProps) {
  const handleEmail = () => {
    window.location.href = `mailto:${contact.email}`;
    toast.info(`Opening email draft to ${contact.email}`);
  };

  const handleCall = () => {
    toast.info(`Dialing ${contact.phone}...`);
  };

  const handleSchedule = () => {
    toast.info(`Meeting scheduler opened for ${contact.name}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Profile link copied to clipboard");
  };

  const handleDownload = (fileName: string) => {
    toast.success(`Downloading ${fileName}...`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-start gap-3">
        <Avatar size="lg" className="shrink-0">
          <AvatarFallback className="bg-background">{getInitials(contact.name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="truncate font-medium leading-5">{contact.name}</div>
          <div className="truncate text-muted-foreground text-xs">{contact.role}</div>
        </div>

        <Button variant="ghost" size="icon-sm" aria-label="Close profile" onClick={onClose}>
          <X />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button size="icon-sm" variant="ghost" aria-label="Email" onClick={handleEmail}>
          <Mail className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Call" onClick={handleCall}>
          <PhoneCall className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Schedule" onClick={handleSchedule}>
          <Calendar className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Copy link" onClick={handleCopyLink}>
          <Link className="size-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" aria-label="More options">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => toast.info(`Exported conversation transcript for ${contact.name}`)}>
                <Share2 />
                Export Chat
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast.success(`Muted notifications for ${contact.name}`)}>
                Mute Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="details" className="flex flex-1 flex-col">
        <TabsList variant="line" className="w-full justify-between border-b px-0 **:data-[slot=tabs-trigger]:flex-1">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="files">Files ({mockFiles.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Email</span>
              <span className="ml-auto truncate text-sm">{contact.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Phone</span>
              <span className="ml-auto truncate text-sm">{contact.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Website</span>
              <span className="ml-auto truncate text-sm">{contact.website}</span>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Company</span>
              <span className="ml-auto truncate text-sm">{contact.company}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserRound className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Role</span>
              <span className="ml-auto truncate text-sm">{contact.role}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Stage</span>
              <Badge variant="secondary" className="ml-auto">
                {contact.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Qualified since</span>
              <span className="ml-auto truncate text-sm">{contact.qualifiedAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Timezone</span>
              <span className="ml-auto truncate text-sm">{contact.timezone}</span>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Location</span>
              <span className="ml-auto truncate text-sm">{contact.location}</span>
            </div>
            <div className="flex items-start gap-2">
              <Tag className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Tags</span>
              <div className="ml-auto flex flex-wrap justify-end gap-1">
                {contact.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-4 flex flex-col gap-2">
          {mockFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between rounded-lg border p-2.5 text-xs transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <file.icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="truncate font-medium">{file.name}</div>
                  <div className="text-muted-foreground">
                    {file.size} · {file.date}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDownload(file.name)}
                aria-label={`Download ${file.name}`}
              >
                <Download className="size-3.5" />
              </Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="activity" className="mt-4 flex flex-col gap-3">
          {mockActivity.map((act) => (
            <div key={act.action} className="flex flex-col gap-0.5 border-b pb-2.5 text-xs last:border-b-0">
              <div className="flex items-center justify-between font-medium">
                <span>{act.action}</span>
                <Badge variant="outline" className="text-[10px] py-0">
                  {act.status}
                </Badge>
              </div>
              <span className="text-muted-foreground text-[11px]">{act.time}</span>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
