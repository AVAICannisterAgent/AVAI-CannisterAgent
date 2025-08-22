import { useState, useEffect } from "react";
import { TopNavigation } from "./TopNavigation";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { MessageInput } from "./MessageInput";
import { FileViewer } from "./FileViewer";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";

export interface FileAttachment {
  id: string;
  name: string;
  type: "pdf" | "image";
  url: string;
  size?: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  files?: FileAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

// Dummy WebSocket URL - replace with your actual WebSocket server URL
const WEBSOCKET_URL = 'wss://echo.websocket.org';

export const ChatLayout = () => {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);

  const { isConnected, isReconnecting, sendMessage: wssSendMessage, subscribe } = useWebSocket(WEBSOCKET_URL);

  // Subscribe to WebSocket messages
  useEffect(() => {
    subscribe((data) => {
      switch (data.type) {
        case 'typing':
          setIsTyping(data.payload.isTyping);
          break;
        
        case 'message':
          const { content, files, timestamp } = data.payload;
          
          if (!currentConversation) return;

          const aiMessage: Message = {
            id: Date.now().toString(),
            content,
            role: "assistant",
            timestamp: new Date(timestamp),
            files: files?.map((file: any) => ({
              id: file.id,
              name: file.name,
              type: file.type,
              url: file.url,
              size: file.size
            }))
          };

          const updatedConversation = {
            ...currentConversation,
            messages: [...currentConversation.messages, aiMessage]
          };

          setCurrentConversation(updatedConversation);
          setIsTyping(false);

          // Update conversations list
          setConversations(prev => {
            const exists = prev.find(conv => conv.id === updatedConversation.id);
            if (!exists) {
              return [updatedConversation, ...prev];
            }
            return prev.map(conv => 
              conv.id === updatedConversation.id ? updatedConversation : conv
            );
          });
          break;
      }
    });
  }, [currentConversation, subscribe]);

  // Show connection status
  useEffect(() => {
    if (isReconnecting) {
      toast({
        title: "Reconnecting to server...",
        duration: 2000,
      });
    } else if (isConnected) {
      toast({
        title: "Connected to server",
        duration: 2000,
      });
    }
  }, [isConnected, isReconnecting, toast]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    setSidebarOpen(true);
  };

  const sendMessage = async (content: string) => {
    if (!isConnected) {
      toast({
        title: "Not connected to server",
        description: "Please wait while we reconnect...",
        variant: "destructive",
      });
      return;
    }

    let conversationToUpdate = currentConversation;

    // If no current conversation, create one but don't add to sidebar yet
    if (!conversationToUpdate) {
      conversationToUpdate = {
        id: Date.now().toString(),
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        messages: [],
        createdAt: new Date()
      };
      setCurrentConversation(conversationToUpdate);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date()
    };

    // Update current conversation with user message
    const updatedConversation = {
      ...conversationToUpdate,
      messages: [...conversationToUpdate.messages, userMessage]
    };

    setCurrentConversation(updatedConversation);
    
    // Send message through WebSocket
    const sent = wssSendMessage(content);
    if (!sent) {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
      return;
    }

    // Show typing indicator
    setIsTyping(true);
  };

  const hasMessages = currentConversation && currentConversation.messages.length > 0;

  const handleFileClick = (files: FileAttachment[]) => {
    setSelectedFiles(files);
    setFileViewerOpen(true);
  };

  return (
    <div className="h-screen bg-gradient-chat flex flex-col overflow-hidden">
      <TopNavigation 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={createNewConversation}
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={setCurrentConversation}
          onNewChat={createNewConversation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <div className="flex-1 flex flex-col relative">
          {hasMessages || isTyping ? (
            <ChatWindow 
              conversation={currentConversation}
              isTyping={isTyping}
              onFileClick={handleFileClick}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md animate-fade-in">
                <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3">
                  Welcome to AI Chat
                </h1>
                <p className="text-text-secondary text-lg">
                  Start a conversation with AI. Ask questions, get help, or just chat.
                </p>
              </div>
            </div>
          )}
          
          <MessageInput 
            onSendMessage={sendMessage}
            disabled={isTyping}
          />
        </div>
        
        <FileViewer
          files={selectedFiles}
          isOpen={fileViewerOpen}
          onClose={() => setFileViewerOpen(false)}
        />
      </div>
    </div>
  );
};