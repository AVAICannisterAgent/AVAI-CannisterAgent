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
    <header className="h-11 sm:h-12 lg:h-14 border-b border-nav-border bg-nav-background backdrop-blur-md flex items-center justify-between px-3 sm:px-4 relative z-50">
      <div className="flex items-center gap-2 sm:gap-3">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onToggleSidebar}
          className="p-1.5 sm:p-2 hover:bg-surface-hover transition-fast"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="font-semibold text-foreground text-sm sm:text-base">
            AVAI <span className="text-xs opacity-60 hidden sm:inline">🩺</span>
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

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          className="hidden md:flex items-center gap-2 hover:bg-surface-hover transition-fast text-xs sm:text-sm px-2 sm:px-3"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>New Chat</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          className="md:hidden p-1.5 sm:p-2 hover:bg-surface-hover transition-fast"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1.5 sm:p-2 hover:bg-surface-hover transition-fast">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
            <DropdownMenuItem className="hover:bg-surface-hover transition-fast text-xs sm:text-sm">
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-surface-hover transition-fast text-xs sm:text-sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:bg-surface-hover transition-fast text-destructive text-xs sm:text-sm">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};