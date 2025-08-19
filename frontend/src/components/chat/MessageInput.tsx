import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip } from 'lucide-react';

interface MessageInputProps {
    onSendMessage: (message: string) => void;
    disabled: boolean;
    hasMessages: boolean;
}

export function MessageInput({ onSendMessage, disabled, hasMessages }: MessageInputProps) {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !disabled) {
            onSendMessage(message.trim());
            setMessage('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    return (
        <div className={`border-t border-border bg-background/80 backdrop-blur-sm ${hasMessages ? 'sticky bottom-0' : ''
            }`}>
            <div className={`max-w-4xl mx-auto p-4 ${hasMessages ? '' : 'max-w-2xl'
                }`}>
                <form onSubmit={handleSubmit} className="relative">
                    <div className="relative flex items-end space-x-3 p-4 bg-card rounded-2xl shadow-elegant border border-border">
                        <button
                            type="button"
                            className="p-2 text-muted-foreground hover:text-foreground"
                        >
                            <Paperclip className="h-5 w-5" />
                        </button>

                        <div className="flex-1 min-w-0">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={hasMessages ? "Type your message..." : "Ask me anything..."}
                                className="min-h-[44px] w-full max-h-32 resize-none border-0 bg-transparent p-0 text-base focus:outline-none"
                                rows={1}
                                disabled={disabled}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                type="submit"
                                disabled={!message.trim() || disabled}
                                className="p-2 gradient-primary text-black hover:opacity-90 transition-opacity"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {!hasMessages && (
                        <p className="text-center text-xs text-muted-foreground mt-3">
                            Press Enter to send, Shift + Enter for new line
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}