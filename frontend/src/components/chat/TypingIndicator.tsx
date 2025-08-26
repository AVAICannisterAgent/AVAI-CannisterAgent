import React from 'react';
import { Stethoscope, ArrowRight, CheckCircle, Clock, Zap, Brain, Database, Link, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useRealTimeLogging } from '../../hooks/useRealTimeLogging';

interface TypingIndicatorProps {
  isTyping?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isTyping = true 
}) => {
  const { 
    connected, 
    pipelineSteps, 
    currentStep, 
    isProcessing, 
    logs,
    lastHeartbeat,
    connectionAttempts
  } = useRealTimeLogging();

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
                  🔗 Live connection • {logs.length} logs received
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
            {logs.length > 0 && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                📝 {logs[0].component}: {logs[0].message.substring(0, 50)}...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};