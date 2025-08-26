import React, { useState, useEffect } from 'react';
import { Stethoscope, ArrowRight, CheckCircle, Clock, Zap, Brain, Database, Link, AlertCircle, Wifi, WifiOff, Settings, Play, Gauge } from 'lucide-react';
import { useRealTimeOrchestration } from '@/hooks/useRealTimeOrchestration';

type PipelineStatus = 'waiting' | 'active' | 'completed' | 'error';

interface PipelineStep {
  id: string;
  name: string;
  status: PipelineStatus;
  message: string;
  timestamp?: string;
  progress?: number;
}

interface TypingIndicatorProps {
  isTyping?: boolean;
  lastHeartbeat?: Date;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isTyping = true,
  lastHeartbeat
}) => {
  // Use real-time orchestration hook
  const {
    currentSession,
    orchestrationSteps,
    recentLogs,
    isProcessing,
    connectionStatus,
    clientId
  } = useRealTimeOrchestration('wss://websocket.avai.life/ws');

  // Fallback pipeline steps if no real-time data
  const [fallbackSteps, setFallbackSteps] = useState<PipelineStep[]>([
    { id: 'prompt', name: 'Processing Prompt', status: 'waiting', message: 'Waiting for input analysis', progress: 0 },
    { id: 'logger', name: 'System Logger', status: 'waiting', message: 'Waiting for queue processing', progress: 0 },
    { id: 'canister', name: 'ICP Canister', status: 'waiting', message: 'Waiting for blockchain analysis', progress: 0 },
    { id: 'response', name: 'Generating Response', status: 'waiting', message: 'Waiting for response generation', progress: 0 }
  ]);
  
  const [currentStep, setCurrentStep] = useState(-1);
  const connected = connectionStatus === 'connected';
  
  // Use real-time data if available, otherwise fallback
  const pipelineSteps = orchestrationSteps.length > 0 ? orchestrationSteps : fallbackSteps;
  const actuallyProcessing = isProcessing || (isTyping && currentStep >= 0);
  const totalLogs = recentLogs.length;

  // Fallback simulation only when no real-time data and isTyping
  useEffect(() => {
    if (!isTyping || orchestrationSteps.length > 0) {
      // Reset fallback pipeline when not typing or when real-time data is available
      setFallbackSteps(prev => prev.map(step => ({
        ...step,
        status: 'waiting' as PipelineStatus,
        message: `Waiting for ${step.name.toLowerCase()}`,
        progress: 0
      })));
      setCurrentStep(-1);
      return;
    }

    // Only run fallback simulation if no real-time orchestration data
    if (orchestrationSteps.length === 0) {
      const progressionSteps = [
        { step: 0, delay: 500, message: 'Analyzing user input and context', progress: 25 },
        { step: 1, delay: 1500, message: 'Processing through Redis queue system', progress: 50 },
        { step: 2, delay: 3000, message: 'Connecting to ICP blockchain canisters', progress: 75 },
        { step: 3, delay: 5000, message: 'Generating AI-powered response', progress: 100 }
      ];

      const timeouts: NodeJS.Timeout[] = [];

      progressionSteps.forEach(({ step, delay, message, progress }) => {
        const timeout = setTimeout(() => {
          if (!isTyping) return;
          
          setCurrentStep(step);
          setFallbackSteps(prev => prev.map((pipelineStep, index) => {
            if (index < step) {
              return { ...pipelineStep, status: 'completed' as PipelineStatus, progress: 100 };
            } else if (index === step) {
              return { ...pipelineStep, status: 'active' as PipelineStatus, message, timestamp: new Date().toISOString(), progress };
            }
            return pipelineStep;
          }));
        }, delay);
        timeouts.push(timeout);
      });

      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [isTyping, orchestrationSteps.length]);

  // Complete pipeline when response is received (isTyping becomes false)
  useEffect(() => {
    if (!isTyping && currentStep >= 0 && orchestrationSteps.length === 0) {
      // Only run completion for fallback mode
      const completionTimeout = setTimeout(() => {
        setFallbackSteps(prev => prev.map(step => ({
          ...step,
          status: 'completed' as PipelineStatus,
          message: `${step.name} completed successfully`,
          timestamp: new Date().toISOString(),
          progress: 100
        })));
        setCurrentStep(3);
        
        // Reset after showing completion
        const resetTimeout = setTimeout(() => {
          setFallbackSteps(prev => prev.map(step => ({
            ...step,
            status: 'waiting' as PipelineStatus,
            message: 'Ready for next request',
            progress: 0
          })));
          setCurrentStep(-1);
        }, 2000);
        
        return () => clearTimeout(resetTimeout);
      }, 500);
      
      return () => clearTimeout(completionTimeout);
    }
  }, [isTyping, currentStep, orchestrationSteps.length]);

  const getStepIcon = (stepId: string, status: string) => {
    const baseClass = "w-3 h-3";
    
    if (status === 'completed') {
      return <CheckCircle className={`${baseClass} text-green-400`} />;
    }
    
    if (status === 'error') {
      return <AlertCircle className={`${baseClass} text-red-400`} />;
    }
    
    switch (stepId) {
      case 'analysis':
        return <Brain className={baseClass} />;
      case 'setup':
        return <Settings className={baseClass} />;
      case 'preprocessing':
        return <Gauge className={baseClass} />;
      case 'agent_execution':
        return <Play className={baseClass} />;
      case 'postprocessing':
        return <CheckCircle className={baseClass} />;
      // Fallback icons for old steps
      case 'prompt':
        return <Brain className={baseClass} />;
      case 'logger':
        return <Database className={baseClass} />;
      case 'canister':
        return <Link className={baseClass} />;
      case 'response':
        return <CheckCircle className={baseClass} />;
      default:
        return <Clock className={baseClass} />;
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'active': return 'text-blue-400 bg-blue-500/20 animate-pulse';
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'waiting': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getStepDetails = (step: any) => {
    if (step.message) {
      return step.message.length > 60 ? step.message.substring(0, 60) + '...' : step.message;
    }
    
    switch (step.id) {
      case 'analysis':
        return step.status === 'active' ? 'Analyzing prompt intent, domain, complexity...' : 'Waiting for smart prompt analysis';
      case 'setup':
        return step.status === 'active' ? 'Configuring dynamic Redis channels...' : 'Waiting for Redis communication setup';
      case 'preprocessing':
        return step.status === 'active' ? 'Executing domain-specific preprocessing...' : 'Waiting for preprocessing execution';
      case 'agent_execution':
        return step.status === 'active' ? 'Primary agent processing request...' : 'Waiting for agent processing';
      case 'postprocessing':
        return step.status === 'active' ? 'Optimizing and formatting results...' : 'Waiting for result optimization';
      // Fallback descriptions for old steps
      case 'prompt':
        return step.status === 'active' ? 'Analyzing your request...' : 'Waiting for input analysis';
      case 'logger':
        return step.status === 'active' ? 'Logging to Redis queue...' : 'Waiting for queue processing';
      case 'canister':
        return step.status === 'active' ? 'Interfacing with ICP blockchain...' : 'Waiting for blockchain analysis';
      case 'response':
        return step.status === 'active' ? 'Crafting diagnosis...' : 'Waiting for response generation';
      default:
        return 'Waiting...';
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex gap-4 justify-start animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
        <Stethoscope className="w-4 h-4 text-white animate-pulse" />
      </div>

      <div className="flex flex-col max-w-[90%] lg:max-w-[80%] items-start">
        <div className="message-ai rounded-bl-md border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {currentSession ? 'AVAI Smart Orchestrator' : 'AVAI Real-Time Diagnostic Pipeline'}
              </span>
              <span className="text-xs">�</span>
              
              {/* Session Information */}
              {currentSession && (
                <div className="flex items-center gap-1 text-xs text-blue-400">
                  <span>•</span>
                  <span>{currentSession.analysis?.domain || 'general'}</span>
                  <span>•</span>
                  <span>{currentSession.analysis?.complexity || 'moderate'}</span>
                  {currentSession.analysis?.priority && (
                    <>
                      <span>•</span>
                      <span>P{currentSession.analysis.priority}</span>
                    </>
                  )}
                </div>
              )}
              
              {/* Connection Status */}
              <div className="flex items-center gap-1 ml-auto">
                {connected ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-400" />
                )}
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-current rounded-full animate-typing-dots"></div>
                  <div className="w-1 h-1 bg-current rounded-full animate-typing-dots" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-current rounded-full animate-typing-dots" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
            
            {/* Real-time status */}
            <div className="text-xs text-gray-400 mt-1">
              {connected ? (
                <span>
                  🔗 Live orchestration • {totalLogs} logs • 
                  {currentSession ? ` Session: ${currentSession.session_id.substring(0, 8)}...` : ' Redis channels active'}
                  {lastHeartbeat && ` • Last ping: ${formatTimestamp(lastHeartbeat.toISOString())}`}
                </span>
              ) : (
                <span>⚠️ Real-time orchestration unavailable • Using fallback mode</span>
              )}
            </div>
            
            {/* Overall Progress Bar */}
            {(currentSession || actuallyProcessing) && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${currentSession?.progress || 
                        Math.round((pipelineSteps.filter(s => s.status === 'completed').length / pipelineSteps.length) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Pipeline Steps */}
          <div className="p-4 space-y-3">
            {pipelineSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3">
                {/* Step Icon */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getStepStatusColor(step.status)}`}>
                  {getStepIcon(step.id, step.status)}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      step.status === 'completed' ? 'text-green-400' :
                      step.status === 'active' ? 'text-blue-400' :
                      step.status === 'error' ? 'text-red-400' :
                      'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                    
                    {/* Progress Percentage */}
                    {step.progress !== undefined && step.progress > 0 && (
                      <span className="text-xs text-gray-500">
                        {step.progress}%
                      </span>
                    )}
                    
                    {/* Timestamp */}
                    {step.timestamp && (
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(step.timestamp)}
                      </span>
                    )}
                    
                    {step.status === 'active' && (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    )}
                  </div>
                  
                  <p className={`text-xs ${
                    step.status === 'completed' ? 'text-green-300/80' :
                    step.status === 'active' ? 'text-blue-300/80' :
                    step.status === 'error' ? 'text-red-300/80' :
                    'text-gray-400'
                  }`}>
                    {getStepDetails(step)}
                  </p>
                  
                  {/* Individual Progress Bar */}
                  {step.progress !== undefined && step.progress > 0 && step.status === 'active' && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-700 rounded-full h-1">
                        <div 
                          className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                {index < pipelineSteps.length - 1 && (
                  <ArrowRight className={`w-3 h-3 ${
                    step.status === 'completed' ? 'text-green-400' :
                    step.status === 'active' ? 'text-blue-400' :
                    step.status === 'error' ? 'text-red-400' :
                    'text-gray-500'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Current Status */}
          <div className="px-4 py-2 bg-surface/30 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                actuallyProcessing ? 'bg-blue-400 animate-pulse' : 
                connected ? 'bg-green-400' : 'bg-gray-400'
              }`}></div>
              <span className="text-xs text-blue-300">
                {actuallyProcessing ? (
                  currentSession?.status ? 
                    `${currentSession.status}: ${pipelineSteps.find(s => s.status === 'active')?.message || 'Processing...'}` :
                    pipelineSteps.find(s => s.status === 'active')?.message || 'Processing...'
                ) : connected ? (
                  'Ready for next request'
                ) : (
                  'Connecting to real-time orchestration...'
                )}
              </span>
            </div>
            
            {/* Session and Log Information */}
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              {currentSession && (
                <div className="truncate">
                  🎯 Agent: {currentSession.agent_used || 'determining...'} • 
                  Execution time: {currentSession.execution_time ? `${currentSession.execution_time.toFixed(1)}s` : 'calculating...'}
                  {currentSession.analysis?.estimated_time && (
                    <span> (est. {currentSession.analysis.estimated_time}s)</span>
                  )}
                </div>
              )}
              
              {totalLogs > 0 && (
                <div className="truncate">
                  📝 Live logs: {totalLogs} entries 
                  {recentLogs.length > 0 && (
                    <span> • Latest: {recentLogs[0].component} - {recentLogs[0].message.substring(0, 30)}...</span>
                  )}
                </div>
              )}
              
              {connectionStatus !== 'connected' && (
                <div className="text-yellow-400">
                  🔄 Connection: {connectionStatus} • Client: {clientId.substring(0, 12)}...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};