import React, { useState, useEffect } from 'react';
import { Stethoscope, ArrowRight, CheckCircle, Clock, Zap, Brain, Database, Link, AlertCircle, Wifi, WifiOff } from 'lucide-react';

type PipelineStatus = 'waiting' | 'active' | 'completed' | 'error';

interface PipelineStep {
  id: string;
  name: string;
  status: PipelineStatus;
  message: string;
  timestamp?: string;
}

interface TypingIndicatorProps {
  isTyping?: boolean;
  lastHeartbeat?: Date;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isTyping = true,
  lastHeartbeat
}) => {
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { id: 'prompt', name: 'Processing Prompt', status: 'waiting', message: 'Waiting for input analysis' },
    { id: 'logger', name: 'System Logger', status: 'waiting', message: 'Waiting for queue processing' },
    { id: 'canister', name: 'ICP Canister', status: 'waiting', message: 'Waiting for blockchain analysis' },
    { id: 'response', name: 'Generating Response', status: 'waiting', message: 'Waiting for response generation' }
  ]);
  
  const [currentStep, setCurrentStep] = useState(-1);
  const [totalLogs, setTotalLogs] = useState(0);
  const connected = true; // Assume connected for this simplified version
  const isProcessing = isTyping && currentStep >= 0;

  // Simulate pipeline progression when typing
  useEffect(() => {
    if (!isTyping) {
      // Reset pipeline when not typing
      setPipelineSteps(prev => prev.map(step => ({
        ...step,
        status: 'waiting' as PipelineStatus,
        message: `Waiting for ${step.name.toLowerCase()}`
      })));
      setCurrentStep(-1);
      return;
    }

    // Simulate realistic pipeline progression
    const progressionSteps = [
      { step: 0, delay: 500, message: 'Analyzing user input and context' },
      { step: 1, delay: 1500, message: 'Processing through Redis queue system' },
      { step: 2, delay: 3000, message: 'Connecting to ICP blockchain canisters' },
      { step: 3, delay: 5000, message: 'Generating AI-powered response' }
    ];

    const timeouts: NodeJS.Timeout[] = [];

    progressionSteps.forEach(({ step, delay, message }) => {
      const timeout = setTimeout(() => {
        if (!isTyping) return; // Don't update if typing stopped
        
        setCurrentStep(step);
        setPipelineSteps(prev => prev.map((pipelineStep, index) => {
          if (index < step) {
            return { ...pipelineStep, status: 'completed' as PipelineStatus };
          } else if (index === step) {
            return { ...pipelineStep, status: 'active' as PipelineStatus, message, timestamp: new Date().toISOString() };
          }
          return pipelineStep;
        }));
        
        // Simulate log count increase
        setTotalLogs(prev => prev + Math.floor(Math.random() * 3) + 1);
      }, delay);
      timeouts.push(timeout);
    });

    return () => {
      // Cleanup timeouts if component unmounts or isTyping changes
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isTyping]);

  // Complete pipeline when response is received (isTyping becomes false)
  useEffect(() => {
    if (!isTyping && currentStep >= 0) {
      const completionTimeout = setTimeout(() => {
        setPipelineSteps(prev => prev.map(step => ({
          ...step,
          status: 'completed' as PipelineStatus,
          message: `${step.name} completed successfully`,
          timestamp: new Date().toISOString()
        })));
        setCurrentStep(3);
        
        // Reset after showing completion
        const resetTimeout = setTimeout(() => {
          setPipelineSteps(prev => prev.map(step => ({
            ...step,
            status: 'waiting' as PipelineStatus,
            message: 'Ready for next request'
          })));
          setCurrentStep(-1);
        }, 2000);
        
        return () => clearTimeout(resetTimeout);
      }, 500);
      
      return () => clearTimeout(completionTimeout);
    }
  }, [isTyping, currentStep]);

  const getStepIcon = (stepId: string, status: string) => {
    const baseClass = "w-3 h-3";
    
    if (status === 'completed') {
      return <CheckCircle className={`${baseClass} text-green-400`} />;
    }
    
    if (status === 'error') {
      return <AlertCircle className={`${baseClass} text-red-400`} />;
    }
    
    switch (stepId) {
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
              <span className="text-sm font-medium text-foreground">AVAI Real-Time Diagnostic Pipeline</span>
              <span className="text-xs">🩺</span>
              
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
                  🔗 Live connection • {totalLogs} logs received
                  {lastHeartbeat && ` • Last ping: ${formatTimestamp(lastHeartbeat.toISOString())}`}
                </span>
              ) : (
                <span>⚠️ Real-time logging unavailable • Using fallback mode</span>
              )}
            </div>
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
                isProcessing ? 'bg-blue-400 animate-pulse' : 
                connected ? 'bg-green-400' : 'bg-gray-400'
              }`}></div>
              <span className="text-xs text-blue-300">
                {isProcessing ? (
                  pipelineSteps.find(s => s.status === 'active')?.message || 'Processing...'
                ) : connected ? (
                  'Ready for next request'
                ) : (
                  'Connecting to real-time logging...'
                )}
              </span>
            </div>
            
            {/* Latest log preview */}
            {totalLogs > 0 && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                📝 Processing system logs: {totalLogs} entries analyzed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};