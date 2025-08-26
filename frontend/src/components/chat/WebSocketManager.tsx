import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import type { Message, Conversation } from "./ChatLayout";

interface WebSocketManagerProps {
  onTypingChange: (isTyping: boolean) => void;
  onConversationUpdate: (conversation: Conversation) => void;
  onConversationsUpdate: (updater: (prev: Conversation[]) => Conversation[]) => void;
  onHeartbeat: (timestamp: Date) => void;
  currentConversation: Conversation | null;
}

export const useWebSocketManager = ({
  onTypingChange,
  onConversationUpdate,
  onConversationsUpdate,
  onHeartbeat,
  currentConversation
}: WebSocketManagerProps) => {
  const { toast } = useToast();
  const WEBSOCKET_URL = 'wss://websocket.avai.life/ws';
  
  const { isConnected, isReconnecting, sendMessage: wssSendMessage, subscribe, clientId } = useWebSocket(WEBSOCKET_URL);

  // Subscribe to WebSocket messages
  useEffect(() => {
    console.log('🔄 Setting up WebSocket subscription...');
    console.log('🆔 Client ID for this connection:', clientId);
    
    subscribe((data) => {
      console.log('📨 WebSocket message received:', data.type);
      
      switch (data.type) {
        case 'heartbeat':
          console.log('💓 Heartbeat received');
          onHeartbeat(new Date());
          break;
          
        case 'chat_queued':
          console.log('📤 Message queued for processing');
          onTypingChange(true);
          toast({
            title: "AVAI is thinking... 🧠",
            description: "Your blockchain diagnosis is in progress!",
          });
          break;
        
        case 'orchestration':
          // Handle orchestration events from backend
          console.log('🎭 Orchestration event received:', data.event_type);
          
          if (data.event_type === 'ai_response') {
            console.log('🤖 AI Response via orchestration!');
            
            // Check if this response is for this client
            const responseData = data.data;
            if (responseData.client_id && responseData.client_id !== clientId) {
              console.log('⏭️ Response not for this client, ignoring');
              return;
            }
            
            onTypingChange(false);
            
            if (currentConversation) {
              const aiMessage: Message = {
                id: Date.now().toString(),
                content: responseData.response || 'No response received',
                role: "assistant",
                timestamp: new Date(data.timestamp || new Date()),
              };

              const updatedConversation = {
                ...currentConversation,
                messages: [...currentConversation.messages, aiMessage]
              };

              onConversationUpdate(updatedConversation);
              
              // Update conversations list
              onConversationsUpdate((prev: Conversation[]) => {
                const exists = prev.find(conv => conv.id === updatedConversation.id);
                if (!exists) {
                  return [updatedConversation, ...prev];
                }
                return prev.map(conv => 
                  conv.id === updatedConversation.id ? updatedConversation : conv
                );
              });
            }
          }
          break;
        
        case 'ai_response':
          // Handle direct ai_response messages (fallback)
          console.log('🤖 Direct AVAI Response received!');
          
          // Check if this response is for this client
          if (data.client_id && data.client_id !== clientId) {
            console.log('⏭️ Response not for this client, ignoring');
            return;
          }
          
          onTypingChange(false);
          
          if (currentConversation) {
            const aiMessage: Message = {
              id: Date.now().toString(),
              content: data.payload?.response || data.response || 'No response received',
              role: "assistant",
              timestamp: new Date(data.timestamp || new Date()),
            };

            const updatedConversation = {
              ...currentConversation,
              messages: [...currentConversation.messages, aiMessage]
            };

            onConversationUpdate(updatedConversation);
            
            // Update conversations list
            onConversationsUpdate((prev: Conversation[]) => {
              const exists = prev.find(conv => conv.id === updatedConversation.id);
              if (!exists) {
                return [updatedConversation, ...prev];
              }
              return prev.map(conv => 
                conv.id === updatedConversation.id ? updatedConversation : conv
              );
            });
          }
          break;
          
        case 'error':
          console.log('❌ WebSocket error received:', data.message);
          onTypingChange(false);
          toast({
            title: "Oops! 🩺",
            description: "AVAI encountered an issue. Let me try again!",
            variant: "destructive"
          });
          break;
          
        default:
          console.log('📋 Unknown message type:', data.type);
      }
    });
  }, [subscribe, toast, clientId, currentConversation, onTypingChange, onConversationUpdate, onConversationsUpdate, onHeartbeat]);

  // Show connection status
  useEffect(() => {
    if (isReconnecting) {
      toast({
        title: "AVAI is reconnecting... 🔄",
        description: "Restoring blockchain connection",
        duration: 2000,
      });
    } else if (isConnected) {
      toast({
        title: "AVAI is online! 🩺✨",
        description: "Ready to help with your blockchain needs",
        duration: 2000,
      });
    }
  }, [isConnected, isReconnecting, toast]);

  const sendMessage = async (content: string) => {
    if (!isConnected) {
      toast({
        title: "Connection lost 📡",
        description: "AVAI is reconnecting to the blockchain...",
        variant: "destructive",
      });
      return false;
    }

    const sent = wssSendMessage(content);
    if (!sent) {
      toast({
        title: "Message failed 📤",
        description: "Let AVAI try sending that again!",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return {
    isConnected,
    isReconnecting,
    sendMessage,
    clientId
  };
};
