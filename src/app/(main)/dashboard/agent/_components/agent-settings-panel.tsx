"use client";

import type { ReactNode } from "react";

import Link from "next/link";

import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { ConnectionSection, PermissionSection, VoiceSection } from "./agent-settings-sections";

/** Quick access from the chat; the full surface lives on the settings page. */
export function AgentSettingsPanel({ children }: { children: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Agent settings</SheetTitle>
          <SheetDescription>Choose a provider and model, and decide what the agent may do on its own.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-8">
          <ConnectionSection />
          <Separator />
          <PermissionSection />
          <Separator />
          <VoiceSection />
          <Separator />
          <Button variant="outline" asChild>
            <Link href="/dashboard/agent/settings">
              All agent settings <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
