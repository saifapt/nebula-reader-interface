import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Highlighter,
  PenTool,
  Eraser,
  Type,
  Circle,
  Square,
  ArrowRight,
  Settings,
} from "lucide-react";

interface FloatingToolsMenuProps {
  isVisible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

const drawingTools = [
  { icon: PenTool, label: "Pen", id: "pen" },
  { icon: Highlighter, label: "Highlighter", id: "highlighter" },
  { icon: Eraser, label: "Eraser", id: "eraser" },
  { icon: Type, label: "Text", id: "text" },
  { icon: ArrowRight, label: "Arrow", id: "arrow" },
  { icon: Circle, label: "Circle", id: "circle" },
  { icon: Square, label: "Rectangle", id: "rectangle" },
  { icon: Palette, label: "Colors", id: "colors" },
];

export const FloatingToolsMenu = ({ isVisible, onClose, position }: FloatingToolsMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, onClose]);

  const handleToolClick = (toolId: string) => {
    console.log(`Drawing tool selected: ${toolId}`);
    // Placeholder for tool selection logic
  };

  if (!isVisible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-40 bg-surface-dark/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-elevated"
      style={{
        left: Math.min(position.x, window.innerWidth - 200),
        top: Math.min(position.y, window.innerHeight - 300),
      }}
    >
      <div className="grid grid-cols-2 gap-2 mb-3">
        {drawingTools.map((tool) => (
          <Button
            key={tool.id}
            variant="outline"
            size="sm"
            onClick={() => handleToolClick(tool.id)}
            className="flex flex-col items-center gap-1 h-auto py-3 bg-surface-light border-border hover-glow"
          >
            <tool.icon className="h-4 w-4" />
            <span className="text-xs">{tool.label}</span>
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleToolClick("settings")}
        className="w-full justify-start gap-2 bg-surface-light border-border hover-glow"
      >
        <Settings className="h-4 w-4" />
        Tool Settings
      </Button>
    </div>
  );
};