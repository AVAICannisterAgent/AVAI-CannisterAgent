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
import { useWebSocket } from "@/hooks/useWebSocketOptimized";
import { useToast } from "@/hooks/use-toast";
import type { WebSocketMessage } from "@/services/WebSocketService";

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

export const ChatLayout = () => {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileAttachment | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<FileAttachment | null>(null);
  const [showAnalysisDisplay, setShowAnalysisDisplay] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [waitingTime, setWaitingTime] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | undefined>();
  const [latestWebSocketMessage, setLatestWebSocketMessage] = useState<any>(null);
  
  const waitingStartRef = useRef<Date | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Conversation management
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    createNewConversation,
    addMessage,
    hasMessages
  } = useConversationManager();

  // Optimized WebSocket connection
  const {
    connectionState,
    sendChatMessage,
    subscribe,
    unsubscribe
  } = useWebSocket();

  const isConnected = connectionState === 'connected';
  const isReconnecting = connectionState === 'connecting';

  // Subscribe to WebSocket messages
  useEffect(() => {
    const subscriptionId = subscribe((data: WebSocketMessage) => {
      console.log('📨 ChatLayout received WebSocket message:', data);
      
      // Store the latest WebSocket message for StreamingAnalysisDisplay
      setLatestWebSocketMessage(data);
      
      switch (data.type) {
        case 'heartbeat':
          setLastHeartbeat(new Date());
          break;
          
        case 'chat_queued':
          console.log('📤 Message queued for processing');
          setIsTyping(true);
          waitingStartRef.current = new Date();
          setWaitingTime(0);
          setShowAnalysisDisplay(false);
          setIsAnalyzing(false);
          
          if (data.queueCleared) {
            toast({
              title: "Priority Request",
              description: "🧹 Previous requests cleared. AVAI is focusing on your latest prompt... 🎯",
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
          if (!showAnalysisDisplay && !isAnalyzing) {
            console.log('🎯 Analysis started - enabling live display');
            setShowAnalysisDisplay(true);
            setIsAnalyzing(true);
          }
          break;
          
        case 'audit_progress':
          if (!showAnalysisDisplay && !isAnalyzing) {
            console.log('📊 Analysis progress detected - enabling live display');
            setShowAnalysisDisplay(true);
            setIsAnalyzing(true);
          }
          break;
        
        case 'ai_response':
          console.log('🤖 AI Response received!');
          setIsTyping(false);
          waitingStartRef.current = null;
          setWaitingTime(0);
          
          const responseContent = data.payload?.response || data.message || 'No response received';
          addMessage({
            id: Date.now().toString(),
            content: responseContent,
            role: "assistant",
            timestamp: new Date(data.timestamp || new Date()),
          });
          
          setIsAnalyzing(false);
          setShowAnalysisDisplay(true);
          break;
        
        case 'queue_cleared':
          console.log('🗑️ Queue cleared notification');
          break;
          
        case 'error':
          console.log('❌ WebSocket error received:', data.message);
          setIsTyping(false);
          waitingStartRef.current = null;
          setWaitingTime(0);
          setIsAnalyzing(false);
          
          toast({
            title: "Oops! 🩺",
            description: "AVAI encountered an issue. Let me try again!",
            variant: "destructive"
          });
          break;
      }
    });

    return () => {
      unsubscribe(subscriptionId);
    };
  }, [subscribe, unsubscribe, toast, showAnalysisDisplay, isAnalyzing, addMessage]);

  // Waiting time tracker
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
        if (message.startsWith('FETCH_ANALYSIS_FROM_FILE:')) {
          const fileName = message.replace('FETCH_ANALYSIS_FROM_FILE:', '');
          handleFileBasedAnalysis(fileName);
        } else {
          sendMessage(message);
        }
      }
    };

    const handleAnalyzeGitHubRepo = (event: CustomEvent) => {
      const { url } = event.detail;
      if (url) {
        const message = `Please analyze this GitHub repository: ${url}`;
        sendMessage(message);
      }
    };

    window.addEventListener('sendMessage', handleSendMessage as EventListener);
    window.addEventListener('analyzeGitHubRepo', handleAnalyzeGitHubRepo as EventListener);
    
    return () => {
      window.removeEventListener('sendMessage', handleSendMessage as EventListener);
      window.removeEventListener('analyzeGitHubRepo', handleAnalyzeGitHubRepo as EventListener);
    };
  }, []);

  // Connection status toast
  useEffect(() => {
    if (isReconnecting) {
      toast({
        title: "AVAI is reconnecting... 🔄",
        description: "Restoring blockchain connection",
        duration: 2000,
      });
    } else if (isConnected) {
      toast({
        title: "AVAI is online! 🩺✨",
        description: "Ready to help with your blockchain needs",
        duration: 2000,
      });
    }
  }, [isConnected, isReconnecting, toast]);

  const sendMessage = async (content: string, files?: FileAttachment[]) => {
    if (!content.trim()) return;

    if (!isConnected) {
      toast({
        title: "Connection lost 📡",
        description: "AVAI is reconnecting to the blockchain...",
        variant: "destructive",
      });
      return;
    }

    // Add user message to conversation immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: "user",
      timestamp: new Date(),
      files: files || []
    };

    addMessage(userMessage);

    // Send message through optimized WebSocket
    const sent = sendChatMessage(content.trim());
    
    if (!sent) {
      toast({
        title: "Message failed 📤",
        description: "Let AVAI try sending that again!",
        variant: "destructive",
      });
      return;
    }

    // Auto-scroll to bottom
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleFileBasedAnalysis = (fileName: string) => {
    const message = `I've uploaded a file: ${fileName}. Please analyze its blockchain-related content and provide insights on security, architecture, and best practices.`;
    sendMessage(message);
  };

  const extractGitHubUrlFromMessage = (message: string): string | null => {
    const githubUrlRegex = /https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9._-]+/g;
    const match = message.match(githubUrlRegex);
    return match ? match[0] : null;
  };

  const openFileViewer = (file: FileAttachment) => {
    if (file.type === "pdf") {
      setSelectedPdf(file);
      setPdfViewerOpen(true);
    } else {
      setSelectedFile(file);
      setFileViewerOpen(true);
    }
  };

  const closeFileViewer = () => {
    setFileViewerOpen(false);
    setSelectedFile(null);
  };

  const closePdfViewer = () => {
    setPdfViewerOpen(false);
    setSelectedPdf(null);
  };

  const handlePdfAnalysisComplete = (pdfUrl: string) => {
    console.log('📄 PDF analysis complete for:', pdfUrl);
    // The StreamingAnalysisDisplay will handle showing the final report
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onConversationSelect={setCurrentConversation}
        onNewConversation={createNewConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col">
        <TopNavigation
          onMenuClick={() => setSidebarOpen(true)}
          isConnected={isConnected}
          isReconnecting={isReconnecting}
          lastHeartbeat={lastHeartbeat}
        />
        
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col">
            {!hasMessages ? (
              <WelcomeScreen 
                onSendMessage={sendMessage}
                isConnected={isConnected}
              />
            ) : (
              <>
                <ChatWindow
                  ref={messagesContainerRef}
                  conversation={currentConversation}
                  isTyping={isTyping}
                  waitingTime={waitingTime}
                  onFileClick={openFileViewer}
                />
                <MessageInput
                  onSendMessage={sendMessage}
                  disabled={!isConnected || isTyping}
                  placeholder={isConnected ? "Ask AVAI about blockchain development, security, or best practices..." : "Connecting..."}
                />
              </>
            )}
          </div>
          
          {showAnalysisDisplay && (
            <StreamingAnalysisDisplay
              webSocketData={latestWebSocketMessage}
              isAnalyzing={isAnalyzing}
              onClose={() => {
                setShowAnalysisDisplay(false);
                setIsAnalyzing(false);
              }}
              onPdfGenerated={handlePdfAnalysisComplete}
              githubUrl={currentConversation?.messages
                .slice()
                .reverse()
                .find(msg => msg.role === 'user' && extractGitHubUrlFromMessage(msg.content))
                ?.content ? extractGitHubUrlFromMessage(
                  currentConversation.messages
                    .slice()
                    .reverse()
                    .find(msg => msg.role === 'user' && extractGitHubUrlFromMessage(msg.content))!
                    .content
                ) : null}
            />
          )}
        </main>
      </div>

      {fileViewerOpen && selectedFile && (
        <FileViewer file={selectedFile} onClose={closeFileViewer} />
      )}

      {pdfViewerOpen && selectedPdf && (
        <PdfViewer file={selectedPdf} onClose={closePdfViewer} />
      )}
    </div>
  );
};
