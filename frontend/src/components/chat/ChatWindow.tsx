import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { Message } from '@/types/chat';

interface ChatWindowProps {
    messages: Message[];
    isTyping: boolean;
    hasMessages: boolean;
}

export function ChatWindow({ messages, isTyping, hasMessages }: ChatWindowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    if (!hasMessages) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-2xl mx-auto px-4">
                    <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-black font-bold text-2xl">AI</span>
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        How can I help you today?
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        I'm your AI assistant, AVAI.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto">
                <div ref={scrollRef} className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                    {messages.map((message, index) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isFirst={index === 0}
                        />
                    ))}

                    {isTyping && (
                        <div>
                            <TypingIndicator />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}