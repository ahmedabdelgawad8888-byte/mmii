"use client";

import { Download, MoreVertical, Share2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { FileManagerFile } from "./data";

interface FileActionsProps {
  file: FileManagerFile;
  onToggleStar: () => void;
  onDelete?: (id: string) => void;
}

export function FileActions({ file, onToggleStar, onDelete }: FileActionsProps) {
  const handleDownload = () => {
    toast.success(`Downloading ${file.name}`, {
      description: `File size: ${file.size} · Saved to Downloads folder`,
    });
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`https://trygc.hub/files/${file.id}`);
    }
    toast.success("Share link copied to clipboard", {
      description: `Anyone with access can view ${file.name}`,
    });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(file.id);
    }
    toast.error(`Moved ${file.name} to trash`, {
      action: {
        label: "Undo",
        onClick: () => toast.success(`Restored ${file.name}`),
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${file.name}`} className="cursor-pointer">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onToggleStar} className="cursor-pointer">
            <Star className={file.starred ? "fill-amber-400 text-amber-400" : ""} />
            {file.starred ? "Remove from starred" : "Add to starred"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
            <Download />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
            <Share2 />
            Copy share link
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={handleDelete} className="cursor-pointer">
            <Trash2 />
            Move to trash
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
