"use client";

import * as React from "react";

import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import {
  ArrowUpDown,
  Bot,
  ChevronDown,
  Kanban as KanbanIcon,
  LayoutTemplate,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Table2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
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
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { columnIds, columns } from "./data";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import type { BoardState, ColumnId, Task, TaskPriority, TaskTeam } from "./types";

interface KanbanProps {
  initialBoard: BoardState;
}

type TaskDragData = {
  type: "task";
  task: Task;
  columnId: ColumnId;
};

function isColumnId(value: unknown): value is ColumnId {
  return typeof value === "string" && columnIds.includes(value as ColumnId);
}

function isTaskDragData(value: unknown): value is TaskDragData {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "task" &&
    "task" in value &&
    typeof value.task === "object" &&
    value.task !== null &&
    "columnId" in value &&
    isColumnId(value.columnId)
  );
}

function getTaskPriorityBadgeVariant(priority: TaskPriority): "destructive" | "default" | "secondary" {
  if (priority === "High") return "destructive";
  if (priority === "Medium") return "default";
  return "secondary";
}

export function Kanban({ initialBoard }: KanbanProps) {
  const [board, setBoard] = React.useState<BoardState>(initialBoard);
  const [columnOrder, setColumnOrder] = React.useState<ColumnId[]>(columnIds);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all");
  const [activeTab, setActiveTab] = React.useState("board");

  // Add Task dialog state
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [targetColumn, setTargetColumn] = React.useState<ColumnId>("ideas");
  const [newTitle, setNewTitle] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newPriority, setNewPriority] = React.useState<TaskPriority>("Medium");
  const [newTeam, setNewTeam] = React.useState<TaskTeam>("Platform");

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const boardBeforeDrag = React.useRef<BoardState>(initialBoard);

  const orderedColumns = columnOrder.flatMap((columnId) => columns.find((column) => column.id === columnId) ?? []);

  // Filter tasks based on query and priority
  const filteredBoard = React.useMemo(() => {
    const result: BoardState = {
      ideas: [],
      planned: [],
      building: [],
      qa: [],
      shipped: [],
    };

    for (const colId of columnIds) {
      result[colId] = (board[colId] ?? []).filter((task) => {
        const matchesQuery =
          !searchQuery.trim() ||
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.team.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
        return matchesQuery && matchesPriority;
      });
    }

    return result;
  }, [board, searchQuery, priorityFilter]);

  function handleDragStart(event: DragStartEvent) {
    const { source } = event.operation;

    if (source?.type === "task") {
      boardBeforeDrag.current = board;
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (event.operation.source?.type === "task") {
      setBoard((currentBoard) => move(currentBoard, event));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source } = event.operation;

    if (!source) {
      return;
    }

    if (event.canceled) {
      if (source.type === "task") {
        setBoard(boardBeforeDrag.current);
      }
      return;
    }

    if (source.type === "column") {
      setColumnOrder((currentOrder) => move(currentOrder, event));
    }
  }

  const handleOpenAddTask = (colId?: ColumnId) => {
    if (colId) setTargetColumn(colId);
    setNewTitle("");
    setNewDescription("");
    setNewPriority("Medium");
    setNewTeam("Platform");
    setIsAddOpen(true);
  };

  const handleSaveNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Task title cannot be empty");
      return;
    }

    const createdTask: Task = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || "No description provided.",
      priority: newPriority,
      dueDate: "Tomorrow",
      progress: 0,
      owner: { name: "Current User", tone: "indigo" },
      team: newTeam,
      insights: [
        { label: "Comments", count: 0 },
        { label: "Attachments", count: 0 },
        { label: "Documents", count: 0 },
      ],
    };

    setBoard((prev) => ({
      ...prev,
      [targetColumn]: [createdTask, ...prev[targetColumn]],
    }));

    setIsAddOpen(false);
    toast.success(`Task "${createdTask.title}" created in ${columns.find((c) => c.id === targetColumn)?.title}`);
  };

  const handleClearColumnTasks = (columnId: ColumnId) => {
    const prevTasks = board[columnId];
    if (!prevTasks || prevTasks.length === 0) {
      toast.info("Column is already empty");
      return;
    }

    setBoard((prev) => ({ ...prev, [columnId]: [] }));
    toast.success(`Cleared ${prevTasks.length} tasks from ${columns.find((c) => c.id === columnId)?.title}`, {
      action: {
        label: "Undo",
        onClick: () => setBoard((prev) => ({ ...prev, [columnId]: prevTasks })),
      },
    });
  };

  const handleSortColumnTasks = (columnId: ColumnId) => {
    setBoard((prev) => {
      const sorted = [...(prev[columnId] ?? [])].sort((a, b) => a.title.localeCompare(b.title));
      return { ...prev, [columnId]: sorted };
    });
    toast.success(`Sorted tasks in ${columns.find((c) => c.id === columnId)?.title} alphabetically`);
  };

  const handleSortAllBoard = (direction: "asc" | "desc") => {
    setBoard((prev) => {
      const updated = { ...prev };
      for (const colId of columnIds) {
        updated[colId] = [...(prev[colId] ?? [])].sort((a, b) =>
          direction === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title),
        );
      }
      return updated;
    });
    toast.success(`Board sorted ${direction === "asc" ? "A to Z" : "Z to A"}`);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imported: Task[] = [
      {
        id: `csv-${Date.now()}-1`,
        title: "Audit user onboarding funnel metrics",
        description: "Review drop-off rates on stage 2 of signup",
        priority: "High",
        dueDate: "Friday",
        progress: 15,
        owner: { name: "Data Lead", tone: "purple" },
        team: "Data",
        insights: [
          { label: "Comments", count: 2 },
          { label: "Attachments", count: 1 },
          { label: "Documents", count: 0 },
        ],
      },
      {
        id: `csv-${Date.now()}-2`,
        title: "Integrate Stripe webhooks fallback retry",
        description: "Implement exponential backoff on transient network failures",
        priority: "Medium",
        dueDate: "Next week",
        progress: 40,
        owner: { name: "DevOps", tone: "blue" },
        team: "Backend",
        insights: [
          { label: "Comments", count: 1 },
          { label: "Attachments", count: 0 },
          { label: "Documents", count: 0 },
        ],
      },
    ];

    setBoard((prev) => ({
      ...prev,
      ideas: [...imported, ...prev.ideas],
    }));

    toast.success(`Imported 2 tasks from "${file.name}"`);
    e.target.value = "";
  };

  const handleAddFromTemplate = () => {
    const templateTasks: Task[] = [
      {
        id: `tmpl-${Date.now()}-1`,
        title: "Sprint Planning & Estimation Session",
        description: "Break down quarterly deliverables into actionable 2-week milestones",
        priority: "High",
        dueDate: "Monday",
        progress: 0,
        owner: { name: "Product Manager", tone: "indigo" },
        team: "Product",
        insights: [
          { label: "Comments", count: 4 },
          { label: "Attachments", count: 2 },
          { label: "Documents", count: 1 },
        ],
      },
      {
        id: `tmpl-${Date.now()}-2`,
        title: "Database Index Tuning for Large Tables",
        description: "Analyze slow query log and add missing composite indexes",
        priority: "Medium",
        dueDate: "Wednesday",
        progress: 25,
        owner: { name: "DBA", tone: "emerald" },
        team: "Backend",
        insights: [
          { label: "Comments", count: 3 },
          { label: "Attachments", count: 0 },
          { label: "Documents", count: 0 },
        ],
      },
    ];

    setBoard((prev) => ({
      ...prev,
      planned: [...templateTasks, ...prev.planned],
    }));

    toast.success("Added sprint template tasks to Planned");
  };

  const handleCreateAutomation = () => {
    toast.success("Automation rule enabled: Auto-move QA tickets to Shipped when passed");
  };

  // Flatten tasks for List and Table views
  const allFlattenedTasks = React.useMemo(() => {
    return columnIds.flatMap((colId) =>
      (filteredBoard[colId] ?? []).map((t) => ({
        ...t,
        status: columns.find((c) => c.id === colId)?.title ?? colId,
        colId,
      })),
    );
  }, [filteredBoard]);

  return (
    <div className="flex h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 min-w-0 flex-col overflow-hidden">
      {/* Hidden file input for CSV import */}
      <input type="file" ref={fileInputRef} accept=".csv,.txt" className="hidden" onChange={handleImportCSV} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <TabsList className="w-full *:data-[slot=tabs-trigger]:flex-1 sm:w-fit sm:*:data-[slot=tabs-trigger]:flex-none">
            <TabsTrigger value="board" className="gap-2">
              <KanbanIcon className="size-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="size-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <Table2 className="size-4" />
              Table
            </TabsTrigger>
          </TabsList>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center 2xl:justify-end">
            <InputGroup className="min-w-0 sm:w-64 2xl:w-48">
              <InputGroupInput
                type="search"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
            </InputGroup>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={priorityFilter !== "all" ? "default" : "outline"} className="w-full sm:w-auto">
                  <SlidersHorizontal data-icon="inline-start" className="size-4" />
                  {priorityFilter !== "all" ? `Priority: ${priorityFilter}` : "Filter"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuRadioGroup value={priorityFilter} onValueChange={setPriorityFilter}>
                  <DropdownMenuRadioItem value="all">All Priorities</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="High">High</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Medium">Medium</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="Low">Low</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowUpDown data-icon="inline-start" className="size-4" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => handleSortAllBoard("asc")}>Title (A to Z)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortAllBoard("desc")}>Title (Z to A)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Task Button Group */}
            <ButtonGroup className="w-full sm:w-fit">
              <Button className="flex-1 sm:flex-none" onClick={() => handleOpenAddTask()}>
                <Plus data-icon="inline-start" className="size-4" />
                Add task
              </Button>
              <ButtonGroupSeparator />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Open add task menu" size="icon">
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Upload className="size-4" />
                    Import CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAddFromTemplate}>
                    <LayoutTemplate className="size-4" />
                    Add from template
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCreateAutomation}>
                    <Bot className="size-4" />
                    Create automation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          </div>
        </div>

        {/* Board View */}
        <TabsContent value="board" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
          <DragDropProvider onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="scrollbar-thin h-full min-h-0 min-w-0 overflow-x-auto overflow-y-hidden bg-muted/25 px-4 pt-4 pb-0 [scrollbar-color:var(--border)_transparent] lg:px-5 lg:pt-5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1">
              <div className="inline-grid h-full min-w-full grid-cols-[repeat(5,minmax(20rem,1fr))] gap-4">
                {orderedColumns.map((column, index) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    index={index}
                    tasks={filteredBoard[column.id] ?? []}
                    onAddTask={handleOpenAddTask}
                    onSortTasks={handleSortColumnTasks}
                    onClearTasks={handleClearColumnTasks}
                  />
                ))}
              </div>
            </div>
            <DragOverlay dropAnimation={null}>
              {(source) => {
                if (source.type !== "task" || !isTaskDragData(source.data)) {
                  return null;
                }

                const columnId = isSortable(source) && isColumnId(source.group) ? source.group : source.data.columnId;

                return <TaskCard task={source.data.task} columnId={columnId} isOverlay />;
              }}
            </DragOverlay>
          </DragDropProvider>
        </TabsContent>

        {/* List View */}
        <TabsContent
          value="list"
          className="mt-0 min-h-0 flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden lg:p-6"
        >
          <div className="mx-auto max-w-4xl space-y-3">
            {allFlattenedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-muted-foreground">
                <p className="font-medium">No tasks found</p>
                <p className="text-sm">Try adjusting your search query or filters.</p>
              </div>
            ) : (
              allFlattenedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{task.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {task.status}
                      </Badge>
                      <Badge variant={getTaskPriorityBadgeVariant(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-muted-foreground text-sm">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground text-xs">
                    <span className="rounded bg-muted px-2 py-0.5">{task.team}</span>
                    <span>Due {task.dueDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Table View */}
        <TabsContent
          value="table"
          className="mt-0 min-h-0 flex-1 overflow-auto p-4 data-[state=inactive]:hidden lg:p-6"
        >
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allFlattenedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No tasks found.
                    </TableCell>
                  </TableRow>
                ) : (
                  allFlattenedTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        <div>{task.title}</div>
                        <div className="line-clamp-1 text-muted-foreground text-xs">{task.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTaskPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>
                      </TableCell>
                      <TableCell>{task.team}</TableCell>
                      <TableCell>{task.dueDate}</TableCell>
                      <TableCell className="text-right font-mono">{task.progress}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Task Modal Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task card to the board. Click save when you are finished.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveNewTask} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-col">Column</Label>
              <Select value={targetColumn} onValueChange={(val) => setTargetColumn(val as ColumnId)}>
                <SelectTrigger id="task-col" className="w-full">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                placeholder="e.g. Implement OAuth 2.0 PKCE flow"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-desc">Description</Label>
              <Input
                id="task-desc"
                placeholder="Short description or acceptance criteria..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={newPriority} onValueChange={(val) => setNewPriority(val as TaskPriority)}>
                  <SelectTrigger id="task-priority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-team">Team</Label>
                <Select value={newTeam} onValueChange={(val) => setNewTeam(val as TaskTeam)}>
                  <SelectTrigger id="task-team" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Platform">Platform</SelectItem>
                    <SelectItem value="Backend">Backend</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="QA">QA</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Data">Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
