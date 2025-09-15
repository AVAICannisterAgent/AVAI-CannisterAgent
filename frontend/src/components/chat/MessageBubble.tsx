import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Copy, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import type { FileAttachment, Message } from "./ChatLayout";
import { FileCard } from "./FileCard";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  onFileClick: (files: FileAttachment[]) => void;
  hideAnalysisContent?: boolean; // Add prop to hide analysis content when StreamingAnalysisDisplay is active
}





export const MessageBubble = ({ message, isLast, onFileClick, hideAnalysisContent = false }: MessageBubbleProps) => {
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isUser = message.role === "user";

  return (
    <div className={cn(
      "flex gap-4 py-6 px-4 hover:bg-surface/30 transition-colors group",
      isUser ? "bg-surface/10" : "bg-background"
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            U
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-2.9773c-.1969-.4615-.4859-.8746-.8497-1.2126a5.7453 5.7453 0 0 0-1.2126-.8497 5.9847 5.9847 0 0 0-2.9773-.5157H6.2181a5.9847 5.9847 0 0 0-2.9773.5157c-.4615.1969-.8746.4859-1.2126.8497a5.7453 5.7453 0 0 0-.8497 1.2126 5.9847 5.9847 0 0 0-.5157 2.9773v8.9578c0 1.0418.4242 1.9817 1.1061 2.6636.6819.6819 1.6218 1.1061 2.6636 1.1061h8.9578c1.0418 0 1.9817-.4242 2.6636-1.1061.6819-.6819 1.1061-1.6218 1.1061-2.6636z" />
            </svg>
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="prose prose-invert max-w-none">
          <div className="text-foreground text-[15px] leading-7 whitespace-pre-wrap">
            {message.content}
          </div>
        </div>

        {/* File attachments */}
        {message.files && message.files.length > 0 && (
          <div className="mt-4 space-y-2">
            {message.files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onClick={() => onFileClick([file])}
              />
            ))}
          </div>
        )}

        {/* Action buttons for AI messages */}
        {!isUser && isLast && (
          <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs hover:bg-surface-hover rounded-md flex items-center gap-1"
              onClick={() => copyToClipboard(message.content)}
            >
              <Copy className="w-3 h-3" />
              Copy
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs hover:bg-surface-hover rounded-md flex items-center gap-1"
              onClick={() => {
                toast({
                  title: "Regenerating response...",
                  description: "This feature will be implemented soon",
                  duration: 2000,
                });
              }}
            >
              <RotateCcw className="w-3 h-3" />
              Regenerate
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-success/20 hover:text-success rounded-md"
              onClick={() => {
                toast({
                  title: "Thanks for your feedback!",
                  duration: 2000,
                });
              }}
            >
              <ThumbsUp className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive rounded-md"
              onClick={() => {
                toast({
                  title: "Thanks for your feedback!",
                  duration: 2000,
                });
              }}
            >
              <ThumbsDown className="w-3 h-3" />
            </Button>

            <span className="text-xs text-muted-foreground ml-2">
              {formatTime(message.timestamp)}
            </span>
          </div>
        )}

        {/* Timestamp for user messages */}
        {isUser && (
          <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};