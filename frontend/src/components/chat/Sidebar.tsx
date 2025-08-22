import { X, Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation } from "./ChatLayout";

interface SidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewChat,
  isOpen,
  onClose
}: SidebarProps) => {
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:relative w-80 h-full bg-sidebar-background border-r border-border flex flex-col z-50 transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          !isOpen && "lg:w-0 lg:overflow-hidden"
        )}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Button
              onClick={onNewChat}
              className="flex-1 justify-start gap-2 bg-gradient-primary hover:bg-primary-hover text-primary-foreground border-0"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden ml-2 p-2 hover:bg-sidebar-item-hover"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative p-3 rounded-lg cursor-pointer transition-all duration-200",
                    "hover:bg-sidebar-item-hover",
                    currentConversation?.id === conversation.id && "bg-primary/10 border border-primary/20"
                  )}
                  onClick={() => {
                    onSelectConversation(conversation);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-foreground truncate">
                        {conversation.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(conversation.createdAt)}
                      </p>
                      {conversation.messages.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conversation.messages[conversation.messages.length - 1].content}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-destructive/20 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement delete conversation
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            <p>AI Chat Interface</p>
            <p className="mt-1">Built with React & Tailwind</p>
          </div>
        </div>
      </aside>
    </>
  );
};