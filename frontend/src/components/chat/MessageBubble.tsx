import { Copy, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { Message } from '@/types/chat';
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast"

interface MessageBubbleProps {
    message: Message;
    isFirst: boolean;
}

export function MessageBubble({ message, isFirst }: MessageBubbleProps) {
    const [isHovered, setIsHovered] = useState(false);
    const { toast } = useToast();

    const handleCopy = async () => {
        await navigator.clipboard.writeText(message.content);
        toast({
            title: "Copied to clipboard",
            description: "Message copied successfully",
        });
    };

    const handleFeedback = (type: 'up' | 'down') => {
        toast({
            title: `Feedback received`,
            description: `Thank you for your ${type === 'up' ? 'positive' : 'negative'} feedback`,
        });
    };

    const handleRegenerate = () => {
        toast({
            title: "Regenerating response",
            description: "This feature will be available soon",
        });
    };

    return (
        <div
            className={`animate-message-in ${isFirst ? 'mt-8' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`
          max-w-3xl rounded-2xl px-6 py-4 shadow-soft transition-smooth
          ${message.role === 'user'
                        ? 'chat-user ml-12'
                        : 'chat-ai mr-12'
                    }
        `}>
                    {message.role === 'assistant' && (
                        <div className="flex items-center mb-3">
                            <div className="w-6 h-6 gradient-primary rounded-lg flex items-center justify-center mr-3">
                                <span className="text-black font-bold text-xs">AVAI</span>
                            </div>
                        </div>
                    )}

                    <div className="prose prose-sm max-w-none">
                        <p className={`whitespace-pre-wrap leading-relaxed ${message.role === 'user' ? 'text-chat-user-foreground' : 'text-chat-ai-foreground'
                            }`}>
                            {message.content}
                        </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <span className={`text-xs ${message.role === 'user' ? 'text-chat-user-foreground/70' : 'text-muted-foreground'
                            }`}>
                            {message.timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>

                        {message.role === 'assistant' && isHovered && (
                            <div className="flex items-center space-x-1 opacity-0 animate-fade-in">
                                <button
                                    onClick={handleCopy}
                                    className="h-7 w-7 p-0 hover:bg-chat-hover"
                                >
                                    <Copy className="h-3 w-3 color" />
                                </button>
                                <button
                                    onClick={() => handleFeedback('up')}
                                    className="h-7 w-7 p-0 hover:bg-chat-hover"
                                >
                                    <ThumbsUp className="h-3 w-3" />
                                </button>
                                <button
                                    onClick={() => handleFeedback('down')}
                                    className="h-7 w-7 p-0 hover:bg-chat-hover"
                                >
                                    <ThumbsDown className="h-3 w-3" />
                                </button>
                                <button
                                    onClick={handleRegenerate}
                                    className="h-7 w-7 p-0 hover:bg-chat-hover"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}