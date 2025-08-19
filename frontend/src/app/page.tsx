'use client';
import { useState } from "react";

// importing components
import TopNav from "@/components/common/TopNav";
import { Sidebar } from "@/components/common/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MessageInput } from "@/components/chat/MessageInput";

import { Message } from "@/types/chat";

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const hasMessages = messages.length > 0;

    const handleSendMessage = async (content: string) => {
        const userMessage: Message = {
            id: Date.now().toString(),
            content,
            role: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setSidebarOpen(true); // Show sidebar after first message
        setIsTyping(true);

        // Simulating the response for now. REDIS Implementation later yeta.
        setTimeout(() => {
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: "Hi, How can AVAI help you today?",
                role: 'assistant',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsTyping(false);
        }, 2000);   // yo timer cha aile lai. pachi chai setTimeout removal
    };
    return (
        <div className="flex h-screen w-full">
            <TopNav
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                sidebarOpen={sidebarOpen}
                hasMessages={hasMessages}
            />
            <div className="flex flex-1 pt-14">
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    conversations={[]}
                />

                <main className={`flex-1 flex flex-col transition-smooth ${hasMessages ? 'justify-start' : 'justify-center'
                    }`}>
                    <ChatWindow
                        messages={messages}
                        isTyping={isTyping}
                        hasMessages={hasMessages}
                    />
                    <MessageInput
                        onSendMessage={handleSendMessage}
                        disabled={isTyping}
                        hasMessages={hasMessages}
                    />
                </main>
            </div>
        </div>
    );
}
