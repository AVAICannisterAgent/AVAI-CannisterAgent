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

// WebSocket URL for the AVAI tunnel
const WEBSOCKET_URL = 'wss://websocket.avai.life/ws';

export const ChatLayout = () => {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);

  const { isConnected, isReconnecting, sendMessage: wssSendMessage, subscribe, clientId } = useWebSocket(WEBSOCKET_URL);

  // Subscribe to WebSocket messages
  useEffect(() => {
    console.log('🔄 Setting up WebSocket subscription...');
    console.log('🆔 Client ID for this connection:', clientId);
    
    subscribe((data) => {
      console.log('📨 ChatLayout received WebSocket message:', data);
      console.log('🏷️ Message type:', data.type);
      console.log('🔍 Message keys:', Object.keys(data));
      console.log('⏰ Message timestamp:', data.timestamp);
      console.log('🆔 Client ID from message:', data.client_id);
      console.log('🔀 Our Client ID:', clientId);
      
      switch (data.type) {
        case 'chat_queued':
          console.log('📤 Message queued for processing');
          // Show message was queued
          setIsTyping(true);
          toast({
            title: "Message Sent",
            description: "Your message has been queued for processing...",
          });
          break;
        
        case 'ai_response':
          console.log('🤖 AI Response received!');
          console.log('📄 Response payload:', data.payload);
          console.log('💬 Response text:', data.payload?.response);
          console.log('🔍 FULL AI RESPONSE DATA STRUCTURE:');
          console.log(JSON.stringify(data, null, 2));
          console.log('📊 Data properties:', Object.keys(data));
          console.log('🆔 AI Response client_id:', data.client_id);
          console.log('🔀 Our client_id:', clientId);
          
          // Check if this AI response is for this client
          if (data.client_id && data.client_id !== clientId) {
            console.log('⏭️ AI response not for this client, ignoring');
            return;
          }
          
          console.log('✅ AI response is for this client, processing...');
          setIsTyping(false);
          
          // Use functional update to get current conversation state
          setCurrentConversation(current => {
            console.log('🔍 Current conversation state:', current);
            if (!current) {
              console.log('❌ No current conversation to add response to - current is:', current);
              return current;
            }

            console.log('✅ Current conversation exists - ID:', current.id);
            console.log('📝 Current message count:', current.messages.length);

            const aiMessage: Message = {
              id: Date.now().toString(),
              content: data.payload?.response || 'No response received',
              role: "assistant",
              timestamp: new Date(data.timestamp || new Date()),
            };

            console.log('✅ Creating AI message:');
            console.log('   - ID:', aiMessage.id);
            console.log('   - Content:', aiMessage.content);
            console.log('   - Content length:', aiMessage.content.length);
            console.log('   - Role:', aiMessage.role);
            console.log('   - Timestamp:', aiMessage.timestamp);

            const updatedConversation = {
              ...current,
              messages: [...current.messages, aiMessage]
            };

            console.log('🔄 Updating conversation with AI response');
            console.log('📊 Old message count:', current.messages.length);
            console.log('📊 New message count:', updatedConversation.messages.length);

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

            return updatedConversation;
          });
          break;
          
        case 'error':
          console.log('❌ WebSocket error received:', data.message);
          setIsTyping(false);
          toast({
            title: "Error",
            description: data.message || "An error occurred",
            variant: "destructive"
          });
          break;
          
        default:
          console.log('📋 Unknown message type:', data.type);
      }
    });
  }, [subscribe, toast]); // Removed currentConversation dependency!

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