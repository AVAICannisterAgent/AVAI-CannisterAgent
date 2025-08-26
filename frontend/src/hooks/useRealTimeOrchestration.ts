import { useState, useEffect, useCallback, useRef } from 'react';

export interface OrchestrationStep {
  id: string;
  name: string;
  status: 'waiting' | 'active' | 'completed' | 'error';
  message: string;
  timestamp?: string;
  progress?: number;
  metadata?: any;
}

export interface OrchestrationSession {
  session_id: string;
  prompt: string;
  analysis?: {
    intent: string;
    domain: string;
    complexity: string;
    priority: number;
    estimated_time: number;
  };
  current_step?: string;
  progress: number;
  status: 'initializing' | 'analyzing' | 'executing' | 'completing' | 'completed' | 'error';
  start_time: string;
  end_time?: string;
  error?: string;
  logs_count: number;
  agent_used?: string;
  execution_time?: number;
}

export interface LogMessage {
  timestamp: string;
  level: string;
  component: string;
  message: string;
  extra?: any;
}

interface RealTimeOrchestrationData {
  type: 'orchestration_start' | 'orchestration_progress' | 'orchestration_complete' | 'log_message' | 'step_update';
  session_id?: string;
  session?: OrchestrationSession;
  step?: OrchestrationStep;
  log?: LogMessage;
  payload?: any;
}

