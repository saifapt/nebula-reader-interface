import { Search, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  isFlipbookMode: boolean;
  onToggleMode: () => void;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  isMobile: boolean;
}

export const Header = ({
  isFlipbookMode,
  onToggleMode,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  isMobile,
}: HeaderProps) => {
  return (
    <header className="h-16 border-b border-border surface-gradient flex items-center justify-between px-4 relative z-50">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleLeftSidebar}
            className="hover-glow"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
            FlipAI
          </span>
        </div>
      </div>

      {/* Center Section */}
      <div className="flex items-center gap-4 flex-1 max-w-md mx-4">
        {/* Mode Toggle - Hidden on mobile */}
        {!isMobile && (
          <div className="flex items-center bg-surface-dark rounded-lg p-1 border border-border">
            <Button
              variant={isFlipbookMode ? "default" : "ghost"}
              size="sm"
              onClick={() => onToggleMode()}
              className={`text-xs transition-all ${
                isFlipbookMode ? "glow-primary" : "hover:bg-surface-light"
              }`}
            >
              Flipbook
            </Button>
            <Button
              variant={!isFlipbookMode ? "default" : "ghost"}
              size="sm"
              onClick={() => onToggleMode()}
              className={`text-xs transition-all ${
                !isFlipbookMode ? "glow-primary" : "hover:bg-surface-light"
              }`}
            >
              PDF
            </Button>
          </div>
        )}

        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes and bookmarks..."
            className="pl-10 bg-surface-dark border-border hover-glow focus:glow-primary"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleRightSidebar}
            className="hover-glow"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover-glow">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-surface-dark border border-border">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-surface-dark border-border shadow-elevated"
          >
            <DropdownMenuItem className="hover:bg-surface-light">
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-surface-light">
              Reading Preferences
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-surface-light">
              Export Notes
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-surface-light text-destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};