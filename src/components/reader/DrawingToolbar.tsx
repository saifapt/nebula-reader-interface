import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  PenTool,
  Highlighter,
  Eraser,
  Type,
  ArrowRight,
  Circle,
  Square,
  Palette,
  RotateCcw,
  RotateCw,
  Minus
} from 'lucide-react';
import { DrawingTool } from '@/lib/pdf-integration';

interface DrawingToolbarProps {
  currentTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onAddShape: (type: 'rectangle' | 'circle' | 'line' | 'arrow' | 'text') => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClear?: () => void;
  className?: string;
}

const colorPresets = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
];

export const DrawingToolbar = ({
  currentTool,
  onToolChange,
  onAddShape,
  onUndo,
  onRedo,
  onClear,
  className = ''
}: DrawingToolbarProps) => {
  const [customColor, setCustomColor] = useState(currentTool.color);

  const toolButtons = [
    { icon: PenTool, type: 'pen' as const, label: 'Pen' },
    { icon: Highlighter, type: 'highlighter' as const, label: 'Highlighter' },
    { icon: Eraser, type: 'eraser' as const, label: 'Eraser' },
    { icon: Type, type: 'text' as const, label: 'Text' },
  ];

  const shapeButtons = [
    { icon: Square, type: 'rectangle' as const, label: 'Rectangle' },
    { icon: Circle, type: 'circle' as const, label: 'Circle' },
    { icon: Minus, type: 'line' as const, label: 'Line' },
    { icon: ArrowRight, type: 'arrow' as const, label: 'Arrow' },
  ];

  const handleToolSelect = (type: DrawingTool['type']) => {
    onToolChange({ ...currentTool, type });
  };

  const handleColorChange = (color: string) => {
    onToolChange({ ...currentTool, color });
    setCustomColor(color);
  };

  const handleWidthChange = (width: number[]) => {
    onToolChange({ ...currentTool, width: width[0] });
  };

  return (
    <div className={`flex items-center gap-2 p-3 bg-surface-dark border border-border rounded-lg ${className}`}>
      {/* Drawing Tools */}
      <div className="flex gap-1">
        {toolButtons.map((tool) => (
          <Button
            key={tool.type}
            variant={currentTool.type === tool.type ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolSelect(tool.type)}
            className="h-8 w-8 p-0"
            title={tool.label}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Shape Tools */}
      <div className="flex gap-1">
        {shapeButtons.map((shape) => (
          <Button
            key={shape.type}
            variant="outline"
            size="sm"
            onClick={() => onAddShape(shape.type)}
            className="h-8 w-8 p-0"
            title={shape.label}
          >
            <shape.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Color Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            title="Color"
          >
            <div 
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: currentTool.color }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border-2 border-border hover:border-primary"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={customColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-12 h-8 p-0 border-none"
              />
              <Input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                onBlur={(e) => handleColorChange(e.target.value)}
                className="flex-1 h-8"
                placeholder="#000000"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Stroke Width */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Width:</span>
        <div className="w-16">
          <Slider
            value={[currentTool.width]}
            onValueChange={handleWidthChange}
            max={20}
            min={1}
            step={1}
            className="flex-1"
          />
        </div>
        <span className="text-xs text-muted-foreground min-w-0">{currentTool.width}</span>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Action Buttons */}
      <div className="flex gap-1">
        {onUndo && (
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            className="h-8 w-8 p-0"
            title="Undo"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        {onRedo && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRedo}
            className="h-8 w-8 p-0"
            title="Redo"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        )}
        {onClear && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-8 w-8 p-0"
            title="Clear All"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};