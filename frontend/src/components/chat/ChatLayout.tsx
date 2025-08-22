"use client"

import { useState } from "react";
import { TopNavigation } from "./TopNavigation";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { MessageInput } from "./MessageInput";
import { FileViewer } from "./FileViewer";

export interface FileAttachment {
  id: string;
  name: string;
  type: "pdf" | "image";
  url: string;
  size?: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  files?: FileAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export const ChatLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    setSidebarOpen(true);
  };

  const sendMessage = async (content: string) => {
    let conversationToUpdate = currentConversation;

    // If no current conversation, create one but don't add to sidebar yet
    if (!conversationToUpdate) {
      conversationToUpdate = {
        id: Date.now().toString(),
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        messages: [],
        createdAt: new Date()
      };
      setCurrentConversation(conversationToUpdate);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date()
    };

    // Update current conversation with user message
    const updatedConversation = {
      ...conversationToUpdate,
      messages: [...conversationToUpdate.messages, userMessage]
    };

    setCurrentConversation(updatedConversation);

    // Show typing indicator and simulate AI response
    setIsTyping(true);

    setTimeout(() => {
      // Mock file attachments for demo
      const mockFiles: FileAttachment[] = Math.random() > 0.5 ? [
        {
          id: "file-1",
          name: "analysis_report.pdf",
          type: "pdf",
          url: "/demo-pdf.pdf",
          size: "2.4 MB"
        },
        {
          id: "file-2",
          name: "chart_visualization.png",
          type: "image",
          url: "https://via.placeholder.com/800x600/6366f1/ffffff?text=Demo+Chart",
          size: "156 KB"
        }
      ] : [];

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm an AI assistant. This is a demo response to your message: \"" + content + "\". In a real implementation, this would connect to an AVAI service.",
        role: "assistant",
        timestamp: new Date(),
        files: mockFiles
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiMessage]
      };

      setCurrentConversation(finalConversation);

      // Add to sidebar only after AI responds (completing the conversation)
      setConversations(prev => {
        const exists = prev.find(conv => conv.id === finalConversation.id);
        if (!exists) {
          return [finalConversation, ...prev];
        }
        return prev.map(conv =>
          conv.id === finalConversation.id ? finalConversation : conv
        );
      });

      setIsTyping(false);
    }, 2000);
  };

  const hasMessages = currentConversation && currentConversation.messages.length > 0;

  const handleFileClick = (files: FileAttachment[]) => {
    setSelectedFiles(files);
    setFileViewerOpen(true);
  };

  return (
    <div className="h-screen bg-gradient-chat flex flex-col overflow-hidden">
      <TopNavigation
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={createNewConversation}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={setCurrentConversation}
          onNewChat={createNewConversation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col relative">
          {hasMessages || isTyping ? (
            <ChatWindow
              conversation={currentConversation}
              isTyping={isTyping}
              onFileClick={handleFileClick}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md animate-fade-in">
                <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-3">
                  Welcome to AVAI Chat
                </h1>
                <p className="text-text-secondary text-lg">
                  Start a conversation with AI. Ask questions, get help, or just chat.
                </p>
              </div>
            </div>
          )}

          <MessageInput
            onSendMessage={sendMessage}
            disabled={isTyping}
          />
        </div>

        <FileViewer
          files={selectedFiles}
          isOpen={fileViewerOpen}
          onClose={() => setFileViewerOpen(false)}
        />
      </div>
    </div>
  );
};