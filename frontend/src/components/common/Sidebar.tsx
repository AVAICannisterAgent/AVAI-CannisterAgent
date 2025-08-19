import { useState } from 'react';
import { MessageSquare, Search, Pin, X } from 'lucide-react';

interface Conversation {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    pinned?: boolean;
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: Conversation[];
}

export function Sidebar({ isOpen, onClose, conversations }: SidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    return (
        <>
            {/* Mobile overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className={`
        fixed left-0 top-14 bottom-0 z-50 w-80 bg-sidebar border-r border-sidebar-border
        transform transition-transform duration-300 ease-out
        md:relative md:top-0 md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-sidebar-border">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-sidebar-primary">Conversations</h2>
                            <button
                                onClick={onClose}
                                className="md:hidden p-2"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sidebar-foreground h-4 w-4" />
                            <input
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-sidebar-accent border-sidebar-border"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-2">
                            {conversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <MessageSquare className="h-12 w-12 text-sidebar-foreground/50 mb-4" />
                                    <p className="text-sidebar-foreground/70 text-sm">
                                        Your conversations will appear here
                                    </p>
                                    <p className="text-sidebar-foreground/50 text-xs mt-1">
                                        Start a new chat to begin
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {conversations.map((conversation) => (
                                        <button
                                            key={conversation.id}
                                            className="w-full p-3 text-left rounded-lg hover:bg-sidebar-accent transition-colors group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-sidebar-primary text-sm truncate">
                                                        {conversation.title}
                                                    </h3>
                                                    <p className="text-sidebar-foreground text-xs mt-1 truncate">
                                                        {conversation.lastMessage}
                                                    </p>
                                                    <span className="text-sidebar-foreground/50 text-xs">
                                                        {conversation.timestamp.toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {conversation.pinned && (
                                                    <Pin className="h-3 w-3 text-sidebar-foreground/50 mt-1 flex-shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </aside>
        </>
    );
}