"use client";

import * as React from "react";

import { FolderPlus, Grid2X2, List, Upload } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  type FileManagerFile,
  type FileManagerFolder,
  type FileManagerView,
  files as initialFiles,
  folders as initialFolders,
} from "./data";
import { FileGridView } from "./file-grid-view";
import { FileListView } from "./file-list-view";
import { FileManagerToolbar } from "./file-manager-toolbar";
import { FoldersSection } from "./folders-section";

export function FileManagerClient() {
  const [folders, setFolders] = React.useState<FileManagerFolder[]>(initialFolders);
  const [files, setFiles] = React.useState<FileManagerFile[]>(initialFiles);
  const [activeView, setActiveView] = React.useState<FileManagerView>("grid");

  // Toolbar states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterShow, setFilterShow] = React.useState("all");
  const [filterType, setFilterType] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("modified");

  // Dialog states
  const [folderDialogOpen, setFolderDialogOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: FileManagerFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      fileCount: 0,
      size: "0 KB",
      updatedAt: "Just now",
    };

    setFolders((prev) => [newFolder, ...prev]);
    toast.success(`Created folder "${newFolder.name}"`);
    setNewFolderName("");
    setFolderDialogOpen(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let kind: FileManagerFile["kind"] = "document";
    if (file.name.endsWith(".pdf")) kind = "pdf";
    else if (file.name.endsWith(".zip") || file.name.endsWith(".tar.gz")) kind = "archive";
    else if (file.name.endsWith(".xlsx") || file.name.endsWith(".csv")) kind = "spreadsheet";
    else if (file.name.endsWith(".fig") || file.name.endsWith(".png") || file.name.endsWith(".jpg")) kind = "design";

    const newFileRecord: FileManagerFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      kind,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      modifiedAt: "Just now",
      owner: "You",
      ownerInitials: "YO",
      starred: false,
      shared: false,
    };

    setFiles((prev) => [newFileRecord, ...prev]);
    toast.success(`Uploaded "${file.name}"`, {
      description: `Size: ${newFileRecord.size} · Stored in My files`,
    });
  };

  // Filtered folders
  const filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Filtered and sorted files
  const filteredFiles = React.useMemo(() => {
    let result = files.filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterShow === "starred" && !f.starred) return false;
      if (filterShow === "shared" && !f.shared) return false;

      if (filterType !== "all" && f.kind !== filterType) return false;

      return true;
    });

    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "size") {
      result = [...result].sort((a, b) => b.size.localeCompare(a.size));
    }

    return result;
  }, [files, searchQuery, filterShow, filterType, sortBy]);

  const handleToggleStar = (fileId: string) => {
    setFiles((current) => current.map((file) => (file.id === fileId ? { ...file, starred: !file.starred } : file)));
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles((current) => current.filter((file) => file.id !== fileId));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">My files</h1>
          <p className="text-muted-foreground text-sm">Organize, share, and find workspace files.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="cursor-pointer" onClick={() => setFolderDialogOpen(true)}>
            <FolderPlus data-icon="inline-start" />
            New folder
          </Button>
          <Button className="cursor-pointer" onClick={handleUploadClick}>
            <Upload data-icon="inline-start" />
            Upload
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUploaded} />
        </div>
      </div>

      <FileManagerToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterShow={filterShow}
        onFilterShowChange={setFilterShow}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      <FoldersSection folders={filteredFolders} />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-lg">All files</h2>
            <span className="text-muted-foreground text-xs">({filteredFiles.length} files)</span>
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={0}
            value={activeView}
            onValueChange={(val) => {
              if (val) setActiveView(val as FileManagerView);
            }}
            aria-label="File view"
          >
            <ToggleGroupItem value="grid" className="cursor-pointer">
              <Grid2X2 />
              Grid View
            </ToggleGroupItem>
            <ToggleGroupItem value="list" className="cursor-pointer">
              <List />
              List View
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        {activeView === "list" ? (
          <FileListView files={filteredFiles} onToggleStar={handleToggleStar} onDelete={handleDeleteFile} />
        ) : (
          <FileGridView files={filteredFiles} onToggleStar={handleToggleStar} onDelete={handleDeleteFile} />
        )}
      </div>

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateFolder}>
            <DialogHeader>
              <DialogTitle>New Folder</DialogTitle>
              <DialogDescription>Create a new folder to organize workspace documents.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  placeholder="e.g., Marketing Assets, Q3 Invoices"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFolderDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newFolderName.trim()}>
                Create Folder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
