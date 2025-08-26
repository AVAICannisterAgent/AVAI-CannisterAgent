import { useState, useCallback } from 'react';

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  files?: any[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export const useConversationManager = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  const createNewConversation = useCallback((title?: string) => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: title || "New Chat",
      messages: [],
      createdAt: new Date()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    return newConversation;
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
    };

    setCurrentConversation(current => {
      if (!current) {
        const newConv = createNewConversation(message.content.slice(0, 30) + "...");
        return {
          ...newConv,
          messages: [newMessage]
        };
      }

      const updated = {
        ...current,
        messages: [...current.messages, newMessage]
      };

      // Update in conversations list
      setConversations(prev => 
        prev.map(conv => conv.id === updated.id ? updated : conv)
      );

      return updated;
    });

    return newMessage;
  }, [createNewConversation]);

  const updateConversationTitle = useCallback((conversationId: string, title: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId ? { ...conv, title } : conv
      )
    );
    
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? { ...prev, title } : null);
    }
  }, [currentConversation?.id]);

  return {
    conversations,
    currentConversation,
    setCurrentConversation,
    createNewConversation,
    addMessage,
    updateConversationTitle,
    hasMessages: currentConversation && currentConversation.messages.length > 0
  };
};
