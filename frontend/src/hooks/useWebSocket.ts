import { useEffect, useRef, useState, useCallback } from 'react';
import { Message, FileAttachment } from '@/components/chat/ChatLayout';

interface WebSocketMessage {
  type: 'chat_message' | 'ai_response' | 'chat_queued' | 'chat_ack' | 'ai_response_ack' | 'heartbeat' | 'error' | 'connected' | 'welcome' | 'log_summary' | 'stored_logs' | 'log_update' | 'message' | 'file' | 'typing';
  payload?: any;
  message?: string;
  timestamp?: string;
  source?: string;
  clientId?: string;
  client_id?: string;
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
      // Connect as 'general' type for chat functionality, not 'dashboard'
      const clientUrl = `${url}?type=general&client_id=${clientId}`;
      
      console.log('🔗 WebSocket connecting to:', clientUrl);
      console.log('🆔 PERSISTENT Client ID:', clientId);
      console.log('👤 Client Type: general (chat client)');
      console.log('🔄 This ID will stay the same across reconnections');
      
      const ws = new WebSocket(clientUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully!');
        console.log('🆔 Connected with client ID:', clientId);
        console.log('🌐 Connection URL:', clientUrl);
        setIsConnected(true);
        setIsReconnecting(false);
        
        // Clear any pending reconnection timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = undefined;
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Only attempt to reconnect if it wasn't a deliberate close
        if (event.code !== 1000) {
          console.log('🔄 Connection lost unexpectedly, attempting to reconnect...');
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Reconnecting to WebSocket...');
            setIsReconnecting(true);
            connect();
          }, 3000);
        }
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

    // Enhanced message format that matches what the WebSocket server expects
    const payload: WebSocketMessage = {
      type: 'chat_message',
      message: message.trim(),
      timestamp: new Date().toISOString(),
      clientId: clientIdRef.current,
      source: 'react_frontend'
    };

    // Add file attachments if provided
    if (files && files.length > 0) {
      payload.payload = {
        files: files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          url: file.url,
          size: file.size
        }))
      };
    }

    try {
      console.log('📤 Sending message to WebSocket:', {
        type: payload.type,
        messageLength: message.length,
        hasFiles: !!(files && files.length > 0),
        clientId: clientIdRef.current
      });
      
      wsRef.current.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
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