export const useRealTimeOrchestration = (url: string) => {
  const [currentSession, setCurrentSession] = useState<OrchestrationSession | null>(null);
  const [orchestrationSteps, setOrchestrationSteps] = useState<OrchestrationStep[]>([
    { 
      id: 'analysis', 
      name: 'Smart Prompt Analysis', 
      status: 'waiting', 
      message: 'Waiting for prompt analysis',
      progress: 0
    },
    { 
      id: 'setup', 
      name: 'Dynamic Redis Setup', 
      status: 'waiting', 
      message: 'Waiting for Redis communication setup',
      progress: 0
    },
    { 
      id: 'preprocessing', 
      name: 'Preprocessing Steps', 
      status: 'waiting', 
      message: 'Waiting for preprocessing execution',
      progress: 0
    },
    { 
      id: 'agent_execution', 
      name: 'Agent Execution', 
      status: 'waiting', 
      message: 'Waiting for agent processing',
      progress: 0
    },
    { 
      id: 'postprocessing', 
      name: 'Result Processing', 
      status: 'waiting', 
      message: 'Waiting for result optimization',
      progress: 0
    }
  ]);
  
  const [recentLogs, setRecentLogs] = useState<LogMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(`orchestration_client_${Date.now()}`);

  // Parse log messages to update pipeline steps
  const parseLogForStepUpdate = useCallback((log: LogMessage): OrchestrationStep | null => {
    const { message, component, timestamp } = log;
    const lowerMessage = message.toLowerCase();

    // Map log components and messages to pipeline steps
    if (component === 'centralized_orchestrator') {
      if (lowerMessage.includes('smart analysis complete')) {
        return {
          id: 'analysis',
          name: 'Smart Prompt Analysis',
          status: 'completed',
          message: 'Prompt analysis completed with intelligent routing',
          timestamp,
          progress: 100
        };
      } else if (lowerMessage.includes('orchestration_start')) {
        return {
          id: 'analysis',
          name: 'Smart Prompt Analysis',
          status: 'active',
          message: 'Analyzing prompt intent, domain, and complexity',
          timestamp,
          progress: 50
        };
      } else if (lowerMessage.includes('redis_setup')) {
        return {
          id: 'setup',
          name: 'Dynamic Redis Setup',
          status: 'active',
          message: 'Configuring dynamic Redis communication channels',
          timestamp,
          progress: 50
        };
      } else if (lowerMessage.includes('preprocessing_step')) {
        return {
          id: 'preprocessing',
          name: 'Preprocessing Steps',
          status: 'active',
          message: 'Executing domain-specific preprocessing steps',
          timestamp,
          progress: 75
        };
      } else if (lowerMessage.includes('agent_execution_start')) {
        return {
          id: 'agent_execution',
          name: 'Agent Execution',
          status: 'active',
          message: 'Primary agent processing request',
          timestamp,
          progress: 25
        };
      } else if (lowerMessage.includes('agent_execution_complete')) {
        return {
          id: 'agent_execution',
          name: 'Agent Execution',
          status: 'completed',
          message: 'Agent processing completed successfully',
          timestamp,
          progress: 100
        };
      } else if (lowerMessage.includes('orchestration_complete')) {
        return {
          id: 'postprocessing',
          name: 'Result Processing',
          status: 'completed',
          message: 'Results optimized and ready for delivery',
          timestamp,
          progress: 100
        };
      }
    }

    // Map other components to appropriate steps
    if (component.includes('research') || component.includes('search')) {
      return {
        id: 'agent_execution',
        name: 'Agent Execution',
        status: 'active',
        message: `Research agent: ${message.substring(0, 50)}...`,
        timestamp,
        progress: Math.min((recentLogs.length % 20) * 5, 90)
      };
    }

    if (component.includes('tool') || component.includes('browser')) {
      return {
        id: 'agent_execution',
        name: 'Agent Execution',
        status: 'active',
        message: `Tool execution: ${message.substring(0, 40)}...`,
        timestamp,
        progress: Math.min((recentLogs.length % 15) * 7, 85)
      };
    }

    return null;
  }, [recentLogs.length]);

  // Connect to WebSocket for real-time updates
  const connect = useCallback(() => {
    try {
      setConnectionStatus('connecting');
      
      // Enhanced WebSocket URL with orchestration channels
      const clientId = clientIdRef.current;
      const wsUrl = `${url}?type=orchestration&client_id=${clientId}&channels=orchestration,logs,progress`;
      
      console.log('🎯 Connecting to orchestration WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ Orchestration WebSocket connected');
        setConnectionStatus('connected');
        
        // Request initial state
        ws.send(JSON.stringify({
          type: 'request_state',
          client_id: clientId
        }));
      };

      ws.onclose = () => {
        console.log('🔌 Orchestration WebSocket disconnected');
        setConnectionStatus('disconnected');
        
        // Attempt reconnection after 3 seconds
        setTimeout(() => {
          if (wsRef.current === ws) {
            connect();
          }
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('❌ Orchestration WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

      ws.onmessage = (event) => {
        try {
          const data: RealTimeOrchestrationData = JSON.parse(event.data);
          
          switch (data.type) {
            case 'orchestration_start':
              if (data.session) {
                setCurrentSession(data.session);
                setIsProcessing(true);
                
                // Reset steps to initial state
                setOrchestrationSteps(prev => prev.map(step => ({
                  ...step,
                  status: 'waiting' as const,
                  message: `Waiting for ${step.name.toLowerCase()}`,
                  progress: 0
                })));
              }
              break;

            case 'orchestration_progress':
              if (data.session) {
                setCurrentSession(data.session);
              }
              if (data.step) {
                setOrchestrationSteps(prev => 
                  prev.map(step => 
                    step.id === data.step!.id ? data.step! : step
                  )
                );
              }
              break;

            case 'orchestration_complete':
              if (data.session) {
                setCurrentSession(data.session);
                setIsProcessing(false);
                
                // Mark all steps as completed
                setOrchestrationSteps(prev => prev.map(step => ({
                  ...step,
                  status: 'completed' as const,
                  progress: 100,
                  message: `${step.name} completed successfully`
                })));
              }
              break;

            case 'log_message':
              if (data.log) {
                setRecentLogs(prev => {
                  const newLogs = [data.log!, ...prev.slice(0, 49)]; // Keep last 50 logs
                  return newLogs;
                });
                
                // Try to parse log for step updates
                const stepUpdate = parseLogForStepUpdate(data.log);
                if (stepUpdate) {
                  setOrchestrationSteps(prev => 
                    prev.map(step => 
                      step.id === stepUpdate.id ? stepUpdate : step
                    )
                  );
                }
              }
              break;

            case 'step_update':
              if (data.step) {
                setOrchestrationSteps(prev => 
                  prev.map(step => 
                    step.id === data.step!.id ? data.step! : step
                  )
                );
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing orchestration WebSocket message:', error);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Orchestration WebSocket connection error:', error);
      setConnectionStatus('disconnected');
    }
  }, [url, parseLogForStepUpdate]);

  // Initialize connection
  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Simulate step progression based on logs when no explicit orchestration events
  useEffect(() => {
    if (recentLogs.length > 0 && isProcessing) {
      const latestLog = recentLogs[0];
      
      // If we haven't received explicit orchestration events, 
      // try to infer progress from logs
      if (!currentSession && latestLog.component === 'centralized_orchestrator') {
        setIsProcessing(true);
      }
    }
  }, [recentLogs, isProcessing, currentSession]);

  const requestSessionState = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'request_session_state',
        client_id: clientIdRef.current
      }));
    }
  }, []);

  return {
    currentSession,
    orchestrationSteps,
    recentLogs,
    isProcessing,
    connectionStatus,
    clientId: clientIdRef.current,
    requestSessionState
  };
};
