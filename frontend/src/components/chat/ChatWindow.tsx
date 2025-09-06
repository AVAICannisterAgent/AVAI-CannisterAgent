import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { Conversation, FileAttachment } from "./ChatLayout";

interface ChatWindowProps {
  conversation: Conversation | null;
  isTyping: boolean;
  onFileClick: (files: FileAttachment[]) => void;
  isAnalyzing?: boolean;
  analysisDisplay?: React.ReactNode;
}

export const ChatWindow = ({ conversation, isTyping, onFileClick, isAnalyzing, analysisDisplay }: ChatWindowProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  console.log('🔍 ChatWindow render - conversation:', !!conversation, 'messages:', conversation?.messages?.length || 0);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setIsAtBottom(isNearBottom);
      setShowScrollButton(!isNearBottom && conversation && conversation.messages.length > 0);
    }
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [conversation?.messages, isTyping, isAnalyzing, isAtBottom]);

  useEffect(() => {
    const scrollElement = scrollAreaRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [conversation]);

  // Show welcome screen when no conversation exists or conversation has no messages
  if (!conversation || (conversation && conversation.messages.length === 0)) {
    console.log('📺 Showing welcome screen - conversation exists:', !!conversation, 'messages:', conversation?.messages?.length || 0);
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-background overflow-auto min-h-0">
        <div className="max-w-5xl w-full mx-auto text-center space-y-4 sm:space-y-6">
          {/* Logo and Title */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9 8a9.013 9.013 0 01-5.314-1.732l-2.829 1.414A1 1 0 012.343 18.5l1.414-2.829A9.013 9.013 0 012 12c0-4.973 4.027-9 9-9s9 4.027 9 9z" />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Welcome to AVAI 🩺
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
              Your AI-powered blockchain security auditing assistant
            </p>
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 max-w-4xl mx-auto">
            <div className="p-3 sm:p-4 rounded-lg border border-border bg-surface/50 text-left">
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base flex items-center gap-2">
                🔍 <span>Security Analysis</span>
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Analyze smart contracts and blockchain infrastructure
              </p>
            </div>
            
            <div className="p-3 sm:p-4 rounded-lg border border-border bg-surface/50 text-left">
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base flex items-center gap-2">
                📊 <span>Code Auditing</span>
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Comprehensive reports on code quality and security
              </p>
            </div>
            
            <div className="p-3 sm:p-4 rounded-lg border border-border bg-surface/50 text-left">
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base flex items-center gap-2">
                🌐 <span>Web3 Expertise</span>
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Deep knowledge of DeFi and blockchain tech
              </p>
            </div>
            
            <div className="p-3 sm:p-4 rounded-lg border border-border bg-surface/50 text-left">
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base flex items-center gap-2">
                📈 <span>Real-time Analysis</span>
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Live monitoring with detailed progress tracking
              </p>
            </div>
          </div>
          
          {/* Pro Tip */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm text-foreground text-left">
              💡 <strong>Pro tip:</strong> Start by asking about a specific smart contract, GitHub repository, or blockchain security topic. 
              You can also paste GitHub URLs for instant analysis!
            </p>
          </div>
          
          {/* Quick Start Examples */}
          <div className="mt-4 sm:mt-6">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">Try asking about:</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
              <span className="px-3 py-1 bg-surface border border-border rounded-full text-xs text-muted-foreground hover:bg-surface-hover cursor-pointer">
                Smart Contracts
              </span>
              <span className="px-3 py-1 bg-surface border border-border rounded-full text-xs text-muted-foreground hover:bg-surface-hover cursor-pointer">
                DeFi Protocols
              </span>
              <span className="px-3 py-1 bg-surface border border-border rounded-full text-xs text-muted-foreground hover:bg-surface-hover cursor-pointer">
                Security Audits
              </span>
              <span className="px-3 py-1 bg-surface border border-border rounded-full text-xs text-muted-foreground hover:bg-surface-hover cursor-pointer">
                Code Analysis
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      <ScrollArea ref={scrollAreaRef} className="flex-1 scrollbar-chat overflow-y-auto">
        <div className="p-4 pb-6 chat-content">
          <div className="max-w-4xl mx-auto message-container">
            {conversation.messages.map((message, index) => (
              <div key={message.id} className="message-bubble message-space">
                <MessageBubble
                  message={message}
                  isLast={index === conversation.messages.length - 1}
                  onFileClick={onFileClick}
                  hideAnalysisContent={isAnalyzing}
                />
              </div>
            ))}
            
            {isTyping && (
              <div className="animate-fade-in message-space">
                <TypingIndicator />
              </div>
            )}

            {isAnalyzing && analysisDisplay && (
              <div className="animate-fade-in analysis-display message-space">
                {analysisDisplay}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>
      
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            onClick={() => {
              setIsAtBottom(true);
              scrollToBottom(true);
            }}
            size="sm"
            className="rounded-full w-10 h-10 p-0 shadow-lg bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};