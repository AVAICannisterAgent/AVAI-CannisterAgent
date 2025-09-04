import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Github, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Code, 
  FileText, 
  Activity,
  Zap,
  Eye,
  Clock,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  id: string;
  type: "security" | "performance" | "code_quality" | "architecture";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  file?: string;
  line?: number;
  suggestion: string;
}

const DEMO_REPO_URL = "https://github.com/mrarejimmyz/MockRepoForDemo";

const mockAnalysisResults: AnalysisResult[] = [
  {
    id: "1",
    type: "security",
    severity: "high",
    title: "Potential Integer Overflow",
    description: "Arithmetic operations in balance calculations may overflow",
    file: "src/main.mo",
    line: 45,
    suggestion: "Use checked arithmetic operations or implement overflow protection"
  },
  {
    id: "2",
    type: "security",
    severity: "medium",
    title: "Access Control Missing",
    description: "Administrative functions lack proper access control",
    file: "src/admin.mo",
    line: 23,
    suggestion: "Implement role-based access control for administrative functions"
  },
  {
    id: "3",
    type: "performance",
    severity: "medium",
    title: "Inefficient Map Iteration",
    description: "Large HashMap iteration may cause performance issues",
    file: "src/storage.mo",
    line: 78,
    suggestion: "Consider using stable data structures or pagination for large datasets"
  },
  {
    id: "4",
    type: "code_quality",
    severity: "low",
    title: "Missing Error Handling",
    description: "Function calls lack comprehensive error handling",
    file: "src/utils.mo",
    line: 156,
    suggestion: "Add proper error handling and validation for all function parameters"
  },
  {
    id: "5",
    type: "architecture",
    severity: "medium",
    title: "Canister Upgrade Safety",
    description: "Stable variables not properly marked for upgrades",
    file: "src/main.mo",
    line: 12,
    suggestion: "Mark critical state variables as stable to preserve data during upgrades"
  }
];

