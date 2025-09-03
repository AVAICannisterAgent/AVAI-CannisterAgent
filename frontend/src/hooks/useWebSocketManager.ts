import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface WebSocketData {
  type: string;
  payload?: any;
  message?: string;
  timestamp?: string;
  client_id?: string;
  clientId?: string;
  promptId?: string;
  queuePosition?: number;
  queueCleared?: boolean;
  cleared_count?: number;
  error?: string;
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
      console.log('📨 WebSocket message received:', data.type, data);
      
      // Handle heartbeat
      if (data.type === 'heartbeat') {
        setLastHeartbeat(new Date());
        return;
      }
      
      // Handle queue operations
      if (data.type === 'chat_queued') {
        console.log('📤 Message queued for processing', {
          promptId: data.promptId,
          queuePosition: data.queuePosition,
          queueCleared: data.queueCleared
        });
        
        waitingStartRef.current = new Date();
        setWaitingTime(0);
        
        // Log queue clearing if it happened
        if (data.queueCleared) {
          console.log('🧹 Previous queue was cleared for this new prompt');
        }
      }
      
      // Handle queue clearing notifications
      if (data.type === 'queue_cleared') {
        console.log('🗑️ Queue cleared notification:', {
          clearedCount: data.cleared_count,
          reason: data.payload?.reason
        });
      }
      
      // Handle responses and errors
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
