import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Terminal, FileText, Shield, AlertTriangle, CheckCircle, Download, ExternalLink } from "lucide-react";

interface StreamingAnalysisDisplayProps {
  isAnalyzing: boolean;
  onComplete?: (report: string) => void;
  onPdfClick?: (pdfUrl: string) => void;
}

export const StreamingAnalysisDisplay = ({ isAnalyzing, onComplete, onPdfClick }: StreamingAnalysisDisplayProps) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [finalReport, setFinalReport] = useState<string>("");

  useEffect(() => {
    if (!isAnalyzing) return;

    // Simulate streaming analysis logs - SHORTENED FOR TESTING
    const streamAnalysis = async () => {
      setLogs([]);
      setProgress(0);
      setAnalysisComplete(false);
      setFinalReport("");

      // Phase 1: Internet Computer Security Framework Initialization
      setCurrentPhase("🔍 INTERNET COMPUTER SECURITY FRAMEWORK INITIALIZATION");
      await addLog("🩺 AVAI Security Analysis Engine v2.1.3");
      await addLog("📊 Analysis Session ID: ef661993");
      await addLog("🕒 Started: 2025-09-03 19:52:15 UTC");
      await addLog("🎯 Target: https://github.com/mrarejimmyz/MockRepoForDemo");
      await addLog("📋 Applying Internet Computer Security Standards");
      setProgress(5);

      await addLog("🧠 Initializing IC-specific analysis modules...");
      await addLog("🔄 Loading enterprise security compliance framework...");
      await addLog("🚀 Canister security pattern analyzer activated");
      await addLog("✅ IC security best practices database loaded");
      await addLog("🔍 Motoko/Rust vulnerability scanner initialized");
      await addLog("🧠 Neural network models loaded successfully");
      setProgress(12);

      // Phase 2: IC Project Structure Analysis
      setCurrentPhase("🔎 INTERNET COMPUTER PROJECT DISCOVERY");
      await addLog("🧠 Analyzing IC project structure...");
      await addLog("📦 Checking for dfx.json configuration...");
      await addLog("🥷 Scanning canister architecture patterns...");
      await addLog("🌐 Detecting IC deployment configuration...");
      setProgress(18);
      
      await addLog("📋 IC Project Structure Detected:");
      await addLog("├── dfx.json (IC Configuration) ✅");
      await addLog("├── src/motoko_backend/ (Smart Contracts) ✅");
      await addLog("├── src/frontend/ (React Application)");
      await addLog("├── dfx.json (IC Configuration)");
      await addLog("├── package.json (Dependencies)");
      await addLog("└── webpack.config.js (Build System)");
      setProgress(25);

      await addLog("🔍 Language Analysis Complete:");
      await addLog("   JavaScript: 81.6% (Frontend Heavy)");
      await addLog("   Motoko: 9.1% (Core Backend Logic)");
      await addLog("   TypeScript: 5.2% (Type Definitions)");
      await addLog("   Configuration: 4.1% (Build & Deploy)");
      setProgress(30);

      // Phase 3: Security Deep Dive (Getting Stuck on Complex Issues)
      setCurrentPhase("🛡️ ADVANCED SECURITY VULNERABILITY ASSESSMENT");
      await addLog("🔧 Initializing advanced security scanners...");
      await addLog("🔧 Loading CVE database (2024-2025)...");
      await addLog("🧠 Applying dynamic learned timeouts...");
      setProgress(35);

      await addLog("📊 Performance metrics: vision=0.80, search=0.80");
      await addLog("📊 Research success rate: 0.63 (needs optimization)");
      await addLog("🔍 Beginning deep code analysis...");
      setProgress(40);

      // AI gets stuck on a complex issue
      await addLog("⚠️  ANOMALY DETECTED: Analyzing query certification...");
      await addLogSlow("🤔 Hmm... finding unusual patterns in Motoko code...");
      await addLogSlow("🧠 Cross-referencing with IC security best practices...");
      await addLogSlow("🔄 Re-analyzing... this is more complex than expected...");
      setProgress(42);

      await addLogSlow("💭 Agent thinking: Query responses lack certification mechanism");
      await addLogSlow("� Agent thinking: This could allow man-in-the-middle attacks");
      await addLogSlow("🔍 Deep dive into HTTP asset certification...");
      setProgress(45);

      // Critical vulnerability found
      await addLog("�🚨 CRITICAL VULNERABILITY IDENTIFIED!");
      await addLog("❌ HIGH SEVERITY - Unverified Query Responses");
      await addLog("   📍 Location: src/motoko_backend/*.mo");
      await addLog("   🔍 Impact: Data integrity compromised");
      await addLog("   ⚠️  Attack Vector: Man-in-the-middle possible");
      setProgress(50);

      // AI struggles with HTTP asset analysis
      await addLogSlow("🤔 Investigating frontend deployment patterns...");
      await addLogSlow("🔍 Checking raw.ic0.app usage... wait, this is problematic");
      await addLogSlow("💭 Agent thinking: Frontend served without certification");
      await addLog("❌ HIGH SEVERITY - Missing HTTP Asset Certification");
      await addLog("   📍 Impact: Frontend tampering vulnerability");
      await addLog("   🛡️ Recommendation: Enable certified assets");
      setProgress(58);

      // Phase 4: Dependency Hell Analysis
      setCurrentPhase("📦 DEPENDENCY SECURITY DEEP SCAN");
      await addLog("🌐 Initializing package vulnerability scanner...");
      await addLog("� Loading security databases...");
      await addLog("🧭 Centralized Content Extractor active");
      setProgress(62);

      // AI gets really stuck on dependencies
      await addLogSlow("📦 Analyzing package.json... this might take a moment...");
      await addLogSlow("🤔 Hmm, webpack version looks concerning...");
      await addLogSlow("🔍 Cross-checking CVE database...");
      await addLogSlow("⚠️  Wait... found something serious here...");
      setProgress(65);

      await addLogSlow("💭 Agent thinking: webpack@4.46.0 has critical vulnerability");
      await addLogSlow("💭 Agent thinking: CVE-2023-28154 - Code injection possible");
      await addLog("🚨 CRITICAL DEPENDENCY VULNERABILITY!");
      await addLog("❌ CRITICAL: webpack@4.46.0");
      await addLog("   📍 CVE-2023-28154: Code injection vulnerability");
      await addLog("   ⚠️  CVSS Score: 9.8 (CRITICAL)");
      setProgress(70);

      await addLogSlow("🔍 Continuing dependency analysis...");
      await addLog("❌ HIGH: react-dom@17.0.2 (XSS vulnerability)");
      await addLog("⚠️  MEDIUM: axios@0.24.0 (SSRF vulnerability)");
      setProgress(75);

      // Phase 5: Code Quality Detective Work
      setCurrentPhase("📊 INTELLIGENT CODE QUALITY ASSESSMENT");
      await addLog("🧠 Initializing code quality analyzers...");
      await addLog("🔍 Static analysis engine starting...");
      setProgress(78);

      await addLogSlow("🤔 Scanning for error handling patterns...");
      await addLogSlow("💭 Agent thinking: Missing try-catch blocks detected");
      await addLog("📉 Code Quality Score: 73/100");
      await addLog("❌ Missing Error Handling (8 instances)");
      await addLog("❌ No Unit Tests Detected (reliability concern)");
      await addLog("❌ Hardcoded Configuration Values (5 instances)");
      setProgress(85);

      // Phase 6: IC-Specific Analysis (Final Deep Dive)
      setCurrentPhase("🌐 INTERNET COMPUTER COMPLIANCE AUDIT");
      await addLog("🕯️ Modular CanisterAgent integration initialized");
      await addLog("🧹 Performing emergency cleanup...");
      await addLog("✅ Emergency cleanup completed");
      setProgress(88);

      await addLogSlow("🤔 Analyzing IC-specific security patterns...");
      await addLogSlow("💭 Agent thinking: Canister upgrade safety missing");
      await addLogSlow("💭 Agent thinking: No access control on public methods");
      await addLog("⚠️  IC COMPLIANCE ISSUES DETECTED:");
      await addLog("❌ HTTP asset certification: NOT IMPLEMENTED");
      await addLog("❌ Query response certification: NOT IMPLEMENTED");
      await addLog("❌ Canister upgrade security: NOT ADDRESSED");
      setProgress(95);

      // Final Analysis
      setCurrentPhase("📋 COMPREHENSIVE SECURITY ASSESSMENT COMPLETE");
      await addLog("🎯 OVERALL SECURITY SCORE: 68/100 (NEEDS IMPROVEMENT)");
      await addLog("🚨 IMMEDIATE ACTION REQUIRED:");
      await addLog("1. 🔴 CRITICAL: Implement HTTP asset certification");
      await addLog("2. 🔴 CRITICAL: Add query response certification");
      await addLog("3. 🔴 CRITICAL: Update webpack (code injection risk)");
      await addLog("4. 🟡 HIGH: Add proper input validation");
      await addLog("5. 🟡 HIGH: Implement access control");
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
      }, 150); // Realistic timing for normal logs
    });
  };

  const addLogSlow = (message: string) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setLogs(prev => [...prev, message]);
        resolve();
      }, 800); // Slower for "thinking" moments
    });
  };

  const fetchFullReport = async () => {
    console.log("fetchFullReport called");
    try {
      // Simulate fetching from the realistic_analysis_output.txt file
      const response = await fetch('/realistic_analysis_output.txt');
      console.log("Fetch response:", response.ok, response.status);
      if (response.ok) {
        const reportContent = await response.text();
        console.log("Report content length:", reportContent.length);
        setFinalReport(reportContent);
        setAnalysisComplete(true);
        if (onComplete) {
          onComplete(reportContent);
        }
      } else {
        console.log("Using fallback report");
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
      {analysisComplete && (
        <Card className="p-6 bg-gray-900/50 border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Analysis Complete</span>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("PDF button clicked, onPdfClick:", onPdfClick);
                  onPdfClick?.("/MockRepoForDemo_Security_Audit_Report.pdf");
                }}
                className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
              >
                <FileText className="w-4 h-4 mr-2" />
                View PDF Report
              </Button>
              <Button
                variant="outline" 
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = "/MockRepoForDemo_Security_Audit_Report.pdf";
                  link.download = "MockRepoForDemo_Security_Audit_Report.pdf";
                  link.click();
                }}
                className="text-green-400 border-green-400 hover:bg-green-400/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
          {finalReport && (
            <div className="whitespace-pre-wrap font-mono text-sm text-gray-300 max-h-96 overflow-y-auto">
              {finalReport}
            </div>
          )}
        </Card>
      )}
      
      {/* DEBUG INFO */}
      <div className="text-xs text-gray-500 p-2 bg-gray-800 rounded">
        DEBUG: analysisComplete={analysisComplete.toString()}, 
        finalReport length={finalReport.length}, 
        onPdfClick={onPdfClick ? 'present' : 'missing'}
      </div>
    </div>
  );
};
