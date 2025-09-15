import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect } from "react";
import type { Conversation, Message } from "./ChatLayout";

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

  // Environment-based WebSocket URL configuration
  const getWebSocketUrl = () => {
    const envUrl = import.meta.env.VITE_WEBSOCKET_URL;
    if (envUrl) {
      console.log('🔧 WebSocketManager using URL from environment:', envUrl);
      return envUrl;
    }

    // Always use production WebSocket URL through Cloudflare tunnel
    const url = 'wss://websocket.avai.life/ws';

    console.log('🔧 WebSocketManager using production WebSocket URL:', url);
    return url;
  };

  const WEBSOCKET_URL = getWebSocketUrl();

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

        case 'ai_response':
          console.log('🤖 AVAI Response received!');

          // Check if this response is for this client
          if (data.client_id && data.client_id !== clientId) {
            console.log('⏭️ Response not for this client, ignoring');
            return;
          }

          onTypingChange(false);

          if (currentConversation) {
            const aiMessage: Message = {
              id: Date.now().toString(),
              content: data.payload?.response || 'No response received',
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
