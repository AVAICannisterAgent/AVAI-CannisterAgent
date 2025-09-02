import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const MessageInput = ({ onSendMessage, disabled = false }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
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
    <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <div className={cn(
          "relative flex items-end gap-3 p-3 rounded-2xl border transition-all duration-200",
          "bg-surface border-border hover:border-border-hover focus-within:border-primary/50",
          "shadow-sm hover:shadow-md focus-within:shadow-lg"
        )}>
          {/* Attachment button */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-surface-hover transition-fast flex-shrink-0"
            disabled={disabled}
          >
            <Paperclip className="w-4 h-4" />
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
            placeholder={disabled ? "AVAI is diagnosing... 🩺" : "Ask AVAI anything about blockchain, audits, or Web3... 💬"}
            disabled={disabled}
            className={cn(
              "flex-1 min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent",
              "focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-custom",
              "placeholder:text-muted-foreground text-sm leading-relaxed p-0"
            )}
            rows={1}
          />

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Voice input button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-surface-hover transition-fast"
              disabled={disabled}
            >
              <Mic className="w-4 h-4" />
            </Button>

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              className={cn(
                "p-2 h-auto transition-all duration-200",
                message.trim() && !disabled
                  ? "bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-md hover:shadow-lg"
                  : "bg-muted hover:bg-muted text-muted-foreground"
              )}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          <span>Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};