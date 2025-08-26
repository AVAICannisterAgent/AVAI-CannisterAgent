import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface WebSocketData {
  type: string;
  event_type?: string; // For orchestration events
  payload?: any;
  message?: string;
  timestamp?: string;
  client_id?: string;
  id?: string;
  data?: {
    session_id?: string;
    prompt?: string;
    status?: string;
    progress?: number;
    current_step?: string;
    analysis?: {
      intent?: string;
      domain?: string;
      complexity?: string;
      priority?: number;
      estimated_time?: number;
    };
    response?: string | {
      summary?: string;
      recommendations?: string[];
      code_quality_score?: number;
      performance_metrics?: any;
      files_analyzed?: string[];
      issues_found?: any[];
    };
    start_time?: string;
    end_time?: string;
    execution_time?: number;
    logs_count?: number;
    client_id?: string;
    user_agent?: string;
    processing_details?: {
      step_description?: string;
      estimated_remaining?: number;
      substeps_completed?: number;
      total_substeps?: number;
      current_file?: string;
      files_processed?: number;
    };
    agent_metadata?: {
      agent_used?: string;
      confidence_score?: number;
      sources_analyzed?: string[];
      processing_time?: number;
    };
  };
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
