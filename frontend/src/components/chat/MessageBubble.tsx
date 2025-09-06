import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Terminal, FileText, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Message, FileAttachment } from "./ChatLayout";
import { FileCard } from "./FileCard";
import { useState, useEffect } from "react";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  onFileClick: (files: FileAttachment[]) => void;
  hideAnalysisContent?: boolean; // Add prop to hide analysis content when StreamingAnalysisDisplay is active
}

const AnalysisLogs = ({ content }: { content: string }) => {
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  
  // Sample logs based on real AVAI system
  const logs = [
    { time: "19:52:15.807", level: "INFO", component: "Vision Learning", message: "🧠 Vision Learning System initialized" },
    { time: "19:52:15.808", level: "INFO", component: "Loop Detection", message: "🔄 Loop Detection Engine initialized with adaptive thresholds" },
    { time: "19:52:16.579", level: "INFO", component: "LLM Core", message: "🚀 Initialized Unified Ollama Provider: dolphin-llama3" },
    { time: "19:52:16.580", level: "INFO", component: "LLM Manager", message: "🧠 UnifiedLLMManager: Primary LLM initialized successfully" },
    { time: "19:52:18.662", level: "INFO", component: "GPU Detector", message: "✅ CUDA detected via PyTorch" },
    { time: "19:52:18.663", level: "INFO", component: "GPU Manager", message: "🚀 GPU Manager initialized - CUDA: True, Devices: 1" },
    { time: "19:52:18.733", level: "INFO", component: "Vision Processing", message: "🚀 CUDA enabled for vision processing via GPU Manager" },
    { time: "19:52:18.739", level: "INFO", component: "Navigation", message: "🧠 Human-Like Navigation Manager initialized (Session: cb02287a)" },
    { time: "19:52:18.835", level: "INFO", component: "Browser Tool", message: "🥷 Browser Use Tool now uses ENHANCED stealth mode with anti-bot detection bypass" },
    { time: "19:52:19.327", level: "DEBUG", component: "Web Search", message: "✅ Auto-registered web_search tool in ToolCollection" },
    { time: "19:52:19.516", level: "INFO", component: "Data Collection", message: "🏗️ Centralized Data Collection Manager initialized" },
    { time: "19:52:19.553", level: "INFO", component: "Vision Manager", message: "👁️ Global Vision Manager: Using unified LLM" },
    { time: "19:52:19.960", level: "INFO", component: "Content Extraction", message: "🧠 Initialized LLM-powered content extraction with scoring" },
    { time: "19:52:19.961", level: "INFO", component: "Vision System", message: "👁️ Initialized VISION-FIRST extraction system (10x faster than DOM)" },
    { time: "19:52:19.966", level: "INFO", component: "Canister Agent", message: "🕯️ Modular CanisterAgent initialized with Redis/WebSocket integration" },
    { time: "19:52:20.150", level: "INFO", component: "Repository Scanner", message: "🔍 Scanning repository: https://github.com/mrarejimmyz/MockRepoForDemo" },
    { time: "19:52:20.320", level: "INFO", component: "File Discovery", message: "📋 Found 8 files: src/, dfx.json, package.json, webpack.config.js..." },
    { time: "19:52:20.450", level: "INFO", component: "Language Detection", message: "📊 Language composition: JavaScript 81.6%, Motoko 9.1%, Makefile 8.0%" },
    { time: "19:52:20.680", level: "WARN", component: "Security Scanner", message: "🚨 CRITICAL: Unverified Query Responses detected in Motoko backend" },
    { time: "19:52:20.720", level: "WARN", component: "Security Scanner", message: "❌ HIGH: Missing HTTP Asset Certification for frontend" },
    { time: "19:52:20.890", level: "WARN", component: "Dependency Scanner", message: "⚠️ MEDIUM: 3 vulnerable packages detected in package.json" },
    { time: "19:52:21.100", level: "INFO", component: "Code Quality", message: "📊 Code Quality Score: 73/100 - 8 error handling issues found" },
    { time: "19:52:21.250", level: "INFO", component: "Architecture", message: "🏛️ Architecture Assessment: Monolithic frontend design detected" },
    { time: "19:52:21.400", level: "INFO", component: "IC Analysis", message: "🌐 IC Security Compliance: 38/100 - Missing stable variables" },
    { time: "19:52:21.580", level: "SUCCESS", component: "Analysis Complete", message: "✅ Analysis completed - 6 vulnerabilities found (2 Critical, 2 High, 2 Medium)" }
  ];

  useEffect(() => {
    if (currentLogIndex < logs.length - 1) {
      const timer = setTimeout(() => {
        setCurrentLogIndex(currentLogIndex + 1);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setIsAnalyzing(false);
    }
  }, [currentLogIndex, logs.length]);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'SUCCESS': return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'WARN': return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
      case 'ERROR': return <XCircle className="w-3 h-3 text-red-400" />;
      default: return <Terminal className="w-3 h-3 text-blue-400" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'text-green-400';
      case 'WARN': return 'text-yellow-400';
      case 'ERROR': return 'text-red-400';
      case 'DEBUG': return 'text-gray-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div 
      className="bg-gray-900 rounded-lg p-4 font-mono text-sm scrollbar-custom scrollbar-always"
      style={{
        maxHeight: '300px',
        overflowY: 'scroll',
        overflowX: 'hidden',
        border: '1px solid hsl(var(--border))'
      }}
    >
      <div className="flex items-center gap-2 mb-3 text-green-400 sticky top-0 bg-gray-900 pb-2 border-b border-gray-700">
        <Terminal className="w-4 h-4" />
        <span className="font-semibold">AVAI Security Analysis Engine v2.1.3</span>
        {isAnalyzing && <div className="animate-pulse">●</div>}
      </div>
      
      <div className="space-y-1 pb-2">
        {logs.slice(0, currentLogIndex + 1).map((log, index) => (
          <div key={index} className="flex items-start gap-2 opacity-0 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            {getLogIcon(log.level)}
            <span className="text-gray-500 text-xs min-w-[80px]">[{log.time}]</span>
            <span className={`text-xs font-medium min-w-[120px] ${getLogColor(log.level)}`}>{log.component}:</span>
            <span className="text-gray-300 text-xs flex-1">{log.message}</span>
          </div>
        ))}
        
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-blue-400 animate-pulse">
            <Terminal className="w-3 h-3" />
            <span className="text-xs">Analyzing repository structure and dependencies...</span>
          </div>
        )}
      </div>
      
      {!isAnalyzing && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded text-green-400 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold">Analysis Complete</span>
          </div>
          <div className="mt-1 text-gray-300">
            📊 6 vulnerabilities found • 🕒 Duration: 2.188 seconds • 📁 Files: 8
          </div>
        </div>
      )}
    </div>
  );
};