export const CanisterDemo = () => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setShowResults(false);
    setAnalysisResults([]);

    const steps = [
      { step: "Connecting to GitHub repository...", duration: 1000 },
      { step: "Downloading Motoko source files...", duration: 1500 },
      { step: "Parsing canister architecture...", duration: 2000 },
      { step: "Running security analysis...", duration: 2500 },
      { step: "Checking performance patterns...", duration: 2000 },
      { step: "Analyzing code quality...", duration: 1500 },
      { step: "Generating comprehensive report...", duration: 1000 }
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].step);
      setProgress((i + 1) * (100 / steps.length));
      
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
    }

    setAnalysisResults(mockAnalysisResults);
    setShowResults(true);
    setIsAnalyzing(false);
    setCurrentStep("Analysis complete!");

    toast({
      title: "AVAI Analysis Complete! 🎉",
      description: `Found ${mockAnalysisResults.length} issues across ${new Set(mockAnalysisResults.map(r => r.file)).size} files`,
      duration: 5000,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-red-400 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "security": return <Shield className="w-4 h-4" />;
      case "performance": return <Zap className="w-4 h-4" />;
      case "code_quality": return <Code className="w-4 h-4" />;
      case "architecture": return <Activity className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const criticalIssues = analysisResults.filter(r => r.severity === "critical").length;
  const highIssues = analysisResults.filter(r => r.severity === "high").length;
  const mediumIssues = analysisResults.filter(r => r.severity === "medium").length;
  const lowIssues = analysisResults.filter(r => r.severity === "low").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AVAI Canister Security Analyzer
          </h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Comprehensive security, performance, and architecture analysis for Internet Computer canisters.
            Experience the power of AI-driven blockchain code auditing.
          </p>
        </div>

        {/* Demo Repository Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Github className="w-6 h-6 text-blue-400" />
                <div>
                  <CardTitle className="text-white">Demo Repository</CardTitle>
                  <CardDescription>MockRepoForDemo - Sample Motoko Canister</CardDescription>
                </div>
              </div>
              <Button
                onClick={startAnalysis}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 text-sm text-slate-400">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>Public Repository</span>
              </div>
              <div className="flex items-center space-x-1">
                <Code className="w-4 h-4" />
                <span>Motoko Language</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>IC Canister</span>
              </div>
            </div>
            <div className="mt-3">
              <a 
                href={DEMO_REPO_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {DEMO_REPO_URL}
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Progress Section */}
        {isAnalyzing && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 animate-spin text-blue-400" />
                <span>AVAI Analysis in Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} className="w-full" />
              <p className="text-slate-300 text-center">{currentStep}</p>
              <div className="text-sm text-slate-400 text-center">
                {Math.round(progress)}% Complete
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {showResults && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-red-900/20 border-red-700">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-400">{criticalIssues + highIssues}</div>
                  <div className="text-sm text-red-300">Critical & High</div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-900/20 border-yellow-700">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-400">{mediumIssues}</div>
                  <div className="text-sm text-yellow-300">Medium Issues</div>
                </CardContent>
              </Card>
              <Card className="bg-blue-900/20 border-blue-700">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-400">{lowIssues}</div>
                  <div className="text-sm text-blue-300">Low Priority</div>
                </CardContent>
              </Card>
              <Card className="bg-green-900/20 border-green-700">
                <CardContent className="p-4 text-center">
                  <FileText className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-400">{new Set(analysisResults.map(r => r.file)).size}</div>
                  <div className="text-sm text-green-300">Files Analyzed</div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Results */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span>Analysis Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">All Issues</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="code_quality">Code Quality</TabsTrigger>
                    <TabsTrigger value="architecture">Architecture</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    <ScrollArea className="h-96 w-full">
                      <div className="space-y-3">
                        {analysisResults.map((result) => (
                          <Alert key={result.id} className="bg-slate-900/50 border-slate-600">
                            <div className="flex items-start space-x-3">
                              {getTypeIcon(result.type)}
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <AlertTitle className="text-white">{result.title}</AlertTitle>
                                  <Badge className={getSeverityColor(result.severity)}>
                                    {result.severity.toUpperCase()}
                                  </Badge>
                                </div>
                                <AlertDescription className="text-slate-300">
                                  {result.description}
                                </AlertDescription>
                                {result.file && (
                                  <div className="text-sm text-blue-400">
                                    📁 {result.file}:{result.line}
                                  </div>
                                )}
                                <div className="text-sm text-green-400 bg-green-900/20 p-2 rounded">
                                  💡 Suggestion: {result.suggestion}
                                </div>
                              </div>
                            </div>
                          </Alert>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  {["security", "performance", "code_quality", "architecture"].map((type) => (
                    <TabsContent key={type} value={type}>
                      <ScrollArea className="h-96 w-full">
                        <div className="space-y-3">
                          {analysisResults
                            .filter((result) => result.type === type)
                            .map((result) => (
                              <Alert key={result.id} className="bg-slate-900/50 border-slate-600">
                                <div className="flex items-start space-x-3">
                                  {getTypeIcon(result.type)}
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <AlertTitle className="text-white">{result.title}</AlertTitle>
                                      <Badge className={getSeverityColor(result.severity)}>
                                        {result.severity.toUpperCase()}
                                      </Badge>
                                    </div>
                                    <AlertDescription className="text-slate-300">
                                      {result.description}
                                    </AlertDescription>
                                    {result.file && (
                                      <div className="text-sm text-blue-400">
                                        📁 {result.file}:{result.line}
                                      </div>
                                    )}
                                    <div className="text-sm text-green-400 bg-green-900/20 p-2 rounded">
                                      💡 Suggestion: {result.suggestion}
                                    </div>
                                  </div>
                                </div>
                              </Alert>
                            ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Demo Info */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Demo Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            <p>
              This demonstration showcases AVAI's comprehensive canister analysis capabilities. 
              The MockRepoForDemo repository contains sample Motoko code with intentional 
              security vulnerabilities, performance issues, and code quality problems 
              that AVAI can detect and provide actionable suggestions for.
            </p>
            <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
              <p className="text-blue-300 font-medium">🎬 Perfect for Demo Videos!</p>
              <p className="text-sm text-blue-200 mt-1">
                This interactive demo provides realistic analysis results and showcases 
                AVAI's ability to identify critical security issues in Internet Computer canisters.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
