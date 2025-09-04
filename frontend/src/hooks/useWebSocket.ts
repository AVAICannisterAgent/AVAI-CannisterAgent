import { useEffect, useRef, useState, useCallback } from 'react';
import { Message, FileAttachment } from '@/components/chat/ChatLayout';

interface WebSocketMessage {
  type: 'chat_message' | 'ai_response' | 'chat_queued' | 'chat_ack' | 'ai_response_ack' | 'heartbeat' | 'error' | 'connected' | 'welcome' | 'log_summary' | 'stored_logs' | 'log_update' | 'message' | 'file' | 'typing' | 'ping' | 'pong';
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
  const reconnectAttemptsRef = useRef<number>(0);
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 10;
  
  // Generate client ID once and persist it across reconnections
  const clientIdRef = useRef<string>(`react_client_${Date.now()}`);

  // Send ping to keep connection alive
  const sendPing = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ 
          type: 'ping', 
          timestamp: new Date().toISOString(),
          clientId: clientIdRef.current 
        }));
      } catch (error) {
        console.warn('Failed to send ping:', error);
      }
    }
  }, []);

  // Start ping interval
  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    // Send ping every 30 seconds to keep connection alive
    pingIntervalRef.current = setInterval(sendPing, 30000);
  }, [sendPing]);

  // Stop ping interval
  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = undefined;
    }
  }, []);
  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('⚠️ WebSocket already connecting/connected, skipping new connection attempt');
      return;
    }

    try {
      // Use the persistent client ID
      const clientId = clientIdRef.current;
      // Connect as 'general' type for chat functionality, not 'dashboard'
      const clientUrl = `${url}?type=general&client_id=${clientId}`;
      
      console.log('🔗 WebSocket connecting to:', clientUrl);
      console.log('🆔 PERSISTENT Client ID:', clientId);
      console.log('👤 Client Type: general (chat client)');
      console.log('🔄 Reconnect attempt:', reconnectAttemptsRef.current + 1);
      
      const ws = new WebSocket(clientUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully!');
        console.log('🆔 Connected with client ID:', clientId);
        console.log('🌐 Connection URL:', clientUrl);
        setIsConnected(true);
        setIsReconnecting(false);
        reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
        
        // Start ping interval to keep connection alive
        startPingInterval();
        
        // Clear any pending reconnection timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = undefined;
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        stopPingInterval(); // Stop ping interval on disconnect
        
        // Only attempt to reconnect if it wasn't a deliberate close and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const backoffDelay = Math.min(3000 * Math.pow(1.5, reconnectAttemptsRef.current), 30000); // Exponential backoff, max 30 seconds
          console.log(`🔄 Connection lost unexpectedly, reconnecting in ${backoffDelay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Reconnecting to WebSocket...');
            setIsReconnecting(true);
            reconnectAttemptsRef.current++;
            connect();
          }, backoffDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached, giving up');
          setIsReconnecting(false);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        // Don't trigger immediate reconnect on error, let onclose handle it
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  }, [url, startPingInterval]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket...');
    stopPingInterval(); // Stop ping interval
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close(1000, 'Client disconnecting');
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsReconnecting(false);
  }, [stopPingInterval]);

  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 WebSocket hook cleanup - disconnecting');
      disconnect();
    };
  }, [connect, disconnect]);

  const sendMessage = useCallback((message: string, files?: FileAttachment[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket is not connected - state:', wsRef.current?.readyState);
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
        clientId: clientIdRef.current,
        wsState: wsRef.current.readyState
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
        
        // Handle ping/pong for connection health
        if (data.type === 'pong') {
          console.log('🏓 Received pong from server');
          return; // Don't forward pong to application
        }
        
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
