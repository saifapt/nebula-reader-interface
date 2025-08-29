import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

interface DraggableFloatingIconProps {
  onToggleMenu: (position: { x: number; y: number }) => void;
}

export const DraggableFloatingIcon = ({ onToggleMenu }: DraggableFloatingIconProps) => {
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const iconRef = useRef<HTMLButtonElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 48, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 48, e.clientY - dragStart.y));
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      e.preventDefault();
      const rect = iconRef.current?.getBoundingClientRect();
      if (rect) {
        onToggleMenu({ x: rect.right + 10, y: rect.top });
      }
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <Button
      ref={iconRef}
      variant="outline"
      size="icon"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className="fixed z-30 w-12 h-12 bg-surface-dark/70 backdrop-blur-sm border-border hover-glow cursor-move transition-all duration-200"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <Palette className="h-5 w-5" />
    </Button>
  );
};