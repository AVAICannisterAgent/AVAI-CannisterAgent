import { useState, useEffect, useRef } from "react";
import { TopNavigation } from "./TopNavigation";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { MessageInput } from "./MessageInput";
import { FileViewer } from "./FileViewer";
import { WelcomeScreen } from "./WelcomeScreen";
import { useConversationManager } from "@/hooks/useConversationManager";
import { useWebSocketManager } from "@/hooks/useWebSocketManager";
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
  const [isTyping, setIsTyping] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  
  // Heartbeat monitoring
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | undefined>();
  const [waitingTime, setWaitingTime] = useState(0);
  const waitingStartRef = useRef<Date | null>(null);

  // Conversation management
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    createNewConversation,
    addMessage,
    hasMessages
  } = useConversationManager();

  // WebSocket management
  const {
    isConnected,
    isReconnecting,
    sendMessage: wssSendMessage,
    clientId
  } = useWebSocketManager({
    url: WEBSOCKET_URL,
    onMessage: (data) => {
      console.log('📨 ChatLayout received WebSocket message:', data);
      
      switch (data.type) {
        case 'heartbeat':
          console.log('💓 Heartbeat received');
          setLastHeartbeat(new Date());
          break;
          
        case 'chat_queued':
          console.log('📤 Message queued for processing', {
            promptId: data.promptId,
            queuePosition: data.queuePosition,
            queueCleared: data.queueCleared
          });
          setIsTyping(true);
          waitingStartRef.current = new Date();
          setWaitingTime(0);
          
          // Enhanced feedback based on queue clearing
          if (data.queueCleared) {
            toast({
              title: "Priority Request",
              description: `🧹 Previous requests cleared. AVAI is focusing on your latest prompt... 🎯`,
              duration: 3000,
            });
          } else {
            toast({
              title: "Message Sent",
              description: "AVAI is diagnosing your request... 🩺",
              duration: 3000,
            });
          }
          break;
        
        case 'ai_response':
          console.log('🤖 AI Response received!', {
            clientId: data.client_id,
            currentClientId: clientId,
            hasPayload: !!data.payload
          });
          setIsTyping(false);
          waitingStartRef.current = null;
          setWaitingTime(0);
          
          // Check if this AI response is for this client
          if (data.client_id && data.client_id !== clientId) {
            console.log('⏭️ AI response not for this client, ignoring');
            return;
          }
          
          // Add AI message to conversation
          const responseContent = data.payload?.response || data.message || 'No response received';
          addMessage({
            content: responseContent,
            role: "assistant",
            timestamp: new Date(data.timestamp || new Date()),
          });
          
          // Show success feedback
          toast({
            title: "AVAI Response",
            description: "🤖 Analysis complete!",
            duration: 2000,
          });
          break;
          
        case 'queue_cleared':
          console.log('🗑️ Queue cleared notification:', {
            clearedCount: data.cleared_count,
            reason: (data as any).reason
          });
          // Optional: Show notification for queue clearing
          // (Currently handled in chat_queued for better UX)
          break;
          
        case 'error':
          console.log('❌ WebSocket error received:', data.message);
          setIsTyping(false);
          waitingStartRef.current = null;
          setWaitingTime(0);
          toast({
            title: "Error",
            description: data.message || "An error occurred",
            variant: "destructive"
          });
          break;
      }
    }
  });

  // Update waiting time when typing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTyping && waitingStartRef.current) {
      interval = setInterval(() => {
        if (waitingStartRef.current) {
          const elapsed = Math.floor((Date.now() - waitingStartRef.current.getTime()) / 1000);
          setWaitingTime(elapsed);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTyping]);

  // Listen for custom events from WelcomeScreen
  useEffect(() => {
    const handleSendMessage = (event: CustomEvent) => {
      const { message } = event.detail;
      if (message) {
        sendMessage(message);
      }
    };

    window.addEventListener('avai-send-message', handleSendMessage as EventListener);
    
    return () => {
      window.removeEventListener('avai-send-message', handleSendMessage as EventListener);
    };
  }, [isConnected, clientId]); // Re-attach when connection changes

  // Show connection status
  useEffect(() => {
    if (isReconnecting) {
      toast({
        title: "Reconnecting to AVAI...",
        description: "🩺 Getting back online",
        duration: 2000,
      });
    } else if (isConnected) {
      toast({
        title: "Connected to AVAI",
        description: "🟢 Blockchain doctor is ready!",
        duration: 2000,
      });
    }
  }, [isConnected, isReconnecting, toast]);

  const sendMessage = async (content: string) => {
    // Validate connection
    if (!isConnected) {
      toast({
        title: "Not connected to AVAI",
        description: "Please wait while we reconnect... 🔄",
        variant: "destructive",
      });
      return;
    }

    // Validate message content
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast({
        title: "Empty message",
        description: "Please enter a message to send to AVAI",
        variant: "destructive",
      });
      return;
    }

    // Add user message to conversation immediately for better UX
    addMessage({
      content: trimmedContent,
      role: "user",
      timestamp: new Date()
    });

    // Send message through WebSocket with enhanced format
    console.log('🚀 Sending message to AVAI:', {
      length: trimmedContent.length,
      clientId: clientId,
      connected: isConnected
    });
    
    const sent = wssSendMessage(trimmedContent);
    if (!sent) {
      toast({
        title: "Failed to send message",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
      return;
    }

    // Show immediate feedback
    console.log('✅ Message sent successfully, waiting for queue response...');
  };

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
        isConnected={isConnected}
        isTyping={isTyping}
        lastHeartbeat={lastHeartbeat}
        waitingTime={waitingTime}
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
            <WelcomeScreen />
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