"use client"

import { Copy, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Message, FileAttachment } from "./ChatLayout";
import { FileCard } from "./FileCard";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  onFileClick: (files: FileAttachment[]) => void;
}

export const MessageBubble = ({ message, isLast, onFileClick }: MessageBubbleProps) => {
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
      "flex gap-4 group animate-fade-in",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      )}

      <div className={cn(
        "flex flex-col max-w-[80%] lg:max-w-[70%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "relative px-4 py-3 rounded-2xl shadow-sm",
          isUser 
            ? "message-user rounded-br-md" 
            : "message-ai rounded-bl-md border border-border"
        )}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
          
          {/* File attachments */}
          {message.files && message.files.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onClick={() => onFileClick([file])}
                />
              ))}
            </div>
          )}
        </div>

        <div className={cn(
          "flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-xs text-muted-foreground px-2">
            {formatTime(message.timestamp)}
          </span>

          {!isUser && isLast && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(message.content)}
                className="h-6 w-6 p-0 hover:bg-surface-hover"
              >
                <Copy className="w-3 h-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-surface-hover"
                onClick={() => {
                  toast({
                    title: "Regenerating response...",
                    description: "This feature will be implemented soon",
                    duration: 2000,
                  });
                }}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>

              <div className="w-px h-4 bg-border mx-1" />

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-success/20 hover:text-success"
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
                className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                onClick={() => {
                  toast({
                    title: "Thanks for your feedback!",
                    duration: 2000,
                  });
                }}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-sm font-medium text-primary-foreground">U</span>
        </div>
      )}
    </div>
  );
};