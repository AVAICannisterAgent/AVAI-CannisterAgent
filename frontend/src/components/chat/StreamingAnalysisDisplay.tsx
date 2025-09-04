import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Terminal, FileText, Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface StreamingAnalysisDisplayProps {
  isAnalyzing: boolean;
  onComplete?: (report: string) => void;
}

export const StreamingAnalysisDisplay = ({ isAnalyzing, onComplete }: StreamingAnalysisDisplayProps) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [finalReport, setFinalReport] = useState<string>("");

  useEffect(() => {
    if (!isAnalyzing) return;

    // Simulate streaming analysis logs
    const streamAnalysis = async () => {
      setLogs([]);
      setProgress(0);
      setAnalysisComplete(false);
      setFinalReport("");

      // Phase 1: Initialization
      setCurrentPhase("🔍 INITIALIZATION PHASE");
      await addLog("🩺 AVAI Security Analysis Engine v2.1.3");
      await addLog("📊 Analysis Session ID: ef661993");
      await addLog("🕒 Started: 2025-09-03 19:52:15 UTC");
      await addLog("🎯 Target: https://github.com/mrarejimmyz/MockRepoForDemo");
      setProgress(10);

      await addLog("🧠 Vision Learning System initialized");
      await addLog("🔄 Loop Detection Engine initialized with adaptive thresholds");
      await addLog("🚀 Initialized Unified Ollama Provider: dolphin-llama3");
      await addLog("✅ CUDA detected via PyTorch");
      await addLog("🔍 Found 1 GPU device(s) via PyTorch");
      setProgress(20);

      // Phase 2: Repository Discovery
      setCurrentPhase("🔎 REPOSITORY DISCOVERY");
      await addLog("🧠 Human-Like Navigation Manager initialized");
      await addLog("📦 Research Request Batcher initialized");
      await addLog("🥷 Browser Use Tool now uses ENHANCED stealth mode");
      await addLog("📋 Repository Structure Detected:");
      await addLog("├── src/ (Directory)");
      await addLog("├── dfx.json");
      await addLog("├── package.json");
      await addLog("└── webpack.config.js");
      setProgress(40);

      // Phase 3: Security Scan
      setCurrentPhase("🛡️ SECURITY VULNERABILITY SCAN");
      await addLog("🚨 CRITICAL VULNERABILITIES DETECTED:");
      await addLog("❌ HIGH SEVERITY - Unverified Query Responses");
      await addLog("❌ HIGH SEVERITY - Missing HTTP Asset Certification");
      await addLog("⚠️  MEDIUM SEVERITY - Insecure Package Dependencies");
      setProgress(60);

      // Phase 4: Code Quality
      setCurrentPhase("📊 CODE QUALITY ANALYSIS");
      await addLog("🔍 Static Code Analysis Results:");
      await addLog("📉 Code Quality Score: 73/100");
      await addLog("❌ Missing Error Handling (8 instances)");
      await addLog("❌ No Unit Tests Detected");
      setProgress(80);

      // Phase 5: Final Analysis
      setCurrentPhase("📋 COMPREHENSIVE AUDIT SUMMARY");
      await addLog("🎯 OVERALL SECURITY SCORE: 68/100 (NEEDS IMPROVEMENT)");
      await addLog("🚨 IMMEDIATE ACTION REQUIRED:");
      await addLog("1. 🔴 CRITICAL: Implement HTTP asset certification");
      await addLog("2. 🔴 CRITICAL: Add query response certification");
      setProgress(100);

      // Fetch and display full report
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchFullReport();
    };

    streamAnalysis();
  }, [isAnalyzing]);

  const addLog = (message: string) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setLogs(prev => [...prev, message]);
        resolve();
      }, Math.random() * 200 + 100); // Random delay between 100-300ms
    });
  };

  const fetchFullReport = async () => {
    try {
      // Simulate fetching from the realistic_analysis_output.txt file
      const response = await fetch('/realistic_analysis_output.txt');
      if (response.ok) {
        const reportContent = await response.text();
        setFinalReport(reportContent);
        setAnalysisComplete(true);
        if (onComplete) {
          onComplete(reportContent);
        }
      } else {
        // Fallback with simulated report
        const fallbackReport = generateFallbackReport();
        setFinalReport(fallbackReport);
        setAnalysisComplete(true);
        if (onComplete) {
          onComplete(fallbackReport);
        }
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      const fallbackReport = generateFallbackReport();
      setFinalReport(fallbackReport);
      setAnalysisComplete(true);
      if (onComplete) {
        onComplete(fallbackReport);
      }
    }
  };

  const generateFallbackReport = () => {
    return `🩺 AVAI Security Analysis Complete

🎯 OVERALL SECURITY SCORE: 68/100 (NEEDS IMPROVEMENT)

📊 Detailed Breakdown:
├── Security Vulnerabilities: 45/100 ❌
├── Code Quality: 73/100 ⚠️
├── Architecture: 71/100 ⚠️  
├── Dependencies: 45/100 ❌
└── IC Compliance: 38/100 ❌

🚨 CRITICAL VULNERABILITIES:
❌ Unverified Query Responses in Motoko canisters
❌ Missing HTTP Asset Certification
⚠️  Insecure Package Dependencies (3 packages)
⚠️  Missing Input Validation

🔧 RECOMMENDED FIXES:
1. Implement HTTP asset certification
2. Add query response certification  
3. Update vulnerable dependencies
4. Add comprehensive input validation
5. Implement proper error handling

💰 ESTIMATED REMEDIATION: 3-4 weeks
🎯 RISK REDUCTION: 85% security improvement potential

🤖 Analysis powered by AVAI Security Engine v2.1.3`;
  };

  if (!isAnalyzing && !analysisComplete) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Current Phase Display */}
      {currentPhase && !analysisComplete && (
        <Card className="p-4 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span className="text-blue-300 font-medium">{currentPhase}</span>
            <Badge variant="outline" className="ml-auto">
              {progress}%
            </Badge>
          </div>
        </Card>
      )}

      {/* Streaming Logs */}
      {logs.length > 0 && !analysisComplete && (
        <Card className="p-4 bg-gray-900/50 border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">Live Analysis Logs</span>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div
                key={index}
                className="text-gray-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {log}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Final Report */}
      {analysisComplete && finalReport && (
        <Card className="p-6 bg-gray-900/50 border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Analysis Complete</span>
            <FileText className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
          <div className="whitespace-pre-wrap font-mono text-sm text-gray-300 max-h-96 overflow-y-auto">
            {finalReport}
          </div>
        </Card>
      )}
    </div>
  );
};
