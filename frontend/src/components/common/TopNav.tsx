import { Menu, Plus, Settings, User } from "lucide-react";

interface TopNavProps {
    onToggleSidebar: () => void;
    sidebarOpen: boolean;
    hasMessages: boolean;
}

const TopNav = ({ onToggleSidebar, sidebarOpen, hasMessages }: TopNavProps) => {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-sm border-b border-border">
            <nav className="flex items-center justify-between h-full px-4">
                {hasMessages && (
                    <div className="flex items-center space-x-3">
                        <button className="p-2" onClick={onToggleSidebar}><Menu className="h-5 w-5" /></button>
                    </div>
                )}
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                        <span className="text-black font-bold text-sm">AVAI</span>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {/* this is for adding later sahir, for adding chats. chatgpt does not have stuff here, so maybe remove later. */}
                    {/* {hasMessages && (
                        <button className="p-2">
                            <Plus className="h-5 w-5" />
                        </button>
                    )} */}

                    <button className="p-2">
                        <Settings className="h-5 w-5" />
                    </button>

                    <button className="p-2">
                        <User className="h-5 w-5" />
                    </button>
                </div>
            </nav>
        </div>
    );
}

export default TopNav;