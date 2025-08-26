import { useState, useEffect, useRef, useCallback } from 'react';

export interface LogMessage {
  timestamp: string;
  level: string;
  component: string;
  message: string;
  function?: string;
  line?: number;
  file?: string;
  extra?: Record<string, any>;
}

export interface PipelineStep {
  id: string;
  name: string;
  status: 'waiting' | 'active' | 'completed' | 'error';
  message?: string;
  timestamp?: string;
  logs?: LogMessage[];
}

export interface RealTimeLoggingState {
  connected: boolean;
  logs: LogMessage[];
  pipelineSteps: PipelineStep[];
  currentStep: number;
  isProcessing: boolean;
  connectionAttempts: number;
  lastHeartbeat: Date | null;
}

const WEBSOCKET_URL = 'wss://websocket.avai.life/ws';
const RECONNECT_INTERVAL = 5000;
const MAX_LOGS = 1000;

export const useRealTimeLogging = () => {
  const [state, setState] = useState<RealTimeLoggingState>({
    connected: false,
    logs: [],
    pipelineSteps: [
      { id: 'prompt', name: 'Processing Prompt', status: 'waiting' },
      { id: 'logger', name: 'System Logger', status: 'waiting' },
      { id: 'canister', name: 'ICP Canister', status: 'waiting' },
      { id: 'response', name: 'Generating Response', status: 'waiting' }
    ],
    currentStep: -1,
    isProcessing: false,
    connectionAttempts: 0,
    lastHeartbeat: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetPipeline = useCallback(() => {
    setState(prev => ({
      ...prev,
      pipelineSteps: prev.pipelineSteps.map(step => ({
        ...step,
        status: 'waiting',
        message: undefined,
        timestamp: undefined,
        logs: []
      })),
      currentStep: -1,
      isProcessing: false
    }));
  }, []);

  const updatePipelineStep = useCallback((stepId: string, updates: Partial<PipelineStep>) => {
    setState(prev => ({
      ...prev,
      pipelineSteps: prev.pipelineSteps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  }, []);

  const processLogMessage = useCallback((logMessage: LogMessage) => {
    // Add to logs array
    setState(prev => ({
      ...prev,
      logs: [logMessage, ...prev.logs.slice(0, MAX_LOGS - 1)]
    }));

    // Determine pipeline step based on log content
    const message = logMessage.message.toLowerCase();
    const component = logMessage.component.toLowerCase();
    
    // Map log messages to pipeline steps
    if (message.includes('processing prompt') || message.includes('starting processing') || component.includes('prompt')) {
      updatePipelineStep('prompt', {
        status: 'active',
        message: logMessage.message,
        timestamp: logMessage.timestamp
      });
      setState(prev => ({ ...prev, currentStep: 0, isProcessing: true }));
    }
    
    else if (message.includes('redis') || message.includes('queue') || message.includes('logger') || component.includes('redis')) {
      updatePipelineStep('prompt', { status: 'completed' });
      updatePipelineStep('logger', {
        status: 'active',
        message: logMessage.message,
        timestamp: logMessage.timestamp
      });
      setState(prev => ({ ...prev, currentStep: 1 }));
    }
    
    else if (message.includes('canister') || message.includes('icp') || message.includes('blockchain') || component.includes('canister')) {
      updatePipelineStep('logger', { status: 'completed' });
      updatePipelineStep('canister', {
        status: 'active',
        message: logMessage.message,
        timestamp: logMessage.timestamp
      });
      setState(prev => ({ ...prev, currentStep: 2 }));
    }
    
    else if (message.includes('completed') || message.includes('response') || message.includes('result') || component.includes('response')) {
      updatePipelineStep('canister', { status: 'completed' });
      updatePipelineStep('response', {
        status: 'active',
        message: logMessage.message,
        timestamp: logMessage.timestamp
      });
      setState(prev => ({ ...prev, currentStep: 3 }));
      
      // Complete pipeline after a short delay
      setTimeout(() => {
        updatePipelineStep('response', { status: 'completed' });
        setState(prev => ({ ...prev, isProcessing: false, currentStep: -1 }));
      }, 2000);
    }
    
    else if (message.includes('failed') || message.includes('error') || logMessage.level === 'ERROR') {
      // Mark current step as error
      setState(prev => {
        const currentStepId = prev.pipelineSteps[prev.currentStep]?.id;
        if (currentStepId) {
          updatePipelineStep(currentStepId, {
            status: 'error',
            message: logMessage.message,
            timestamp: logMessage.timestamp
          });
        }
        return { ...prev, isProcessing: false };
      });
    }
  }, [updatePipelineStep]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, connectionAttempts: prev.connectionAttempts + 1 }));

    try {
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 Connected to AVAI logging WebSocket');
        setState(prev => ({ ...prev, connected: true, connectionAttempts: 0 }));
        
        // Send client identification
        ws.send(JSON.stringify({
          type: 'client_identify',
          client_type: 'frontend_logger',
          timestamp: new Date().toISOString()
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'log_message' && data.payload) {
            const logMessage: LogMessage = {
              timestamp: data.timestamp,
              level: data.payload.level,
              component: data.payload.component,
              message: data.payload.message,
              function: data.payload.function,
              line: data.payload.line,
              file: data.payload.file,
              extra: data.payload.extra
            };
            
            processLogMessage(logMessage);
          }
          
          else if (data.type === 'heartbeat') {
            setState(prev => ({ ...prev, lastHeartbeat: new Date() }));
            
            // Send heartbeat response
            ws.send(JSON.stringify({
              type: 'heartbeat_response',
              timestamp: new Date().toISOString(),
              client_id: 'frontend_logger'
            }));
          }
          
          else if (data.type === 'system_status' && data.payload) {
            // Handle system status updates
            console.log('📊 System status update:', data.payload);
          }
          
        } catch (error) {
          console.warn('⚠️ Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code);
        setState(prev => ({ ...prev, connected: false }));
        
        // Attempt to reconnect if not a clean close
        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setState(prev => ({ ...prev, connected: false }));
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      scheduleReconnect();
    }
  }, [processLogMessage]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Attempting to reconnect to WebSocket...');
      connect();
    }, RECONNECT_INTERVAL);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    
    setState(prev => ({ ...prev, connected: false }));
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Heartbeat monitoring
  useEffect(() => {
    if (state.connected && state.lastHeartbeat) {
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
      
      // Consider connection dead if no heartbeat for 60 seconds
      heartbeatTimeoutRef.current = setTimeout(() => {
        console.warn('💔 No heartbeat received, connection may be dead');
        setState(prev => ({ ...prev, connected: false }));
        scheduleReconnect();
      }, 60000);
    }
  }, [state.lastHeartbeat, state.connected, scheduleReconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    resetPipeline,
    getStepStatusColor: (status: PipelineStep['status']) => {
      switch (status) {
        case 'waiting': return 'text-gray-400';
        case 'active': return 'text-blue-400';
        case 'completed': return 'text-green-400';
        case 'error': return 'text-red-400';
        default: return 'text-gray-400';
      }
    },
    getStepIcon: (status: PipelineStep['status']) => {
      switch (status) {
        case 'waiting': return '⏳';
        case 'active': return '🔄';
        case 'completed': return '✅';
        case 'error': return '❌';
        default: return '⏳';
      }
    }
  };
};
