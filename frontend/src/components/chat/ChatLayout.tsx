import { useState, useEffect, useRef } from "react";
import { TopNavigation } from "./TopNavigation";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { MessageInput } from "./MessageInput";
import { FileViewer } from "./FileViewer";
import { PdfViewer } from "./PdfViewer";
import { WelcomeScreen } from "./WelcomeScreen";
import { StreamingAnalysisDisplay } from "./StreamingAnalysisDisplay";
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

// Production WebSocket URL - Docker backend via Cloudflare tunnel
const WEBSOCKET_URL = 'wss://websocket.avai.life/ws';

// Environment detection for Docker backend integration
const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
const isDevelopment = typeof window !== 'undefined' && (
  window.location.hostname.includes('localhost') || 
  window.location.hostname.includes('127.0.0.1')
);

export const ChatLayout = () => {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisDisplay, setShowAnalysisDisplay] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string>("");
  const [currentRepositoryUrl, setCurrentRepositoryUrl] = useState<string>("");
  const [latestWebSocketMessage, setLatestWebSocketMessage] = useState<any>(null);
  
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

  // WebSocket management with Docker backend integration
  const {
    isConnected,
    isReconnecting,
    sendMessage: wssSendMessage,
    clientId
  } = useWebSocketManager({
    url: `${WEBSOCKET_URL}?type=dashboard&client_id=avai_frontend_${Date.now()}`,
    onMessage: (data) => {
      console.log('📨 ChatLayout received WebSocket message:', data);
      
      // Store the latest WebSocket message for StreamingAnalysisDisplay
      setLatestWebSocketMessage(data);
      
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
          
          // Reset analysis display for new prompt
          setShowAnalysisDisplay(false);
          setIsAnalyzing(false);
          
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
        
        case 'log_update':
        case 'log_message':
          // Log messages indicate analysis has started
          if (!showAnalysisDisplay && !isAnalyzing) {
            console.log('🎯 Analysis started - enabling live display');
            setShowAnalysisDisplay(true);
            setIsAnalyzing(true);
          }
          break;
          
        case 'audit_progress':
          // Progress updates indicate analysis is active
          if (!showAnalysisDisplay && !isAnalyzing) {
            console.log('📊 Analysis progress detected - enabling live display');
            setShowAnalysisDisplay(true);
            setIsAnalyzing(true);
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
        // Check if this is a file-based analysis request
        if (message.startsWith('FETCH_ANALYSIS_FROM_FILE:')) {
          const fileName = message.replace('FETCH_ANALYSIS_FROM_FILE:', '');
          handleFileBasedAnalysis(fileName);
        } else {
          sendMessage(message);
        }
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

    // Extract GitHub URL if present for repository analysis
    const githubUrlMatch = trimmedContent.match(/https:\/\/github\.com\/[^\s]+/);
    if (githubUrlMatch) {
      setCurrentRepositoryUrl(githubUrlMatch[0]);
    }

    // Reset analysis state for new prompt
    setShowAnalysisDisplay(false);
    setIsAnalyzing(false);
    setPdfViewerOpen(false);
    setSelectedPdfUrl("");

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

  const handleFileBasedAnalysis = async (fileName: string) => {
    // Store the repository URL for the analysis
    setCurrentRepositoryUrl(fileName);
    
    // Add user message for analysis request
    addMessage({
      content: `🔍 Analyzing repository: ${fileName}`,
      role: "user",
      timestamp: new Date()
    });

    // Start streaming analysis
    setIsAnalyzing(true);
    setShowAnalysisDisplay(true);
    
    toast({
      title: "Starting Analysis",
      description: "🩺 AVAI is beginning comprehensive repository scan...",
      duration: 3000,
    });
  };

  const handleAnalysisComplete = (report: string) => {
    // Don't add the report as a chat message since it's already shown in StreamingAnalysisDisplay
    // addMessage({
    //   content: report,
    //   role: "assistant",
    //   timestamp: new Date()
    // });
    
    // Don't set isAnalyzing to false immediately - let the display component handle it
    // setIsAnalyzing(false);
    
    toast({
      title: "Analysis Complete",
      description: "📊 Security audit report ready!",
      duration: 3000,
    });
  };

  const handleFileClick = (files: FileAttachment[]) => {
    setSelectedFiles(files);
    setFileViewerOpen(true);
  };

  const createNewConversationWithReset = () => {
    setShowAnalysisDisplay(false);
    setIsAnalyzing(false);
    createNewConversation();
  };

  const handlePdfClick = (pdfUrl: string) => {
    console.log("handlePdfClick called with:", pdfUrl);
    setSelectedPdfUrl(pdfUrl);
    setPdfViewerOpen(true);
    console.log("PDF viewer should now be open");
  };

  return (
    <div className="h-screen bg-gradient-chat flex flex-col overflow-hidden">
      <TopNavigation 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={createNewConversationWithReset}
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
          onNewChat={createNewConversationWithReset}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <div className="flex-1 flex flex-col relative min-h-0">
          {hasMessages || isTyping || showAnalysisDisplay ? (
            <div className="flex-1 flex flex-col min-h-0">
              <ChatWindow 
                conversation={currentConversation}
                isTyping={isTyping}
                onFileClick={handleFileClick}
                isAnalyzing={isAnalyzing}
                analysisDisplay={
                  showAnalysisDisplay ? (
                    <StreamingAnalysisDisplay 
                      repositoryUrl={currentRepositoryUrl}
                      isAnalyzing={isAnalyzing}
                      onAnalysisComplete={() => handleAnalysisComplete('')}
                      onPdfClick={() => handlePdfClick('security_audit_report.pdf')}
                      webSocketData={latestWebSocketMessage}
                    />
                  ) : undefined
                }
              />
            </div>
          ) : (
            <WelcomeScreen />
          )}
          
          <MessageInput 
            onSendMessage={sendMessage}
            disabled={isTyping || isAnalyzing}
          />
        </div>
        
        <FileViewer
          files={selectedFiles}
          isOpen={fileViewerOpen}
          onClose={() => setFileViewerOpen(false)}
        />
        
        <PdfViewer
          pdfUrl={selectedPdfUrl}
          isOpen={pdfViewerOpen}
          onClose={() => setPdfViewerOpen(false)}
        />
      </div>
    </div>
  );
};