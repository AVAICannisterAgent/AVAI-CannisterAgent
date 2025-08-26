import { useState, useEffect, useRef } from "react";

export const useHeartbeatManager = (isTyping: boolean) => {
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | undefined>();
  const [waitingTime, setWaitingTime] = useState(0);
  const waitingStartRef = useRef<Date | null>(null);

  // Update waiting time when typing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTyping) {
      if (!waitingStartRef.current) {
        waitingStartRef.current = new Date();
      }
      
      interval = setInterval(() => {
        if (waitingStartRef.current) {
          const elapsed = Math.floor((Date.now() - waitingStartRef.current.getTime()) / 1000);
          setWaitingTime(elapsed);
        }
      }, 1000);
    } else {
      waitingStartRef.current = null;
      setWaitingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTyping]);

  const updateHeartbeat = (timestamp: Date) => {
    setLastHeartbeat(timestamp);
  };

  return {
    lastHeartbeat,
    waitingTime,
    updateHeartbeat
  };
};
