import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { ChatWindow } from './ChatWindow';
import { MessageInput } from './MessageInput';
import { StreamingAnalysisDisplay } from './StreamingAnalysisDisplay';
import { FileViewer } from './FileViewer';
import { PdfViewer } from './PdfViewer';
import WebSocketService from '../../services/WebSocketService';

// Get singleton instance
const webSocketService = WebSocketService.getInstance();

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

export function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string>('');
  const [showAnalysisDisplay, setShowAnalysisDisplay] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentRepositoryUrl, setCurrentRepositoryUrl] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [waitingTime, setWaitingTime] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isReconnecting: false,
    lastHeartbeat: new Date()
  });
  const waitingStartRef = useRef<number | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  // Helper functions for conversation management
  const addMessage = (messageData: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...messageData,
      id: Date.now().toString()
    };

    if (currentConversation) {
      const updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, newMessage]
      };
      setCurrentConversation(updatedConversation);
      setConversations(prev => 
        prev.map(conv => conv.id === updatedConversation.id ? updatedConversation : conv)
      );
    } else {
      // Create new conversation if none exists
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: messageData.content.slice(0, 50) + '...',
        messages: [newMessage],
        createdAt: new Date()
      };
      setCurrentConversation(newConversation);
      setConversations(prev => [newConversation, ...prev]);
    }
  };

  const createNewConversation = (title?: string) => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: title || 'New Conversation',
      messages: [],
      createdAt: new Date()
    };
    setCurrentConversation(newConversation);
    setConversations(prev => [newConversation, ...prev]);
    return newConversation;
  };

  // Initialize conversation on component mount
  useEffect(() => {
    console.log('🔍 ChatLayout mount effect - conversations:', conversations.length, 'currentConversation:', !!currentConversation);
    // Create initial conversation if none exists
    if (conversations.length === 0 && !currentConversation) {
      console.log('✨ Creating initial welcome conversation');
      const initialConversation = createNewConversation('Welcome to AVAI');
      console.log('✅ Initial conversation created:', initialConversation.id);
    }
  }, []); // Empty dependency array - only run once on mount

  // WebSocket connection effect
  useEffect(() => {
    const handleConnectionChange = () => {
      setConnectionStatus({
        isConnected: webSocketService.getIsConnected(),
        isReconnecting: webSocketService.getIsReconnecting(),
        lastHeartbeat: webSocketService.getLastHeartbeat() || new Date()
      });
    };

    const handleMessage = (message: any) => {
      console.log('📩 Received message:', message);

      switch (message.type) {
        case 'typing_start':
          if (message.clientId !== webSocketService.getClientId()) {
            setIsTyping(true);
            waitingStartRef.current = Date.now();
            setWaitingTime(0);
          }
          break;

        case 'typing_stop':
          if (message.clientId !== webSocketService.getClientId()) {
            setIsTyping(false);
            waitingStartRef.current = null;
            setWaitingTime(0);
          }
          break;

        case 'message':
          if (message.content && message.role === 'assistant') {
            const newMessage: Omit<Message, 'id'> = {
              content: message.content,
              role: 'assistant',
              timestamp: new Date(),
              files: message.files
            };
            addMessage(newMessage);
          }
          setIsTyping(false);
          waitingStartRef.current = null;
          setWaitingTime(0);
          break;

        case 'error':
          console.error('WebSocket error:', message.message);
          break;

        case 'analysis_start':
          setShowAnalysisDisplay(true);
          setIsAnalyzing(true);
          break;

        case 'analysis_complete':
          setIsAnalyzing(false);
          if (message.pdfUrl) {
            handlePdfGenerated(message.pdfUrl);
          }
          break;

        case 'queue_cleared':
          // Handle fresh start - clear current state
          setShowAnalysisDisplay(false);
          setIsAnalyzing(false);
          setIsTyping(false);
          waitingStartRef.current = null;
          setWaitingTime(0);
          break;

        default:
          console.log('🔄 Unhandled message type:', message.type);
      }
    };

    // Subscribe to WebSocket events
    console.log('🔗 Setting up WebSocket subscriptions...');
    const connectionSub = webSocketService.subscribe(handleConnectionChange, (msg) => msg.type === 'connected' || msg.type === 'error');
    const messageSub = webSocketService.subscribe(handleMessage);

    // Initialize connection with debug logging
    console.log('🚀 Initiating WebSocket connection...');
    console.log('🔧 WebSocket Service Info:', webSocketService.connectionInfo);
    webSocketService.connect()
      .then(() => {
        console.log('✅ WebSocket connection established successfully');
        handleConnectionChange();
      })
      .catch((error) => {
        console.error('❌ WebSocket connection failed:', error);
        handleConnectionChange();
      });

    return () => {
      webSocketService.unsubscribe(connectionSub);
      webSocketService.unsubscribe(messageSub);
    };
  }, []);

  // Waiting time counter effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTyping && waitingStartRef.current) {
      interval = setInterval(() => {
        if (waitingStartRef.current) {
          const elapsed = Math.floor((Date.now() - waitingStartRef.current) / 1000);
          setWaitingTime(elapsed);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTyping]);

  // GitHub URL extraction from message content
  const extractGitHubUrl = (content: string): string | null => {
    const githubUrlPattern = /https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+/g;
    const match = content.match(githubUrlPattern);
    return match ? match[0] : null;
  };

  const handleSendMessage = async (content: string, files?: FileAttachment[]) => {
    console.log('📤 Attempting to send message:', content.slice(0, 50) + '...');
    console.log('🔗 Connection status before send:', {
      isConnected: connectionStatus.isConnected,
      webSocketServiceConnected: webSocketService.getIsConnected(),
      clientId: webSocketService.getClientId()
    });

    if (!connectionStatus.isConnected) {
      console.error('❌ WebSocket not connected, cannot send message');
      return;
    }

    // Clear previous analysis state for fresh start
    setCurrentRepositoryUrl('');
    setShowAnalysisDisplay(false);
    setIsAnalyzing(false);
    setPdfViewerOpen(false);
    setSelectedPdfUrl('');

    // Add user message to conversation
    const userMessage: Omit<Message, 'id'> = {
      content,
      role: 'user',
      timestamp: new Date(),
      files
    };
    console.log('📝 Adding user message to conversation');
    addMessage(userMessage);

    // Check for GitHub URL and handle analysis
    const githubUrl = extractGitHubUrl(content);
    if (githubUrl) {
      console.log('🔍 GitHub URL detected, starting analysis:', githubUrl);
      setCurrentRepositoryUrl(githubUrl);
      setIsAnalyzing(true);
      setShowAnalysisDisplay(true);
    }

    // Send message via WebSocket
    try {
      console.log('📡 Sending message via WebSocket service...');
      const success = webSocketService.sendChatMessage(content);
      console.log('📡 WebSocket send result:', success);
      
      if (!success) {
        console.error('❌ Failed to send message via WebSocket');
      }
    } catch (error) {
      console.error('❌ Send message error:', error);
    }
  };

  const handleFileClick = (files: FileAttachment[]) => {
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'pdf') {
        setSelectedPdfUrl(file.url);
        setPdfViewerOpen(true);
      } else {
        setSelectedFiles(files);
        setFileViewerOpen(true);
      }
    }
  };

  const handleAnalysisClose = () => {
    setShowAnalysisDisplay(false);
    setIsAnalyzing(false);
    createNewConversation('Analysis Complete');
  };

  const handleAnalysisComplete = () => {
    setIsAnalyzing(false);
  };

  const handlePdfClick = () => {
    console.log('PDF clicked');
  };

  const handlePdfGenerated = (pdfUrl: string) => {
    setSelectedPdfUrl(pdfUrl);
    setPdfViewerOpen(true);
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setSidebarOpen(false);
  };

  const handleNewConversation = () => {
    const newConv = createNewConversation();
    setCurrentConversation(newConv);
    setSidebarOpen(false);
    return newConv;
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onSelectConversation={handleConversationSelect}
        onNewChat={handleNewConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <div className="flex-shrink-0">
          <TopNavigation
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onNewChat={handleNewConversation}
            sidebarOpen={sidebarOpen}
            isConnected={connectionStatus.isConnected}
          />
        </div>

        {/* Chat Area - This should take remaining space */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0">
            <ChatWindow
              conversation={currentConversation}
              isTyping={isTyping}
              onFileClick={(files) => handleFileClick(files)}
              isAnalyzing={showAnalysisDisplay}
            />
          </div>

          {/* Message Input - Fixed at bottom */}
          <div className="flex-shrink-0">
            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={!connectionStatus.isConnected}
            />
          </div>
        </div>
      </div>

      {showAnalysisDisplay && (
        <StreamingAnalysisDisplay
          repositoryUrl={currentRepositoryUrl}
          isAnalyzing={isAnalyzing}
          onAnalysisComplete={handleAnalysisComplete}
          onPdfClick={handlePdfClick}
        />
      )}

      {fileViewerOpen && selectedFiles.length > 0 && (
        <FileViewer
          files={selectedFiles}
          isOpen={fileViewerOpen}
          onClose={() => setFileViewerOpen(false)}
        />
      )}

      {pdfViewerOpen && selectedPdfUrl && (
        <PdfViewer
          pdfUrl={selectedPdfUrl}
          isOpen={pdfViewerOpen}
          onClose={() => setPdfViewerOpen(false)}
        />
      )}
    </div>
  );
}

export default ChatLayout;