import { Menu, Plus, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavigationProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  sidebarOpen: boolean;
}

export const TopNavigation = ({ onToggleSidebar, onNewChat, sidebarOpen }: TopNavigationProps) => {
  return (
    <header className="h-14 border-b border-nav-border bg-nav-background backdrop-blur-md flex items-center justify-between px-4 relative z-50">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onToggleSidebar}
          className="p-2 hover:bg-surface-hover transition-fast"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-foreground hidden sm:block">AVAI Chat</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          className="hidden sm:flex items-center gap-2 hover:bg-surface-hover transition-fast"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          className="sm:hidden p-2 hover:bg-surface-hover transition-fast"
        >
          <Plus className="w-5 h-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2 hover:bg-surface-hover transition-fast">
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-gray-900 border-border">
            <DropdownMenuItem className="hover:bg-surface-hover transition-fast">
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-surface-hover transition-fast">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:bg-surface-hover transition-fast text-destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};