"use client";

import { Globe2 } from "lucide-react";

import { useCompanies } from "@/app/(main)/dashboard/companies/_components/companies-provider";
import type { OperatingScope } from "@/app/(main)/dashboard/companies/_components/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const scopes: OperatingScope[] = ["Group", "Saudi Arabia", "UAE", "Kuwait", "Egypt", "Qatar", "Bahrain"];

export function OperatingScopeSelector() {
  const { rules, setScope } = useCompanies();
  return (
    <Select value={rules.activeScope} onValueChange={(value) => setScope(value as OperatingScope)}>
      <SelectTrigger size="sm" className="max-w-44">
        <Globe2 aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {scopes.map((scope) => (
            <SelectItem key={scope} value={scope}>
              {scope === "Group" ? "Group · SAR" : scope}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
