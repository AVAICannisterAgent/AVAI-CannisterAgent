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
  
  const handleNewChat = () => {
    console.log('🔄 New Chat button clicked');
    onNewChat();
  };

  return (
    <header className="h-12 border-b border-nav-border bg-nav-background backdrop-blur-md flex items-center justify-between px-3 relative z-50">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onToggleSidebar}
          className="p-1.5 hover:bg-surface-hover transition-fast"
        >
          <Menu className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-semibold text-foreground text-sm">
              AVAI
            </span>
            <span className="text-xs text-foreground/60 block -mt-0.5">
              ICP Doctor
            </span>
          </div>
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

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          className="hidden sm:flex items-center gap-1.5 hover:bg-surface-hover transition-fast px-2 py-1.5 h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          className="sm:hidden p-1.5 hover:bg-surface-hover transition-fast"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-1.5 hover:bg-surface-hover transition-fast">
              <Settings className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
            <DropdownMenuItem className="hover:bg-surface-hover transition-fast text-sm">
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-surface-hover transition-fast text-sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:bg-surface-hover transition-fast text-destructive text-sm">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};