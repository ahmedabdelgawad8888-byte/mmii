"use client";

import * as React from "react";

import { Download, FileText, LockKeyhole, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { ProfileDocument } from "./profile-data";

export function ProfileDocuments({ documents: initialDocs }: { documents: ProfileDocument[] }) {
  const [docList, setDocList] = React.useState<ProfileDocument[]>(initialDocs);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [docName, setDocName] = React.useState("");
  const [docCategory, setDocCategory] = React.useState("Legal");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    const newDoc: ProfileDocument = {
      id: `doc-${Date.now()}`,
      name: docName.trim().endsWith(".pdf") ? docName.trim() : `${docName.trim()}.pdf`,
      category: docCategory,
      updatedAt: "Just now",
      status: "Current",
      isRestricted: false,
    };

    setDocList((prev) => [newDoc, ...prev]);
    setIsAddOpen(false);
    setDocName("");
    toast.success(`Document "${newDoc.name}" uploaded successfully`);
  };

  const handleDownload = (doc: ProfileDocument) => {
    toast.success(`Downloading ${doc.name}...`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading font-medium text-base">Documents ({docList.length})</h2>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <FileText data-icon="inline-start" />
          Add document
        </Button>
      </div>

      <Table className="border-y">
        <TableCaption className="sr-only">Documents attached to this contractor profile</TableCaption>
        <TableHeader className="[&_th]:h-8">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-2/5">
              <span>Document</span>
            </TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Access</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docList.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium">{document.name}</TableCell>
              <TableCell className="text-muted-foreground">{document.category}</TableCell>
              <TableCell className="text-muted-foreground">{document.updatedAt}</TableCell>
              <TableCell>
                <Badge className="rounded-sm" variant="outline">
                  {document.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {document.isRestricted ? (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs" title="Restricted">
                    <LockKeyhole aria-hidden="true" className="size-3.5" />
                    Restricted
                  </span>
                ) : (
                  <Button
                    aria-label={`Download ${document.name}`}
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => handleDownload(document)}
                  >
                    <Download />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Add Document Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>Attach a verified document or certificate to this profile.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="doc-name">Document Title</Label>
                <Input
                  id="doc-name"
                  placeholder="e.g. Non-Disclosure Agreement 2026"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Category</Label>
                <Select value={docCategory} onValueChange={setDocCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="Tax">Tax</SelectItem>
                    <SelectItem value="Identity">Identity</SelectItem>
                    <SelectItem value="Certification">Certification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Plus data-icon="inline-start" />
                Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
