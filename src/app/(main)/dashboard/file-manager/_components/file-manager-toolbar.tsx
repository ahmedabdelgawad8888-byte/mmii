"use client";

import { ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

export interface FileManagerToolbarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  filterShow?: string;
  onFilterShowChange?: (val: string) => void;
  filterType?: string;
  onFilterTypeChange?: (val: string) => void;
  sortBy?: string;
  onSortByChange?: (val: string) => void;
}

export function FileManagerToolbar({
  searchQuery = "",
  onSearchChange,
  filterShow = "all",
  onFilterShowChange,
  filterType = "all",
  onFilterTypeChange,
  sortBy = "modified",
  onSortByChange,
}: FileManagerToolbarProps) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <InputGroup className="md:max-w-lg">
        <InputGroupInput
          placeholder="Search files and folders..."
          aria-label="Search files and folders"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
      <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="cursor-pointer">
              <SlidersHorizontal data-icon="inline-start" />
              Filter & sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Show</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={filterShow} onValueChange={onFilterShowChange}>
                <DropdownMenuRadioItem value="all" className="cursor-pointer">
                  All files
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="starred" className="cursor-pointer">
                  Starred
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="shared" className="cursor-pointer">
                  Shared
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <SlidersHorizontal />
                  File type
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={8}>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup value={filterType} onValueChange={onFilterTypeChange}>
                      <DropdownMenuRadioItem value="all" className="cursor-pointer">
                        All types
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="archive" className="cursor-pointer">
                        Archive
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="design" className="cursor-pointer">
                        Design
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="document" className="cursor-pointer">
                        Document
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="pdf" className="cursor-pointer">
                        PDF
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="spreadsheet" className="cursor-pointer">
                        Spreadsheet
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <ArrowUpDown />
                  Sort by
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={8}>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup value={sortBy} onValueChange={onSortByChange}>
                      <DropdownMenuRadioItem value="modified" className="cursor-pointer">
                        Last modified
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="name" className="cursor-pointer">
                        Name
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="size" className="cursor-pointer">
                        File size
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
