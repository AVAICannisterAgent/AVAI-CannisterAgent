import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  processingStatus?: {
    isProcessing: boolean;
    currentStep: string;
    progress: number;
    details: string;
  };
}

export const MessageInput = ({ onSendMessage, disabled = false, processingStatus }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  console.log('📝 MessageInput render:', { disabled, hasOnSendMessage: !!onSendMessage, processingStatus });

  // Create dynamic placeholder based on processing status
  const getPlaceholder = () => {
    if (processingStatus?.isProcessing) {
      const progressText = processingStatus.progress > 0 ? ` (${processingStatus.progress}%)` : '';
      return `🔄 ${processingStatus.currentStep}${progressText} - ${processingStatus.details}`;
    }
    if (disabled) {
      return "AVAI is analyzing your request... 🩺 (Priority queue active)";
    }
    return "Ask AVAI anything about blockchain, audits, or Web3... 💬";
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      console.log('📝 Sending message from MessageInput:', {
        length: trimmedMessage.length,
        disabled: disabled
      });
      
      onSendMessage(trimmedMessage);
      setMessage("");
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  return (
    <div className="message-input-container p-3 sm:p-4 bg-background/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <div className={cn(
          "relative flex items-end gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all duration-200",
          "bg-surface border-border hover:border-border-hover focus-within:border-primary/50",
          "shadow-sm hover:shadow-md focus-within:shadow-lg"
        )}>
          {/* Attachment button */}
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 sm:p-2 hover:bg-surface-hover transition-fast flex-shrink-0"
            disabled={disabled}
          >
            <Paperclip className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>

          {/* Message textarea */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className={cn(
              "flex-1 min-h-[32px] sm:min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent",
              "focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-custom",
              "placeholder:text-muted-foreground text-xs sm:text-sm leading-relaxed p-0"
            )}
            rows={1}
          />

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Voice input button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 sm:p-2 hover:bg-surface-hover transition-fast"
              disabled={disabled}
            >
              <Mic className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              className={cn(
                "p-1.5 sm:p-2 h-auto transition-all duration-200",
                message.trim() && !disabled
                  ? "bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-md hover:shadow-lg"
                  : "bg-muted hover:bg-muted text-muted-foreground"
              )}
            >
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Processing status indicator with progress bar */}
        {processingStatus?.isProcessing && (
          <div className="mt-2 p-2 bg-surface border border-border rounded-lg">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{processingStatus.currentStep}</span>
              <span>{processingStatus.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-gradient-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${processingStatus.progress}%` }}
              />
            </div>
            {processingStatus.details && (
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {processingStatus.details}
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
          <span className="sm:hidden">Enter to send</span>
        </div>
      </div>
    </div>
  );
};