import { useEffect, useRef, useState, useCallback } from 'react';
import { Message, FileAttachment } from '@/components/chat/ChatLayout';

interface WebSocketMessage {
  type: 'chat_message' | 'ai_response' | 'chat_queued' | 'chat_ack' | 'ai_response_ack' | 'heartbeat' | 'error' | 'connected' | 'welcome' | 'log_summary' | 'stored_logs' | 'log_update' | 'message' | 'file' | 'typing';
  payload?: any;
  message?: string;
  response?: string; // ✅ Added for ai_response messages
  timestamp?: string;
  source?: string;
  clientId?: string;
  client_id?: string;
  original_prompt_id?: string; // ✅ Added for ai_response messages
  metadata?: any; // ✅ Added for ai_response messages
}

export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Generate client ID once and persist it across reconnections
  const clientIdRef = useRef<string>(`react_client_${Date.now()}`);

  const connect = useCallback(() => {
    try {
      // Use the persistent client ID
      const clientId = clientIdRef.current;
      const dashboardUrl = `${url}?type=dashboard&client_id=${clientId}`;
      
      console.log('🔗 WebSocket connecting to:', dashboardUrl);
      console.log('🆔 PERSISTENT Client ID:', clientId);
      console.log('🔄 This ID will stay the same across reconnections');
      
      const ws = new WebSocket(dashboardUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully!');
        console.log('🆔 Connected with client ID:', clientId);
        setIsConnected(true);
        setIsReconnecting(false);
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          setIsReconnecting(true);
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const sendMessage = useCallback((message: string, files?: FileAttachment[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    const payload: WebSocketMessage = {
      type: 'chat_message',
      payload: {
        prompt: message,  // ✅ Changed from 'message' to 'payload.prompt' 
        files: files,
        client_id: clientIdRef.current,
        source: 'frontend_chat',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
    };

    try {
      console.log('📤 Sending WebSocket message:', payload);
      wsRef.current.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, []);

  const subscribe = useCallback((callback: (data: WebSocketMessage) => void) => {
    if (!wsRef.current) return;

    wsRef.current.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }, []);

  return {
    isConnected,
    isReconnecting,
    sendMessage,
    subscribe,
    clientId: clientIdRef.current, // Expose the client ID for debugging/testing
  };
};
