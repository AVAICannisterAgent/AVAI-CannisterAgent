import { useEffect, useState, useCallback, useRef } from 'react';
import WebSocketService, { WebSocketMessage } from '@/services/WebSocketService';

interface UseWebSocketReturn {
  connectionState: 'connected' | 'connecting' | 'disconnected';
  connectionInfo: any;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: string) => boolean;
  sendChatMessage: (message: string) => boolean;
  subscribe: (
    callback: (message: WebSocketMessage) => void,
    filter?: (message: WebSocketMessage) => boolean
  ) => string;
  unsubscribe: (subscriptionId: string) => boolean;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [connectionState, setConnectionState] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsService = useRef<WebSocketService>(WebSocketService.getInstance());
  const connectionSubscription = useRef<string | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize connection and set up polling for connection state
  useEffect(() => {
    const service = wsService.current;

    // Subscribe to connection state changes
    const handleMessage = (message: WebSocketMessage) => {
      if (message.type === 'connected' || message.type === 'error') {
        // Update connection state based on message type
        setConnectionState(service.connectionState);
      }
      setLastMessage(message);
    };

    connectionSubscription.current = service.subscribe(handleMessage, (msg) => 
      msg.type === 'connected' || msg.type === 'error'
    );

    // Start connection
    service.connect().catch(error => {
      console.error('❌ Failed to connect to WebSocket:', error);
    });

    // Poll connection state (backup method)
    pollInterval.current = setInterval(() => {
      const currentState = service.connectionState;
      setConnectionState(currentState);
    }, 2000);

    // Cleanup on unmount
    return () => {
      if (connectionSubscription.current) {
        service.unsubscribe(connectionSubscription.current);
      }
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, []);

  const sendMessage = useCallback((message: string): boolean => {
    return wsService.current.sendMessage({
      type: 'chat_message',
      message: message,
      source: 'react_hook'
    });
  }, []);

  const sendChatMessage = useCallback((message: string): boolean => {
    return wsService.current.sendChatMessage(message);
  }, []);

  const subscribe = useCallback((
    callback: (message: WebSocketMessage) => void,
    filter?: (message: WebSocketMessage) => boolean
  ): string => {
    return wsService.current.subscribe(callback, filter);
  }, []);

  const unsubscribe = useCallback((subscriptionId: string): boolean => {
    return wsService.current.unsubscribe(subscriptionId);
  }, []);

  return {
    connectionState,
    connectionInfo: wsService.current.connectionInfo,
    lastMessage,
    sendMessage,
    sendChatMessage,
    subscribe,
    unsubscribe
  };
};

export default useWebSocket;
