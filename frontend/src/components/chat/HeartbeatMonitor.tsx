import { useEffect, useState } from "react";
import { Heart, Activity } from "lucide-react";

interface HeartbeatMonitorProps {
  isConnected: boolean;
  isTyping: boolean;
  lastHeartbeat?: Date;
  waitingTime?: number;
}

export const HeartbeatMonitor = ({ 
  isConnected, 
  isTyping, 
  lastHeartbeat, 
  waitingTime = 0 
}: HeartbeatMonitorProps) => {
  const [pulseActive, setPulseActive] = useState(false);
  const [showingHeartbeat, setShowingHeartbeat] = useState(false);

  // Trigger pulse animation every heartbeat
  useEffect(() => {
    if (lastHeartbeat) {
      setPulseActive(true);
      setShowingHeartbeat(true);
      
      // Reset pulse animation after 600ms
      const timer = setTimeout(() => {
        setPulseActive(false);
      }, 600);

      // Hide heartbeat indicator after 2 seconds
      const hideTimer = setTimeout(() => {
        setShowingHeartbeat(false);
      }, 2000);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [lastHeartbeat]);

  // Status colors
  const getStatusColor = () => {
    if (!isConnected) return "text-red-500";
    if (isTyping) return "text-blue-500";
    return "text-green-500";
  };

  const getStatusText = () => {
    if (!isConnected) return "Disconnected";
    if (isTyping) return "AI Processing...";
    return "Connected";
  };

  const formatWaitingTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-surface/50 backdrop-blur-sm rounded-lg border border-border/50">
      {/* Heart Monitor Display */}
      <div className="flex items-center gap-2">
        {/* EKG Line Animation */}
        <div className="relative w-12 h-6 overflow-hidden bg-black/20 rounded">
          <svg 
            className="w-full h-full" 
            viewBox="0 0 48 24" 
            fill="none"
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
                <path d="M 4 0 L 0 0 0 4" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="48" height="24" fill="url(#grid)" className="text-gray-600" />
            
            {/* EKG Line */}
            <path
              d="M2 12 L8 12 L10 8 L12 16 L14 4 L16 20 L18 12 L24 12 L26 8 L28 16 L30 4 L32 20 L34 12 L46 12"
              stroke={isConnected ? (isTyping ? "#3b82f6" : "#10b981") : "#ef4444"}
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="2,1"
              className={`transition-all duration-300 ${
                pulseActive ? 'drop-shadow-glow animate-pulse' : ''
              }`}
              style={{
                filter: pulseActive ? `drop-shadow(0 0 8px ${
                  isConnected ? (isTyping ? "#3b82f6" : "#10b981") : "#ef4444"
                })` : 'none',
                strokeDashoffset: pulseActive ? '0' : '10',
                animation: isConnected ? 'ekg 3s linear infinite' : 'none'
              }}
            />
            
            {/* Moving dot indicator */}
            {isConnected && (
              <circle
                cx="24"
                cy="12"
                r="1.5"
                fill={isTyping ? "#3b82f6" : "#10b981"}
                className={`${pulseActive ? 'animate-ping' : ''}`}
              >
                <animate
                  attributeName="cx"
                  values="8;40;8"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </svg>
        </div>

        {/* Heart Icon */}
        <div className="relative">
          <Heart 
            className={`w-5 h-5 transition-all duration-300 ${getStatusColor()} ${
              pulseActive ? 'scale-125 animate-pulse' : 'scale-100'
            }`}
            fill={isConnected ? "currentColor" : "none"}
          />
          
          {/* Pulse rings */}
          {pulseActive && isConnected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-5 h-5 rounded-full border-2 ${
                isTyping ? 'border-blue-500' : 'border-green-500'
              } animate-ping opacity-75`} />
              <div className={`absolute w-7 h-7 rounded-full border-2 ${
                isTyping ? 'border-blue-500' : 'border-green-500'
              } animate-ping opacity-50`} />
            </div>
          )}
        </div>
      </div>

      {/* Status Text */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          
          {/* Connection indicator */}
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 
              (isTyping ? 'bg-blue-500 animate-pulse' : 'bg-green-500') : 
              'bg-red-500 animate-pulse'
          }`} />
        </div>

        {/* Waiting time / Heartbeat info */}
        {isTyping && waitingTime > 0 && (
          <div className="text-xs text-text-secondary flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>⏳ Still waiting... ({formatWaitingTime(waitingTime)})</span>
          </div>
        )}

        {showingHeartbeat && lastHeartbeat && !isTyping && (
          <div className="text-xs text-text-secondary flex items-center gap-1">
            <Activity className="w-3 h-3 text-green-500" />
            <span>📨 Received: heartbeat</span>
          </div>
        )}
      </div>

      {/* Audit System Label */}
      <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gradient-primary/10 rounded text-xs font-medium text-primary">
        <Activity className="w-3 h-3" />
        <span>Audit System</span>
      </div>
    </div>
  );
};
