import { useEffect, useState } from "react";
import { Heart, Activity, Wifi, WifiOff } from "lucide-react";

interface HeartbeatStatusProps {
  isConnected: boolean;
  isTyping: boolean;
  lastHeartbeat?: Date;
  waitingTime?: number;
}

export const HeartbeatStatus = ({ 
  isConnected, 
  isTyping, 
  lastHeartbeat, 
  waitingTime = 0 
}: HeartbeatStatusProps) => {
  const [pulseActive, setPulseActive] = useState(false);

  // Trigger pulse animation on heartbeat
  useEffect(() => {
    if (lastHeartbeat) {
      setPulseActive(true);
      const timer = setTimeout(() => setPulseActive(false), 800);
      return () => clearTimeout(timer);
    }
  }, [lastHeartbeat]);

  const getStatusColor = () => {
    if (!isConnected) return "text-red-400";
    if (isTyping) return "text-blue-400";
    return "text-green-400";
  };

  const getStatusText = () => {
    if (!isConnected) return "Offline";
    if (isTyping) return "Thinking...";
    return "Healthy";
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-surface/30 rounded-lg">
      {/* Connection indicator */}
      <div className="flex items-center gap-1">
        {isConnected ? (
          <Wifi className="w-3 h-3 text-green-400" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-400" />
        )}
      </div>

      {/* Heart with pulse */}
      <div className="relative">
        <Heart 
          className={`w-4 h-4 transition-all duration-300 ${getStatusColor()} ${
            pulseActive ? 'scale-125' : 'scale-100'
          }`}
          fill={isConnected ? "currentColor" : "none"}
        />
        {pulseActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-4 h-4 rounded-full border ${getStatusColor().replace('text-', 'border-')} animate-ping opacity-50`} />
          </div>
        )}
      </div>

      {/* Compact status */}
      <div className="text-xs">
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {isTyping && waitingTime > 0 && (
          <span className="text-text-secondary ml-1">
            ({waitingTime}s)
          </span>
        )}
      </div>

      {/* AVAI badge */}
      <div className="text-xs text-text-secondary">
        <Activity className="w-3 h-3 inline" />
      </div>
    </div>
  );
};
