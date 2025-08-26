import { useState, useEffect } from "react";
import { QueueStatusPanel } from "@/components/queue/QueueStatusPanelSimple";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Activity } from "lucide-react";
import { Link } from "react-router-dom";

export const QueueMonitor = () => {
  const WEBSOCKET_URL = 'wss://websocket.avai.life/ws';
  const { isConnected, isReconnecting, clientId, subscribe, sendMessage } = useWebSocket(WEBSOCKET_URL);
  
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState({
    backend: false,
    redis: false,
    orchestration: false
  });

  // Subscribe to WebSocket events for real-time monitoring
  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      console.log('🔄 Queue Monitor received WebSocket event:', data);
      
      // Add to real-time events log
      setRealtimeEvents(prev => [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: data.type,
          data: data
        },
        ...prev.slice(0, 49) // Keep last 50 events
      ]);

      // Update connection status based on events
      if (data.type === 'log_update' || data.type === 'log_summary') {
        setConnectionStatus(prev => ({ ...prev, orchestration: true }));
      } else if (data.type === 'chat_queued') {
        setConnectionStatus(prev => ({ ...prev, redis: true }));
      } else if (data.type === 'heartbeat') {
        setConnectionStatus(prev => ({ ...prev, backend: true }));
      }
    });

    return unsubscribe;
  }, [subscribe]);

  const formatEventData = (event: any) => {
    const { type, data } = event;
    
    switch (type) {
      case 'log_update':
        return `Log update: ${data.component || 'system'}`;
      case 'chat_queued':
        return `Message queued: ${data.prompt_id || 'unknown'}`;
      case 'ai_response':
        return `AI response: ${data.payload?.response?.substring(0, 50) || 'response'}...`;
      case 'heartbeat':
        return 'System heartbeat';
      case 'log_summary':
        return `Log summary: ${data.total_logs || 0} entries`;
      default:
        return JSON.stringify(data).substring(0, 100);
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'log_update': return 'bg-blue-500';
      case 'chat_queued': return 'bg-yellow-500';
      case 'ai_response': return 'bg-green-500';
      case 'heartbeat': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      case 'log_summary': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Chat
                </Button>
              </Link>
              
              <div className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-blue-500" />
                <h1 className="text-2xl font-bold">AVAI Queue Monitor</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
              </Badge>
              {isReconnecting && (
                <Badge variant="secondary">
                  🔄 Reconnecting...
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Queue Status */}
          <div className="lg:col-span-3">
            <QueueStatusPanel 
              isConnected={isConnected}
              websocketClientId={clientId}
              onSendWebSocketMessage={(message) => {
                console.log('🔄 Queue Monitor sending WebSocket message:', message);
                sendMessage(JSON.stringify(message));
              }}
            />
          </div>

          {/* Real-time Events Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Connection Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Live Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Backend</span>
                    <Badge variant={connectionStatus.backend ? "default" : "secondary"}>
                      {connectionStatus.backend ? "🟢" : "⚪"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Redis</span>
                    <Badge variant={connectionStatus.redis ? "default" : "secondary"}>
                      {connectionStatus.redis ? "🟢" : "⚪"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Orchestration</span>
                    <Badge variant={connectionStatus.orchestration ? "default" : "secondary"}>
                      {connectionStatus.orchestration ? "🟢" : "⚪"}
                    </Badge>
                  </div>
                  
                  {clientId && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground">Client ID</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                        {clientId}
                      </code>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Real-time Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Live Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {realtimeEvents.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Waiting for events...</p>
                      </div>
                    ) : (
                      realtimeEvents.map((event) => (
                        <div key={event.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getEventTypeColor(event.type)}>
                              {event.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">
                            {formatEventData(event)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => window.open('/redis-dashboard.html', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Redis Dashboard
                  </Button>
                  
                  <Link to="/" className="block">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Return to Chat
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
