import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RotateCcw,
  Database,
  MessageSquare,
  Eye,
  BarChart3,
  Users,
  Zap
} from "lucide-react";

interface QueueStatus {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

interface QueueTask {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  timestamp: string;
  metadata?: {
    source?: string;
    from?: string;
    type?: string;
    estimated_time?: number;
    progress?: number;
  };
}

interface OrchestrationEvent {
  id: string;
  task_id: string;
  event_type: string;
  timestamp: string;
  data: any;
}

interface QueueStatusPanelProps {
  isConnected: boolean;
  websocketClientId?: string;
}

export const QueueStatusPanel = ({ isConnected, websocketClientId }: QueueStatusPanelProps) => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0
  });
  
  const [recentTasks, setRecentTasks] = useState<QueueTask[]>([]);
  const [orchestrationEvents, setOrchestrationEvents] = useState<OrchestrationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Mock data for demonstration (since the backend API might not be fully implemented)
  const mockQueueStatus: QueueStatus = {
    pending: 3,
    processing: 2,
    completed: 147,
    failed: 1,
    total: 153
  };

  const mockRecentTasks: QueueTask[] = [
    {
      id: "prompt_1756237198981_267194867",
      prompt: "Can you explain what Internet Computer Protocol (ICP) canisters are and how they work?",
      status: "processing",
      priority: 8,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      metadata: {
        source: "websocket_chat",
        from: "frontend_client",
        type: "chat",
        estimated_time: 45,
        progress: 65
      }
    },
    {
      id: "prompt_1756237156432_891234567",
      prompt: "How do I deploy a smart contract on the Internet Computer?",
      status: "completed",
      priority: 7,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      metadata: {
        source: "websocket_chat",
        from: "frontend_client",
        type: "chat"
      }
    },
    {
      id: "prompt_1756237098765_456789123",
      prompt: "What are the benefits of using ICP over Ethereum?",
      status: "pending",
      priority: 6,
      timestamp: new Date(Date.now() - 900000).toISOString(),
      metadata: {
        source: "websocket_chat",
        from: "test_client",
        type: "chat"
      }
    }
  ];

  const mockOrchestrationEvents: OrchestrationEvent[] = [
    {
      id: "event_001",
      task_id: "prompt_1756237198981_267194867",
      event_type: "orchestration_progress",
      timestamp: new Date(Date.now() - 30000).toISOString(),
      data: {
        progress: 65,
        current_step: "web_search",
        agent: "browser_agent",
        phase: "research"
      }
    },
    {
      id: "event_002",
      task_id: "prompt_1756237156432_891234567",
      event_type: "orchestration_complete",
      timestamp: new Date(Date.now() - 120000).toISOString(),
      data: {
        response: "Successfully completed analysis of smart contract deployment",
        total_time: 43,
        agent: "code_agent"
      }
    }
  ];

  // Fetch queue status from backend
  const fetchQueueStatus = async () => {
    setIsLoading(true);
    try {
      // Use the existing tunnel infrastructure
      const API_BASE = 'https://api.avai.life';
      
      // Fetch queue status
      try {
        const response = await fetch(`${API_BASE}/api/queue/status`);
        if (response.ok) {
          const data = await response.json();
          setQueueStatus(data);
        } else {
          throw new Error('API not available');
        }
      } catch (e) {
        console.log('Using mock queue status (API not available)');
        setQueueStatus(mockQueueStatus);
      }

      // Fetch recent tasks
      try {
        const response = await fetch(`${API_BASE}/api/queue/tasks?limit=10`);
        if (response.ok) {
          const data = await response.json();
          setRecentTasks(data.tasks || []);
        } else {
          throw new Error('API not available');
        }
      } catch (e) {
        console.log('Using mock tasks (API not available)');
        setRecentTasks(mockRecentTasks);
      }

      // Mock orchestration events (these will come via WebSocket in real implementation)
      setOrchestrationEvents(mockOrchestrationEvents);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Activity className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getTotalProgress = () => {
    if (queueStatus.total === 0) return 0;
    return Math.round((queueStatus.completed / queueStatus.total) * 100);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Queue Monitor</h2>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <Button 
          onClick={fetchQueueStatus} 
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          <RotateCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{queueStatus.pending}</p>
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
                <p className="text-2xl font-bold">{queueStatus.processing}</p>
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
                <p className="text-2xl font-bold">{queueStatus.completed}</p>
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
                <p className="text-2xl font-bold">{queueStatus.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{queueStatus.total}</p>
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
              {queueStatus.completed} of {queueStatus.total} tasks completed
              {lastUpdate && ` • Last updated: ${formatTimestamp(lastUpdate.toISOString())}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Recent Tasks
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Orchestration Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Queue Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {task.id.split('_')[1]}...
                        </code>
                        <Badge variant="outline">Priority: {task.priority}</Badge>
                        {task.metadata?.source && (
                          <Badge variant="secondary">{task.metadata.source}</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm mb-2">
                        {task.prompt.length > 100 
                          ? `${task.prompt.substring(0, 100)}...` 
                          : task.prompt
                        }
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatTimestamp(task.timestamp)}</span>
                        {task.metadata?.from && (
                          <span>From: {task.metadata.from}</span>
                        )}
                        {task.status === 'processing' && task.metadata?.progress && (
                          <div className="flex items-center gap-2">
                            <Progress value={task.metadata.progress} className="w-20 h-1" />
                            <span>{task.metadata.progress}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {recentTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent tasks found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orchestration Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orchestrationEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{event.event_type}</Badge>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {event.task_id.split('_')[1]}...
                        </code>
                      </div>
                      
                      <div className="text-sm mb-2">
                        {event.event_type === 'orchestration_progress' && (
                          <div className="space-y-1">
                            <p>Progress: {event.data.progress}% - {event.data.current_step}</p>
                            {event.data.agent && (
                              <p className="text-muted-foreground">Agent: {event.data.agent}</p>
                            )}
                          </div>
                        )}
                        
                        {event.event_type === 'orchestration_complete' && (
                          <div className="space-y-1">
                            <p className="text-green-600">✅ Completed successfully</p>
                            {event.data.total_time && (
                              <p className="text-muted-foreground">Time: {event.data.total_time}s</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {orchestrationEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No orchestration events found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Client Info */}
      {websocketClientId && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>WebSocket Client ID: </span>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                {websocketClientId}
              </code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
