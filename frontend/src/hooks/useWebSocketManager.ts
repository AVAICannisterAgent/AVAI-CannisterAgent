import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface WebSocketData {
  type: string;
  payload?: any;
  message?: string;
  timestamp?: string;
  client_id?: string;
}

interface UseWebSocketManagerProps {
  url: string;
  onMessage?: (data: WebSocketData) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

export const useWebSocketManager = ({ 
  url, 
  onMessage, 
  onConnectionChange 
}: UseWebSocketManagerProps) => {
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | undefined>();
  const [waitingTime, setWaitingTime] = useState(0);
  const waitingStartRef = useRef<Date | null>(null);

  const { isConnected, isReconnecting, sendMessage, subscribe, clientId } = useWebSocket(url);

  // Handle waiting time tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (waitingStartRef.current) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - waitingStartRef.current!.getTime()) / 1000);
        setWaitingTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [waitingStartRef.current]);

  // Subscribe to WebSocket messages
  useEffect(() => {
    subscribe((data: WebSocketData) => {
      console.log('📨 WebSocket message:', data.type);
      
      // Handle heartbeat
      if (data.type === 'heartbeat') {
        setLastHeartbeat(new Date());
      }
      
      // Handle typing state
      if (data.type === 'chat_queued') {
        waitingStartRef.current = new Date();
        setWaitingTime(0);
      }
      
      if (data.type === 'ai_response' || data.type === 'error') {
        waitingStartRef.current = null;
        setWaitingTime(0);
      }
      
      // Forward to parent handler
      if (onMessage) {
        onMessage(data);
      }
    });
  }, [subscribe, onMessage]);

  // Handle connection changes
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(isConnected);
    }
  }, [isConnected, onConnectionChange]);

  return {
    isConnected,
    isReconnecting,
    sendMessage,
    clientId,
    lastHeartbeat,
    waitingTime,
    isWaiting: waitingStartRef.current !== null
  };
};
