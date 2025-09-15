import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Activity,
    AlertTriangle,
    Brain,
    Bug,
    CheckCircle,
    Code,
    Copy,
    Download,
    FileText,
    Globe,
    Info,
    Play,
    Server,
    Shield,
    Trash2,
    Wifi,
    WifiOff,
    XCircle,
    Zap
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface LogEntry {
    id: string;
    timestamp: string;
    type: string;
    level?: string;
    message: string;
    category?: string;
    data?: any;
}

interface AnalysisStats {
    totalResponses: number;
    analysisTypes: Record<string, number>;
    responseTypes: Record<string, number>;
    duration: string;
    status: 'idle' | 'connecting' | 'analyzing' | 'complete' | 'error';
}

const AILogsDashboard: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [wsEndpoint, setWsEndpoint] = useState('wss://websocket.avai.life/ws');
    const [currentAnalysis, setCurrentAnalysis] = useState('');
    const [analysisType, setAnalysisType] = useState('code_quality');
    const [customPrompt, setCustomPrompt] = useState('');
    const [stats, setStats] = useState<AnalysisStats>({
        totalResponses: 0,
        analysisTypes: {},
        responseTypes: {},
        duration: '0s',
        status: 'idle'
    });

    const wsRef = useRef<WebSocket | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const startTimeRef = useRef<number>(0);

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    const getLogIcon = (type: string, level?: string) => {
        if (level) {
            switch (level.toLowerCase()) {
                case 'debug': return <Bug className="h-4 w-4 text-blue-500" />;
                case 'info': return <Info className="h-4 w-4 text-blue-600" />;
                case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
                case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
                case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
                default: return <Info className="h-4 w-4 text-gray-500" />;
            }
        }

        switch (type) {
            case 'connection': return <Wifi className="h-4 w-4 text-green-500" />;
            case 'analysis_start': return <Play className="h-4 w-4 text-blue-500" />;
            case 'analysis_complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Activity className="h-4 w-4 text-gray-500" />;
        }
    };

    const getLogBadgeVariant = (type: string, level?: string) => {
        if (level) {
            switch (level.toLowerCase()) {
                case 'debug': return 'secondary';
                case 'info': return 'default';
                case 'warning': return 'destructive';
                case 'error': return 'destructive';
                case 'success': return 'default';
                default: return 'secondary';
            }
        }

        switch (type) {
            case 'connection': return 'default';
            case 'analysis_start': return 'default';
            case 'analysis_complete': return 'default';
            case 'error': return 'destructive';
            default: return 'secondary';
        }
    };

    const connectWebSocket = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        setStats(prev => ({ ...prev, status: 'connecting' }));

        try {
            wsRef.current = new WebSocket(wsEndpoint);

            wsRef.current.onopen = () => {
                setIsConnected(true);
                setStats(prev => ({ ...prev, status: 'idle' }));
                addLog('connection', 'Connected to AI Analysis Server', 'info');
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const logEntry: LogEntry = {
                        id: Date.now().toString() + Math.random(),
                        timestamp: new Date().toISOString(),
                        type: data.type || 'message',
                        level: data.level,
                        message: data.message || JSON.stringify(data),
                        data: data
                    };

                    setLogs(prev => [...prev, logEntry]);
                    updateStats(logEntry);

                    // Handle analysis lifecycle
                    if (data.type === 'analysis_start') {
                        setIsAnalyzing(true);
                        startTimeRef.current = Date.now();
                        setStats(prev => ({ ...prev, status: 'analyzing' }));
                    } else if (data.type === 'analysis_complete') {
                        setIsAnalyzing(false);
                        const duration = Date.now() - startTimeRef.current;
                        setStats(prev => ({
                            ...prev,
                            status: 'complete',
                            duration: `${(duration / 1000).toFixed(1)}s`
                        }));
                    }
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                    addLog('error', `Failed to parse message: ${event.data}`, 'error');
                }
            };

            wsRef.current.onclose = () => {
                setIsConnected(false);
                setIsAnalyzing(false);
                setStats(prev => ({ ...prev, status: 'idle' }));
                addLog('connection', 'Disconnected from AI Analysis Server', 'warning');
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setStats(prev => ({ ...prev, status: 'error' }));
                addLog('error', 'WebSocket connection error', 'error');
            };
        } catch (error) {
            console.error('Failed to connect:', error);
            setStats(prev => ({ ...prev, status: 'error' }));
            addLog('error', `Connection failed: ${error}`, 'error');
        }
    }, [wsEndpoint]);

    const disconnect = () => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
        setIsAnalyzing(false);
    };

    const addLog = (type: string, message: string, level?: string) => {
        const logEntry: LogEntry = {
            id: Date.now().toString() + Math.random(),
            timestamp: new Date().toISOString(),
            type,
            level,
            message
        };
        setLogs(prev => [...prev, logEntry]);
        updateStats(logEntry);
    };

    const updateStats = (logEntry: LogEntry) => {
        setStats(prev => ({
            ...prev,
            totalResponses: prev.totalResponses + 1,
            responseTypes: {
                ...prev.responseTypes,
                [logEntry.type]: (prev.responseTypes[logEntry.type] || 0) + 1
            }
        }));
    };

    const clearLogs = () => {
        setLogs([]);
        setStats({
            totalResponses: 0,
            analysisTypes: {},
            responseTypes: {},
            duration: '0s',
            status: 'idle'
        });
    };

    const sendAnalysisRequest = () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            addLog('error', 'Not connected to WebSocket server', 'error');
            return;
        }

        const analysisPrompts = {
            code_quality: `Analyze the code quality of this AVAI-CannisterAgent repository. Focus on:
1. Python code structure and organization
2. Docker configuration quality
3. WebSocket implementation patterns
4. Error handling and logging
5. Code documentation and comments
6. Best practices adherence

Provide specific examples and recommendations for improvement.`,

            security_audit: `Conduct a thorough security audit of the AVAI-CannisterAgent repository:
1. WebSocket security (authentication, input validation, rate limiting)
2. Docker security (container isolation, secrets management)
3. API security (endpoint protection, data sanitization)
4. Network security (Cloudflare tunnel configuration)
5. Code security (injection vulnerabilities, unsafe practices)
6. Dependency security (package vulnerabilities)
7. Configuration security (exposed credentials, hardcoded secrets)

Identify specific security risks and provide remediation steps.`,

            architecture: `Perform a comprehensive architecture analysis of the AVAI-CannisterAgent system:
1. System architecture overview (Docker containers, services, networking)
2. Data flow between components (WebSocket → AI → Motoko → Cloudflare)
3. Scalability considerations and bottlenecks
4. Integration patterns and dependencies
5. Deployment architecture (local vs production)
6. Security architecture and access controls

Evaluate the overall system design and suggest architectural improvements.`,

            performance: `Analyze the performance characteristics of the AVAI-CannisterAgent system:
1. WebSocket performance (latency, throughput, connection handling)
2. AI processing performance (response times, resource usage)
3. Docker container performance (resource allocation, startup times)
4. Network performance (tunnel latency, bandwidth optimization)
5. Database/Redis performance (caching efficiency, query optimization)
6. Memory and CPU usage patterns
7. Scalability limits and performance bottlenecks

Provide specific performance metrics and optimization recommendations.`,

            custom: customPrompt
        };

        const prompt = analysisPrompts[analysisType as keyof typeof analysisPrompts] || customPrompt;

        const request = {
            type: 'analysis_request',
            prompt: prompt,
            source: 'ai_dashboard',
            analysis_type: analysisType,
            repo_context: 'AVAI-CannisterAgent - AI agent system with WebSocket, Docker, and Motoko integration'
        };

        wsRef.current.send(JSON.stringify(request));
        setCurrentAnalysis(analysisType);
        addLog('request', `Started ${analysisType.replace('_', ' ')} analysis`, 'info');
    };

    const exportLogs = () => {
        const logsData = {
            timestamp: new Date().toISOString(),
            endpoint: wsEndpoint,
            stats,
            logs: logs
        };

        const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyLogsToClipboard = async () => {
        const logsText = logs.map(log =>
            `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
        ).join('\n');

        try {
            await navigator.clipboard.writeText(logsText);
            addLog('info', 'Logs copied to clipboard', 'success');
        } catch (error) {
            addLog('error', 'Failed to copy logs to clipboard', 'error');
        }
    };

    const getStatusColor = () => {
        switch (stats.status) {
            case 'idle': return 'text-gray-500';
            case 'connecting': return 'text-yellow-500';
            case 'analyzing': return 'text-blue-500';
            case 'complete': return 'text-green-500';
            case 'error': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Brain className="h-8 w-8 text-blue-600" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">AI Analysis Dashboard</h1>
                                <p className="text-gray-600">Real-time AI processing logs and responses</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Badge
                                variant={isConnected ? "default" : "destructive"}
                                className="flex items-center space-x-1"
                            >
                                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                            </Badge>

                            <Badge className={`${getStatusColor()}`}>
                                {stats.status.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Connection Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Server className="h-5 w-5" />
                            <span>Connection Settings</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <Select value={wsEndpoint} onValueChange={setWsEndpoint}>
                                <SelectTrigger className="w-64">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="wss://websocket.avai.life/ws">
                                        <div className="flex items-center space-x-2">
                                            <Globe className="h-4 w-4" />
                                            <span>Production (websocket.avai.life)</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="ws://localhost:8765">
                                        <div className="flex items-center space-x-2">
                                            <Server className="h-4 w-4" />
                                            <span>Local (localhost:8765)</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                onClick={connectWebSocket}
                                disabled={isConnected}
                                className="flex items-center space-x-2"
                            >
                                <Wifi className="h-4 w-4" />
                                <span>Connect</span>
                            </Button>

                            <Button
                                variant="outline"
                                onClick={disconnect}
                                disabled={!isConnected}
                                className="flex items-center space-x-2"
                            >
                                <WifiOff className="h-4 w-4" />
                                <span>Disconnect</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Analysis Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Brain className="h-5 w-5" />
                            <span>AI Analysis Controls</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <Select value={analysisType} onValueChange={setAnalysisType}>
                                    <SelectTrigger className="w-64">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="code_quality">
                                            <div className="flex items-center space-x-2">
                                                <Code className="h-4 w-4" />
                                                <span>Code Quality Analysis</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="security_audit">
                                            <div className="flex items-center space-x-2">
                                                <Shield className="h-4 w-4" />
                                                <span>Security Audit</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="architecture">
                                            <div className="flex items-center space-x-2">
                                                <Activity className="h-4 w-4" />
                                                <span>Architecture Analysis</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="performance">
                                            <div className="flex items-center space-x-2">
                                                <Zap className="h-4 w-4" />
                                                <span>Performance Analysis</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="custom">
                                            <div className="flex items-center space-x-2">
                                                <FileText className="h-4 w-4" />
                                                <span>Custom Prompt</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button
                                    onClick={sendAnalysisRequest}
                                    disabled={!isConnected || isAnalyzing}
                                    className="flex items-center space-x-2"
                                >
                                    <Play className="h-4 w-4" />
                                    <span>Start Analysis</span>
                                </Button>

                                {isAnalyzing && (
                                    <Badge variant="secondary" className="flex items-center space-x-1">
                                        <Activity className="h-3 w-3 animate-pulse" />
                                        <span>Analyzing...</span>
                                    </Badge>
                                )}
                            </div>

                            {analysisType === 'custom' && (
                                <Textarea
                                    placeholder="Enter your custom analysis prompt..."
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Responses</p>
                                    <p className="text-2xl font-bold">{stats.totalResponses}</p>
                                </div>
                                <Activity className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Analysis Duration</p>
                                    <p className="text-2xl font-bold">{stats.duration}</p>
                                </div>
                                <Zap className="h-8 w-8 text-yellow-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Log Entries</p>
                                    <p className="text-2xl font-bold">{logs.length}</p>
                                </div>
                                <FileText className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Status</p>
                                    <p className={`text-lg font-bold ${getStatusColor()}`}>
                                        {stats.status.toUpperCase()}
                                    </p>
                                </div>
                                <Brain className="h-8 w-8 text-purple-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Logs Section */}
                <Card className="flex-1">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                                <FileText className="h-5 w-5" />
                                <span>AI Processing Logs</span>
                            </CardTitle>

                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyLogsToClipboard}
                                    className="flex items-center space-x-1"
                                >
                                    <Copy className="h-3 w-3" />
                                    <span>Copy</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={exportLogs}
                                    className="flex items-center space-x-1"
                                >
                                    <Download className="h-3 w-3" />
                                    <span>Export</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearLogs}
                                    className="flex items-center space-x-1"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Clear</span>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <ScrollArea className="h-[600px] w-full rounded-md border p-4">
                            {logs.length === 0 ? (
                                <div className="flex items-center justify-center h-32 text-gray-500">
                                    <div className="text-center">
                                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No logs yet. Connect and start an analysis to see real-time AI processing.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {logs.map((log) => (
                                        <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getLogIcon(log.type, log.level)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <Badge
                                                        variant={getLogBadgeVariant(log.type, log.level)}
                                                        className="text-xs"
                                                    >
                                                        {log.level || log.type}
                                                    </Badge>

                                                    <span className="text-xs text-gray-500">
                                                        {new Date(log.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-900 break-words">
                                                    {log.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AILogsDashboard;