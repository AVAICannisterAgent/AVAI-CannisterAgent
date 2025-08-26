import { useState } from "react";
import type { Conversation, Message } from "./ChatLayout";

export const useConversationManager = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Chat with AVAI 🩺",
      messages: [],
      createdAt: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    return newConversation;
  };

  const updateCurrentConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  const updateConversations = (updater: (prev: Conversation[]) => Conversation[]) => {
    setConversations(updater);
  };

  const addUserMessage = (content: string): Conversation => {
    let conversationToUpdate = currentConversation;

    // If no current conversation, create one
    if (!conversationToUpdate) {
      conversationToUpdate = {
        id: Date.now().toString(),
        title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
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
    return updatedConversation;
  };

  const selectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  const hasMessages = currentConversation && currentConversation.messages.length > 0;

  return {
    conversations,
    currentConversation,
    hasMessages,
    createNewConversation,
    updateCurrentConversation,
    updateConversations,
    addUserMessage,
    selectConversation
  };
};
