import { useEffect, useRef, useState } from 'react';
import WebSocketService from '../../services/WebSocketService';
import { ChatWindow } from './ChatWindow';
import { FileViewer } from './FileViewer';
import { MessageInput } from './MessageInput';
import { PdfViewer } from './PdfViewer';
import { Sidebar } from './Sidebar';
import { StreamingAnalysisDisplay } from './StreamingAnalysisDisplay';
import { TopNavigation } from './TopNavigation';

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
  // Processing status state
  const [processingStatus, setProcessingStatus] = useState<{
    isProcessing: boolean;
    currentStep: string;
    progress: number;
    details: string;
  }>({
    isProcessing: false,
    currentStep: '',
    progress: 0,
    details: ''
  });

  // Track processed message IDs to prevent duplicates
  const processedMessageIds = useRef<Set<string>>(new Set());

  const waitingStartRef = useRef<number | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  // Helper functions for conversation management
  const addMessage = (messageData: Omit<Message, 'id'>) => {
    console.log('📝 addMessage called with:', messageData.role, messageData.content.slice(0, 50) + '...');
    console.log('🔍 Current conversation before adding:', !!currentConversationRef.current, 'ID:', currentConversationRef.current?.id);

    const newMessage: Message = {
      ...messageData,
      id: Date.now().toString()
    };

    if (currentConversationRef.current) {
      console.log('✅ Adding to existing conversation');
      const updatedConversation = {
        ...currentConversationRef.current,
        messages: [...currentConversationRef.current.messages, newMessage]
      };
      setCurrentConversation(updatedConversation);
      setConversations(prev =>
        prev.map(conv => conv.id === updatedConversation.id ? updatedConversation : conv)
      );
      console.log('✅ Conversation updated, new message count:', updatedConversation.messages.length);
    } else {
      // Create new conversation if none exists
      console.log('🆕 Creating new conversation for message');
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: messageData.content.slice(0, 50) + '...',
        messages: [newMessage],
        createdAt: new Date()
      };
      setCurrentConversation(newConversation);
      setConversations(prev => [newConversation, ...prev]);
      console.log('✅ New conversation created with message, ID:', newConversation.id);
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

  // Cleanup effect to ensure states are properly cleared
  useEffect(() => {
    // Clear stale processing states on component mount
    const cleanup = () => {
      setIsTyping(false);
      waitingStartRef.current = null;
      setWaitingTime(0);
      setProcessingStatus({
        isProcessing: false,
        currentStep: '',
        progress: 0,
        details: ''
      });
      // Clear processed message IDs
      processedMessageIds.current.clear();
    };

    // Initial cleanup
    cleanup();

    // Cleanup on unmount
    return cleanup;
  }, []);

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

  // Create refs to access current state in callbacks
  const currentConversationRef = useRef(currentConversation);
  const conversationsRef = useRef(conversations);

  // Update refs when state changes
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // WebSocket connection effect
  useEffect(() => {
    console.log('🔗 ChatLayout WebSocket useEffect mounted');
    console.log('🔧 WebSocket Service Initial State:', {
      isConnected: webSocketService.getIsConnected(),
      clientId: webSocketService.getClientId(),
      connectionState: webSocketService.connectionState
    });

    const handleConnectionChange = () => {
      console.log('🔄 Connection state changed:', {
        isConnected: webSocketService.getIsConnected(),
        isReconnecting: webSocketService.getIsReconnecting()
      });
      setConnectionStatus({
        isConnected: webSocketService.getIsConnected(),
        isReconnecting: webSocketService.getIsReconnecting(),
        lastHeartbeat: webSocketService.getLastHeartbeat() || new Date()
      });
    };

    const handleMessage = (message: any) => {
      console.log('📩 Received message:', message);
      console.log('🔍 Current conversation from ref:', !!currentConversationRef.current, 'ID:', currentConversationRef.current?.id);

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

        case 'ai_response':
          // Handle AI responses from the WebSocket server
          console.log('🤖 Processing ai_response:', message);
          console.log('🔍 Current conversation state from ref:', !!currentConversationRef.current, 'messages:', currentConversationRef.current?.messages?.length || 0);

          // Check for duplicate messages
          const messageId = message.payload?.id || message.timestamp || Date.now().toString();
          if (processedMessageIds.current.has(messageId)) {
            console.log('🔄 Skipping duplicate message:', messageId);
            break;
          }
          processedMessageIds.current.add(messageId);

          if (message.payload && message.payload.response) {
            const newMessage: Omit<Message, 'id'> = {
              content: message.payload.response,
              role: 'assistant',
              timestamp: new Date(),
              files: message.payload.files || []
            };

            console.log('📝 Adding AI message to conversation:', newMessage.content.slice(0, 50) + '...');
            addMessage(newMessage);
            console.log('✅ AI response added to conversation');
            console.log('🔍 Updated conversation:', currentConversationRef.current?.messages?.length || 0, 'messages');
          } else {
            console.error('❌ AI response missing payload or response content:', message);
          }
          // Clear all processing states when response is complete
          console.log('🧹 Clearing all processing states after AI response');
          setIsTyping(false);
          waitingStartRef.current = null;
          setWaitingTime(0);
          setProcessingStatus({
            isProcessing: false,
            currentStep: '',
            progress: 0,
            details: ''
          });
          break;

        case 'error':
          console.error('WebSocket error:', message.message);
          break;

        case 'analysis_start':
          console.log('🚀 Analysis started:', message.analysis_id);
          setShowAnalysisDisplay(true);
          setIsAnalyzing(true);
          setIsTyping(true);
          waitingStartRef.current = Date.now();
          break;

        case 'analysis_complete':
          console.log('✅ Analysis complete:', message);
          setIsAnalyzing(false);
          setIsTyping(false);
          waitingStartRef.current = null;
          setWaitingTime(0);

          // Use the complete dynamic analysis result from the WebSocket
          if (message.result) {
            const result = message.result;

            // Use the pre-formatted analysis content from the server
            let responseContent = result.content || result.result || '';

            // If no pre-formatted content, build it from components (fallback)
            if (!responseContent) {
              responseContent = `🎯 **Analysis Complete**\n\n`;
              const typeDisplay = result.analysis_type ? result.analysis_type.replace('_', ' ').toUpperCase() : 'ANALYSIS';
              const complexityDisplay = result.prompt_complexity || 'STANDARD';
              const wordCountDisplay = result.word_count || '-';

              responseContent += `**${typeDisplay}** | Complexity: ${complexityDisplay} | Words: ${wordCountDisplay}\n\n`;

              if (result.insights && result.insights.length > 0) {
                responseContent += `**Key Insights:**\n`;
                result.insights.forEach((insight, index) => {
                  responseContent += `• ${insight}\n`;
                });
              }

              if (result.score !== undefined) {
                responseContent += `\n**Security Score:** ${result.score}/100\n`;
              }

              if (result.status) {
                responseContent += `\n**Status:** ${result.status}\n`;
              }

              if (result.recommendations && result.recommendations.length > 0) {
                responseContent += `\n**Recommendations:**\n`;
                result.recommendations.forEach((rec, index) => {
                  responseContent += `${index + 1}. ${rec}\n`;
                });
              }

              if (result.summary) {
                responseContent += `\n**Summary:**\n${result.summary}\n`;
              }
            }

            console.log('📋 Using analysis content:', responseContent.substring(0, 200) + '...');

            const analysisMessage: Omit<Message, 'id'> = {
              content: responseContent,
              role: 'assistant',
              timestamp: new Date(),
              files: []
            };

            addMessage(analysisMessage);
          } else {
            // Fallback if no result data - show the raw message
            const analysisMessage: Omit<Message, 'id'> = {
              content: `Analysis completed!\n\n${JSON.stringify(message, null, 2)}`,
              role: 'assistant',
              timestamp: new Date(),
              files: []
            };

            addMessage(analysisMessage);
          }

          if (message.pdfUrl) {
            handlePdfGenerated(message.pdfUrl);
          }
          break; case 'log':
          // Handle real-time analysis logs
          if (message.level && message.message) {
            console.log(`📋 [${message.level.toUpperCase()}] ${message.message}`);

            // For important logs, show them as processing status
            if (message.level === 'info' || message.level === 'warning' || message.level === 'success') {
              setProcessingStatus({
                isProcessing: true,
                currentStep: message.message,
                progress: 0,
                details: `${message.level.toUpperCase()} - Real-time analysis`
              });
            }
          }
          break;

        case 'connection':
          console.log('🔗 Connection status:', message.message);
          break;

        case 'queue_cleared':
          // Handle fresh start - clear current state
          setShowAnalysisDisplay(false);
          setIsAnalyzing(false);
          setIsTyping(false);
          waitingStartRef.current = null;
          setWaitingTime(0);
          setProcessingStatus({
            isProcessing: false,
            currentStep: '',
            progress: 0,
            details: ''
          });
          break;

        case 'processing_status':
          // Handle real-time processing status updates
          console.log('🔄 Processing status update:', message.payload);
          if (message.payload) {
            setProcessingStatus({
              isProcessing: true,
              currentStep: message.payload.step || '',
              progress: message.payload.progress || 0,
              details: message.payload.details || ''
            });
            // Show processing indicator when status updates start coming
            if (!isTyping) {
              setIsTyping(true);
              waitingStartRef.current = Date.now();
            }
          }
          break;

        case 'stored_logs':
          // Handle stored logs from enhanced AVAI orchestrator
          console.log('📋 Stored logs received:', message.payload?.length || 0, 'entries');
          // These are historical logs, can be used for debugging or analysis history
          break;

        case 'heartbeat':
          // Handle heartbeat messages from enhanced AVAI orchestrator
          console.log('💓 Heartbeat received - Server healthy with', message.clients, 'clients');
          // Update connection status or server health indicators if needed
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
    // Clear processed message IDs for new conversation
    processedMessageIds.current.clear();
    return newConv;
  };

  return (
    <div className="streamlined-chat-layout">
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
      <div className="streamlined-main-content">
        {/* Top Navigation */}
        <div className="flex-shrink-0">
          <TopNavigation
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onNewChat={handleNewConversation}
            sidebarOpen={sidebarOpen}
            isConnected={connectionStatus.isConnected}
          />
        </div>

        {/* Chat Area - STREAMLINED */}
        <div className="streamlined-chat-area">
          <ChatWindow
            conversation={currentConversation}
            isTyping={isTyping}
            onFileClick={(files) => handleFileClick(files)}
            isAnalyzing={showAnalysisDisplay}
            analysisDisplay={showAnalysisDisplay ? (
              <StreamingAnalysisDisplay
                repositoryUrl={currentRepositoryUrl}
                isAnalyzing={isAnalyzing}
                onAnalysisComplete={handleAnalysisComplete}
                onPdfClick={handlePdfClick}
              />
            ) : undefined}
          />

          {/* Message Input - STREAMLINED */}
          <div className="streamlined-input-container">
            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={!connectionStatus.isConnected}
              processingStatus={processingStatus}
            />
          </div>
        </div>
      </div>

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