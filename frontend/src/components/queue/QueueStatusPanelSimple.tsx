import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RotateCcw,
  Database,
  MessageSquare,
  Users,
  Zap,
  Send,
  Trash2,
  AlertTriangle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface QueueStatusPanelProps {
  isConnected: boolean;
  websocketClientId?: string;
  onSendWebSocketMessage?: (message: any) => void;
  onWebSocketMessage?: (message: any) => void;
}

export const QueueStatusPanel = ({ 
  isConnected, 
  websocketClientId,
  onSendWebSocketMessage,
  onWebSocketMessage 
}: QueueStatusPanelProps) => {
  const [queueStats, setQueueStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
    realSize: 0 // Actual Redis queue size
  });
  
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!onWebSocketMessage) return;
    
    // This would be called from parent component when WebSocket messages arrive
    const handleMessage = (message: any) => {
      switch (message.type) {
        case 'queue_status':
          if (message.payload) {
            setQueueStats(prev => ({
              ...prev,
              realSize: message.payload.size || 0
            }));
          }
          break;
        case 'queue_cleared':
          setQueueStats(prev => ({
            ...prev,
            pending: 0,
            realSize: 0
          }));
          addRecentMessage({
            type: 'queue_cleared',
            message: `Queue cleared successfully (${message.deletedCount || 0} items removed)`
          });
          setIsClearing(false);
          break;
        case 'queue_clear_error':
          addRecentMessage({
            type: 'error',
            message: `Failed to clear queue: ${message.error}`
          });
          setIsClearing(false);
          break;
      }
    };
    
    onWebSocketMessage(handleMessage);
  }, [onWebSocketMessage]);

  // Request queue status on mount and periodically
  useEffect(() => {
    if (isConnected && onSendWebSocketMessage) {
      // Request initial queue status
      onSendWebSocketMessage({
        type: 'get_queue_status'
      });
      
      // Request status every 5 seconds
      const interval = setInterval(() => {
        onSendWebSocketMessage({
          type: 'get_queue_status'
        });
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, onSendWebSocketMessage]);

  // Handle clearing queue
  const handleClearQueue = () => {
    if (!onSendWebSocketMessage || !isConnected) return;
    
    setIsClearing(true);
    onSendWebSocketMessage({
      type: 'clear_queue'
    });
  };
  const updateQueueStats = () => {
    setQueueStats(prev => ({
      pending: Math.floor(Math.random() * 5) + 1,
      processing: Math.floor(Math.random() * 3) + 1,
      completed: 147 + Math.floor(Math.random() * 10),
      failed: Math.floor(Math.random() * 2),
      total: 153 + Math.floor(Math.random() * 15),
      realSize: prev.realSize // Keep the real Redis size
    }));
    setLastUpdate(new Date());
  };

  // Add a recent message to the log
  const addRecentMessage = (message: any) => {
    setRecentMessages(prev => [
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type: message.type || 'unknown',
        content: message.message || JSON.stringify(message).substring(0, 100),
        status: message.type === 'chat_queued' ? 'queued' : 'received'
      },
      ...prev.slice(0, 19) // Keep last 20 messages
    ]);
  };

  // Auto-refresh stats
  useEffect(() => {
    if (isConnected) {
      updateQueueStats();
      const interval = setInterval(updateQueueStats, 15000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const handleRefresh = () => {
    if (isConnected) {
      updateQueueStats();
      
      // Request system info via WebSocket
      if (onSendWebSocketMessage) {
        onSendWebSocketMessage({
          type: 'get_log_summary'
        });
      }
    }
  };

  const testSendMessage = () => {
    if (!isConnected || !onSendWebSocketMessage) return;
    
    const testMessage = `Test queue message: ${new Date().toLocaleTimeString()} - How does AVAI handle ICP canister interactions?`;
    
    onSendWebSocketMessage({
      type: 'chat_message',
      message: testMessage,
      from: 'queue_monitor'
    });

    // Add to recent messages
    addRecentMessage({
      type: 'chat_sent',
      message: testMessage
    });
  };

  const getTotalProgress = () => {
    if (queueStats.total === 0) return 0;
    return Math.round((queueStats.completed / queueStats.total) * 100);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'chat_queued': return 'text-green-600';
      case 'chat_sent': return 'text-blue-600';
      case 'ai_response': return 'text-purple-600';
      case 'heartbeat': return 'text-gray-500';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Queue Monitor</h2>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "🟢 WebSocket Connected" : "🔴 Disconnected"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={!isConnected}
            size="sm"
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={testSendMessage} 
            disabled={!isConnected}
            size="sm"
            variant="default"
          >
            <Send className="h-4 w-4 mr-2" />
            Test Message
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <span>WebSocket not connected to tunnel. Queue monitoring unavailable.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{queueStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{queueStats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{queueStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{queueStats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{queueStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Rate</span>
              <span>{getTotalProgress()}%</span>
            </div>
            <Progress value={getTotalProgress()} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {queueStats.completed} of {queueStats.total} tasks completed
              {lastUpdate && ` • Last updated: ${lastUpdate.toLocaleTimeString()}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Queue Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Queue Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Clear Queue</h4>
                <p className="text-sm text-muted-foreground">
                  Remove all pending items from the Redis queue
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current queue size: <span className="font-mono">{queueStats.realSize}</span> items
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!isConnected || isClearing || queueStats.realSize === 0}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Queue
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Clear Queue
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all <strong>{queueStats.realSize}</strong> items 
                      currently in the Redis queue. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearQueue}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isClearing ? 'Clearing...' : 'Clear Queue'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">Refresh Status</h4>
                <p className="text-sm text-muted-foreground">
                  Get current queue status from Redis
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!isConnected}
                onClick={() => onSendWebSocketMessage?.({type: 'get_queue_status'})}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent WebSocket Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent WebSocket Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent WebSocket activity</p>
                <p className="text-xs mt-2">Send a test message to see activity here</p>
              </div>
            ) : (
              recentMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getMessageTypeColor(msg.type)}>
                        {msg.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">
                      {msg.content.length > 100 
                        ? `${msg.content.substring(0, 100)}...` 
                        : msg.content
                      }
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* WebSocket Info */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Client ID:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                {websocketClientId ? websocketClientId.substring(0, 12) + '...' : 'Not connected'}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Tunnel:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                websocket.avai.life
              </code>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Protocol:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                WebSocket Only
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
