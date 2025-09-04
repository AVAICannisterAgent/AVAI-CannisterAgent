import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, isTyping, isAnalyzing]);

  if (!conversation) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <ScrollArea ref={scrollAreaRef} className="flex-1 scrollbar-custom">
        <div className="p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {conversation.messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLast={index === conversation.messages.length - 1}
                onFileClick={onFileClick}
              />
            ))}
            
            {isTyping && (
              <div className="animate-fade-in">
                <TypingIndicator />
              </div>
            )}

            {isAnalyzing && analysisDisplay && (
              <div className="animate-fade-in">
                {analysisDisplay}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};