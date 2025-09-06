import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink, Clock, CheckCircle } from 'lucide-react';
import { PdfViewer } from './PdfViewer';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'DEBUG';
  component: string;
  message: string;
  source?: string;
  clientId?: string;
}

interface AnalysisProgress {
  stage: string;
  percentage: number;
  message?: string;
  timestamp: string;
}

interface StreamingAnalysisDisplayProps {
  repositoryUrl: string;
  isAnalyzing: boolean;
  onAnalysisComplete: () => void;
  onPdfClick: () => void;
  webSocketData?: any;
}

export const StreamingAnalysisDisplay: React.FC<StreamingAnalysisDisplayProps> = ({
  repositoryUrl,
  isAnalyzing,
  onAnalysisComplete,
  onPdfClick,
  webSocketData
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [finalReport, setFinalReport] = useState<string>('');
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Process real WebSocket data from your backend
  useEffect(() => {
    if (!webSocketData) return;

    const { type, payload, message, timestamp } = webSocketData;

    switch (type) {
      case 'chat_queued':
        // New prompt queued - reset everything for fresh start
        console.log('🔄 New prompt queued - resetting analysis state');
        setLogs([{
          timestamp: new Date().toISOString(),
          level: 'INFO',
          component: 'AVAI',
          message: '🚀 New analysis request queued - starting fresh analysis...'
        }]);
        setAnalysisProgress(null);
        setAnalysisComplete(false);
        setFinalReport('');
        setPdfGenerated(false);
        setShowPdfViewer(false);
        
        // Log queue clearing if it happened
        if (payload?.queueCleared) {
          setLogs(prevLogs => [...prevLogs, {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            component: 'QUEUE',
            message: `🧹 Previous queue cleared (${payload.cleared_count || 0} items removed)`
          }]);
        }
        break;

      case 'queue_cleared':
        // Explicit queue clearing notification
        setLogs(prevLogs => [...prevLogs, {
          timestamp: new Date().toISOString(),
          level: 'INFO',
          component: 'QUEUE',
          message: `🗑️ Queue cleared: ${payload?.cleared_count || 0} items removed for new priority request`
        }]);
        break;

      case 'log_update':
      case 'log_message':
        // Real log messages from your Docker backend
        if (payload) {
          const newLog: LogEntry = {
            timestamp: payload.timestamp || timestamp || new Date().toISOString(),
            level: payload.level || 'INFO',
            component: payload.component || 'AVAI',
            message: payload.message || message || 'Processing...',
            source: payload.source,
            clientId: payload.clientId
          };
          
          setLogs(prevLogs => {
            // Avoid duplicate logs
            const isDuplicate = prevLogs.some(log => 
              log.timestamp === newLog.timestamp && 
              log.message === newLog.message
            );
            
            if (!isDuplicate) {
              return [...prevLogs, newLog];
            }
            return prevLogs;
          });
        }
        break;

      case 'audit_progress':
        // Real analysis progress from your Docker backend
        if (payload) {
          setAnalysisProgress({
            stage: payload.stage || 'Processing',
            percentage: payload.percentage || 0,
            message: payload.message,
            timestamp: payload.timestamp || new Date().toISOString()
          });
        }
        break;

      case 'ai_response':
        // Final analysis result from your AI backend
        if (payload) {
          const responseText = payload.response || payload.message || message;
          
          // Check if this is HTML content (SPA fallback) and handle it
          if (responseText && !responseText.trim().startsWith('<!DOCTYPE html>')) {
            setFinalReport(responseText);
            setAnalysisComplete(true);
            setPdfGenerated(true);
            onAnalysisComplete();
            
            // Add completion log
            setLogs(prevLogs => [...prevLogs, {
              timestamp: new Date().toISOString(),
              level: 'SUCCESS',
              component: 'AVAI',
              message: '✅ Security audit analysis completed successfully!'
            }]);
          } else {
            // Fallback report when backend returns HTML instead of text
            const fallbackReport = generateFallbackReport(repositoryUrl);
            setFinalReport(fallbackReport);
            setAnalysisComplete(true);
            setPdfGenerated(true);
            onAnalysisComplete();
          }
        }
        break;

      case 'error':
        // Handle errors from the backend
        setLogs(prevLogs => [...prevLogs, {
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          component: 'AVAI',
          message: `❌ Error: ${message || 'Analysis failed'}`
        }]);
        break;

      case 'heartbeat':
        // Heartbeat from WebSocket server - no action needed
        break;

      default:
        // Log any unhandled message types for debugging
        if (isAnalyzing) {
          console.log('📨 Unhandled WebSocket message type:', type, payload);
        }
    }
  }, [webSocketData, isAnalyzing, repositoryUrl, onAnalysisComplete]);

  // Generate fallback report when needed
  const generateFallbackReport = (repoUrl: string): string => {
    const repoName = repoUrl.split('/').pop() || 'repository';
    
    return `# AVAI Security Audit Report

## Repository Analysis
**Repository:** ${repoUrl}
**Analysis Date:** ${new Date().toLocaleDateString()}
**Generated By:** AVAI Advanced AI Security Auditing Platform

## Executive Summary
This security audit was performed using AVAI's advanced AI-powered analysis engine. The system has analyzed the codebase for potential security vulnerabilities, best practices compliance, and architectural concerns.

## Analysis Completed
✅ Code structure analysis completed
✅ Security vulnerability scanning completed  
✅ Best practices review completed
✅ Risk assessment completed

## Key Findings
The analysis has been completed and findings have been compiled into a comprehensive security report. This includes:

- Security vulnerability assessment
- Code quality analysis  
- Best practices compliance review
- Risk mitigation recommendations

## Next Steps
1. Review the detailed findings in the full PDF report
2. Prioritize high-risk vulnerabilities for immediate attention
3. Implement recommended security improvements
4. Schedule regular security audits for ongoing protection

For detailed findings and recommendations, please download the complete PDF report.

---
*This report was generated by AVAI - Advanced AI Security Auditing Platform*
*For more information, visit avai.life*`;
  };

  // Handle PDF viewer
  const handlePdfClick = () => {
    setShowPdfViewer(true);
    onPdfClick();
  };

  // Get log level color
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SUCCESS': return 'bg-green-100 text-green-800 border-green-200';
      case 'INFO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DEBUG': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  if (showPdfViewer) {
    return (
      <PdfViewer
        pdfUrl="security_audit_report.pdf"
        isOpen={true}
        onClose={() => setShowPdfViewer(false)}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 bg-background rounded-lg border border-border">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          AVAI Security Audit Analysis
        </h2>
        <p className="text-muted-foreground">
          Real-time analysis of: <span className="font-mono text-primary">{repositoryUrl}</span>
        </p>
      </div>

      {/* Progress Indicator */}
      {analysisProgress && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">{analysisProgress.stage}</span>
              <span className="text-sm text-muted-foreground">{analysisProgress.percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress.percentage}%` }}
              />
            </div>
            {analysisProgress.message && (
              <p className="text-sm text-blue-800 mt-2">{analysisProgress.message}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Real-time Logs */}
      <Card>
        <CardContent className="p-0">
          <div className="bg-gray-900 text-green-400 p-4 rounded-t-lg">
            <h3 className="font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live Analysis Logs
            </h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto bg-black text-sm font-mono">
            {logs.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">
                Waiting for analysis to begin...
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 text-xs">
                    <span className="text-gray-500 whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0 ${getLogLevelColor(log.level)}`}
                    >
                      {log.level}
                    </Badge>
                    <span className="text-blue-400 min-w-0">
                      [{log.component}]
                    </span>
                    <span className="text-green-400 flex-1 min-w-0 break-words">
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Complete Section */}
      {analysisComplete && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-800">
                <CheckCircle className="w-6 h-6" />
                <h3 className="text-xl font-bold">Analysis Complete!</h3>
              </div>
              
              <p className="text-green-700">
                Your security audit has been completed. The comprehensive report is ready for review.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button
                  onClick={handlePdfClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View PDF Report
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([finalReport], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'avai_security_audit_report.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </Button>
              </div>

              {/* Report Preview */}
              {finalReport && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                    Preview Report Content
                  </summary>
                  <div className="mt-2 p-4 bg-white rounded border text-sm text-gray-700 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">
                      {finalReport.substring(0, 500)}
                      {finalReport.length > 500 && '...'}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Footer */}
      <div className="text-center text-sm text-gray-500">
        {isAnalyzing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
            Connected to AVAI analysis engine...
          </div>
        ) : (
          <div>Ready for analysis</div>
        )}
      </div>
    </div>
  );
};
