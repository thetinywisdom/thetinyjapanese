import { useEffect, useState } from "react";
import {
  ChevronDown,
  Copy,
  Eraser,
  ImagePlus,
  MousePointer2,
  Pencil,
  Redo2,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type DiaryTool = "select" | "pen" | "eraser";

export const CRAYON_COLORS = [
  { name: "Ink", value: "#3a2a24" },
  { name: "Blue", value: "#2f6fb5" },
  { name: "Sky", value: "#7ec1e0" },
  { name: "Pink", value: "#ef4c7c" },
  { name: "Yellow", value: "#f2cf3f" },
  { name: "Teal", value: "#37b3a3" },
  { name: "Brown", value: "#8a5a3b" },
];

export const PEN_SIZES = [
  { label: "S", value: 6 },
  { label: "M", value: 12 },
  { label: "L", value: 24 },
];

interface Props {
  color: string;
  size: number;
  tool: DiaryTool;
  canUndo: boolean;
  canRedo: boolean;
  onColor: (c: string) => void;
  onSize: (s: number) => void;
  onTool: (t: DiaryTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onImage: () => void;
  onText: () => void;
  onCopy: () => void;
  hasSelection: boolean;
}

export function DiaryToolbar({
  color,
  size,
  tool,
  canUndo,
  canRedo,
  onColor,
  onSize,
  onTool,
  onUndo,
  onRedo,
  onClear,
  onImage,
  onText,
  onCopy,
  hasSelection,
}: Props) {
  const [penMenuOpen, setPenMenuOpen] = useState(false);

  useEffect(() => {
    if (tool !== "pen") setPenMenuOpen(false);
  }, [tool]);

  const iconButton = "h-10 w-10 shrink-0 p-0";

  return (
    <div data-export-hide className="flex items-center justify-between gap-2 overflow-x-auto rounded-t-md border border-b-0 bg-background/90 backdrop-blur p-1.5">
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          variant={tool === "select" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => onTool("select")}
          aria-label="Select"
          title="Select"
          className={iconButton}
        >
          <MousePointer2 />
        </Button>

        <Popover open={penMenuOpen} onOpenChange={setPenMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={tool === "pen" ? "secondary" : "ghost"}
              onClick={() => {
                onTool("pen");
                if (tool !== "pen") setPenMenuOpen(true);
              }}
              aria-label="Pen settings"
              title="Pen"
              className="h-10 shrink-0 gap-0.5 px-2"
            >
              <Pencil />
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto space-y-3 p-3">
            <div className="flex items-center gap-2">
              {CRAYON_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-label={c.name}
                  aria-pressed={color === c.value}
                  onClick={() => onColor(c.value)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform",
                    color === c.value
                      ? "border-foreground scale-110"
                      : "border-border hover:scale-105",
                  )}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              {PEN_SIZES.map((s) => (
                <Button
                  key={s.value}
                  type="button"
                  variant={size === s.value ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => onSize(s.value)}
                  aria-pressed={size === s.value}
                  className="h-9 min-w-12 px-3"
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button type="button" variant={tool === "eraser" ? "secondary" : "ghost"} size="icon" onClick={() => onTool("eraser")} aria-label="Eraser" title="Eraser" className={iconButton}>
          <Eraser />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onImage} aria-label="Add image" title="Add image" className={iconButton}>
          <ImagePlus />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onText} aria-label="Add text" title="Add text" className={iconButton}>
          <Type />
        </Button>

      </div>

      <div className="flex items-center gap-0.5">
        <Button type="button" variant="ghost" size="icon" onClick={onCopy} disabled={!hasSelection} aria-label="Duplicate selected item" title="Duplicate" className={iconButton}>
          <Copy />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} aria-label="Undo drawing" title="Undo" className={iconButton}>
          <Undo2 />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} aria-label="Redo drawing" title="Redo" className={iconButton}>
          <Redo2 />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onClear} aria-label="Clear drawing" title="Clear all" className={iconButton}>
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