const AnalysisReport = ({ content }: { content: string }) => {
  const [showFullReport, setShowFullReport] = useState(false);
  
  const vulnerabilities = [
    { severity: "CRITICAL", title: "Unverified Query Responses", location: "src/motoko_backend/*.mo", cvss: "9.2" },
    { severity: "CRITICAL", title: "Missing HTTP Asset Certification", location: "Frontend deployment", cvss: "8.8" },
    { severity: "HIGH", title: "Vulnerable Dependencies", location: "package.json", cvss: "7.5" },
    { severity: "HIGH", title: "Missing Input Validation", location: "CRUD operations", cvss: "7.2" },
    { severity: "MEDIUM", title: "No Access Control", location: "Canister methods", cvss: "6.5" },
    { severity: "MEDIUM", title: "Integer Overflow Risk", location: "Motoko arithmetic", cvss: "6.1" }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'HIGH': return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      default: return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
    }
  };

  return (
    <div 
      className="bg-gray-900 rounded-lg p-6 space-y-6 scrollbar-custom scrollbar-always"
      style={{
        maxHeight: '400px',
        overflowY: 'scroll',
        overflowX: 'hidden',
        border: '1px solid hsl(var(--border))'
      }}
    >
      {/* Header - Sticky */}
      <div className="border-b border-gray-700 pb-4 sticky top-0 bg-gray-900 z-10">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Comprehensive Security Audit Report</h3>
        </div>
        <p className="text-gray-400 text-sm">MockRepoForDemo - Internet Computer CRUD Application</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span>Session: ef661993</span>
          <span>Duration: 2.188s</span>
          <span>Files: 8</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="space-y-6 pb-4">
        {/* Overall Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-1">68/100</div>
            <div className="text-sm text-gray-400">Overall Security Score</div>
            <div className="text-xs text-yellow-400 mt-1">Needs Improvement</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-400 mb-1">6</div>
            <div className="text-sm text-gray-400">Vulnerabilities Found</div>
            <div className="text-xs text-red-400 mt-1">2 Critical, 2 High, 2 Medium</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-400 mb-1">3-4</div>
            <div className="text-sm text-gray-400">Weeks to Fix</div>
            <div className="text-xs text-orange-400 mt-1">Estimated Effort</div>
          </div>
        </div>

        {/* Vulnerabilities Summary */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Critical Vulnerabilities
          </h4>
          <div className="space-y-2">
            {vulnerabilities.slice(0, showFullReport ? vulnerabilities.length : 3).map((vuln, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(vuln.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity}
                      </span>
                      <span className="font-medium text-white">{vuln.title}</span>
                    </div>
                    <p className="text-sm text-gray-400">📍 {vuln.location}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-400">CVSS: {vuln.cvss}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {!showFullReport && vulnerabilities.length > 3 && (
            <button
              onClick={() => setShowFullReport(true)}
              className="mt-3 text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Show all {vulnerabilities.length} vulnerabilities
            </button>
          )}
        </div>

        {/* Quick Recommendations */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Immediate Actions Required
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>Implement HTTP asset certification (Critical)</span>
            </div>
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>Add query response certification (Critical)</span>
            </div>
            <div className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Update vulnerable dependencies (High)</span>
            </div>
            <div className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Implement input validation (High)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 pt-4 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Generated by AVAI Security Analysis Engine v2.1.3</span>
            <span>Full report: https://reports.avai.life/ef661993</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MessageBubble = ({ message, isLast, onFileClick, hideAnalysisContent = false }: MessageBubbleProps) => {
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isUser = message.role === "user";
  const isAnalysisRequest = message.content.includes("analyze") && message.content.includes("MockRepoForDemo");
  const showLogs = !isUser && isAnalysisRequest && message.content.includes("🩺") && !hideAnalysisContent;
  const showReport = !isUser && isAnalysisRequest && !message.content.includes("🩺") && !hideAnalysisContent;

  return (
    <div className={cn(
      "flex gap-4 group animate-fade-in",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      )}

      <div className={cn(
        "flex flex-col max-w-[90%] lg:max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "relative px-4 py-3 rounded-2xl shadow-sm w-full",
          isUser 
            ? "message-user rounded-br-md" 
            : "message-ai rounded-bl-md border border-border"
        )}>
          {showLogs ? (
            <AnalysisLogs content={message.content} />
          ) : showReport ? (
            <AnalysisReport content={message.content} />
          ) : (
            <div 
              className="scrollbar-custom scrollbar-always"
              style={{
                maxHeight: '200px',
                overflowY: 'scroll',
                overflowX: 'hidden',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                padding: '8px'
              }}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </div>
          )}
          
          {/* File attachments */}
          {message.files && message.files.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onClick={() => onFileClick([file])}
                />
              ))}
            </div>
          )}
        </div>

        <div className={cn(
          "flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-xs text-muted-foreground px-2">
            {formatTime(message.timestamp)}
          </span>

          {!isUser && isLast && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(message.content)}
                className="h-6 w-6 p-0 hover:bg-surface-hover"
              >
                <Copy className="w-3 h-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-surface-hover"
                onClick={() => {
                  toast({
                    title: "Regenerating response...",
                    description: "This feature will be implemented soon",
                    duration: 2000,
                  });
                }}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>

              <div className="w-px h-4 bg-border mx-1" />

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-success/20 hover:text-success"
                onClick={() => {
                  toast({
                    title: "Thanks for your feedback!",
                    duration: 2000,
                  });
                }}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                onClick={() => {
                  toast({
                    title: "Thanks for your feedback!",
                    duration: 2000,
                  });
                }}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-sm font-medium text-primary-foreground">U</span>
        </div>
      )}
    </div>
  );
};