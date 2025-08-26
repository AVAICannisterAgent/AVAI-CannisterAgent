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
          console.log('📤 Message queued for processing');
          setIsTyping(true);
          waitingStartRef.current = new Date();
          setWaitingTime(0);
          toast({
            title: "Message Sent",
            description: "AVAI is diagnosing your request... 🩺",
          });
          break;

        // ✅ NEW: Enhanced orchestration events for typing indicator
        case 'orchestration':
          console.log('🎯 Orchestration event received:', data.event_type);
          switch (data.event_type) {
            case 'orchestration_start':
              console.log('🚀 Analysis starting...');
              setIsTyping(true);
              waitingStartRef.current = new Date();
              setWaitingTime(0);
              toast({
                title: "AVAI Analysis Started",
                description: `🔍 ${data.data?.analysis?.intent || 'Analyzing your request'}...`,
              });
              break;
              
            case 'orchestration_progress':
              console.log(`⚡ Progress: ${data.data?.progress}% - ${data.data?.current_step}`);
              // Keep typing indicator active during progress
              if (!isTyping) {
                setIsTyping(true);
                waitingStartRef.current = new Date();
              }
              break;
              
            case 'orchestration_complete':
              console.log('✅ Analysis complete!');
              setIsTyping(false);
              waitingStartRef.current = null;
              setWaitingTime(0);
              
              // Add AI response to conversation
              if (data.data?.response) {
                addMessage({
                  content: typeof data.data.response === 'string' 
                    ? data.data.response 
                    : data.data.response.summary || 'Analysis completed',
                  role: "assistant",
                  timestamp: new Date(data.timestamp || new Date()),
                });
              }
              break;
          }
          break;
        
        case 'ai_response':
          console.log('🤖 AI Response received!');
          setIsTyping(false);
          waitingStartRef.current = null;
          setWaitingTime(0);
          
          // Check if this AI response is for this client
          if (data.client_id && data.client_id !== clientId) {
            console.log('⏭️ AI response not for this client, ignoring');
            return;
          }
          
          // Add AI message to conversation
          addMessage({
            content: data.payload?.response || 'No response received',
            role: "assistant",
            timestamp: new Date(data.timestamp || new Date()),
          });
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
    if (!isConnected) {
      toast({
        title: "Not connected to AVAI",
        description: "Please wait while we reconnect... 🔄",
        variant: "destructive",
      });
      return;
    }

    // Add user message to conversation
    addMessage({
      content,
      role: "user",
      timestamp: new Date()
    });

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
              lastHeartbeat={lastHeartbeat}
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