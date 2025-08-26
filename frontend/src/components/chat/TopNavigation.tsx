import { Menu, Plus, Settings, User, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HeartbeatStatus } from "./HeartbeatStatus";

interface TopNavigationProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  sidebarOpen: boolean;
  isConnected?: boolean;
  isTyping?: boolean;
  lastHeartbeat?: Date;
  waitingTime?: number;
}

export const TopNavigation = ({ 
  onToggleSidebar, 
  onNewChat, 
  sidebarOpen, 
  isConnected = false, 
  isTyping = false, 
  lastHeartbeat, 
  waitingTime = 0 
}: TopNavigationProps) => {
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
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-foreground hidden sm:block">
            AVAI <span className="text-xs opacity-60">🩺</span>
          </span>
        </div>
      </div>

      {/* Compact Heartbeat Status */}
      <div className="flex-1 flex justify-center">
        <HeartbeatStatus
          isConnected={isConnected}
          isTyping={isTyping}
          lastHeartbeat={lastHeartbeat}
          waitingTime={waitingTime}
        />
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
          <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
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