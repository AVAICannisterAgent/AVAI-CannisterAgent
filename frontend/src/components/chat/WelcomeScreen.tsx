import { Button } from "@/components/ui/button";
import { Activity, FileCode, GitBranch, Shield, Stethoscope } from "lucide-react";

export const WelcomeScreen = () => {
  const handleRepositoryAnalysis = () => {
    // Send a real analysis request through WebSocket
    const message = "Please analyze the MockRepoForDemo repository - provide a comprehensive security audit and code analysis.";

    // Trigger the chat input with real analysis request
    const event = new CustomEvent('avai-send-message', { detail: { message } });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md animate-fade-in-up">
        {/* AVAI Logo with medical/blockchain theme */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Stethoscope className="w-10 h-10 text-white drop-shadow-md" />
          </div>
          {/* Blockchain pulse indicator */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
            <Activity className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Professional welcome message */}
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Welcome to <span className="text-blue-400 font-extrabold drop-shadow-glow">AVAI</span>
        </h1>

        <p className="text-foreground/90 text-lg mb-6 leading-relaxed">
          Advanced AI-powered blockchain security auditing and code analysis platform.
        </p>

        {/* Feature capabilities */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-300 hover:bg-blue-500/30 transition-colors pill-hover">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Security Audit</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-300 hover:bg-green-500/30 transition-colors pill-hover">
            <Activity className="w-4 h-4" />
            <span className="font-medium">Real-time Analysis</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-300 hover:bg-purple-500/30 transition-colors pill-hover">
            <FileCode className="w-4 h-4" />
            <span className="font-medium">Code Quality</span>
          </div>
        </div>

        {/* Quick Analysis Button */}
        <div className="mb-6 space-y-3">
          <Button
            onClick={handleRepositoryAnalysis}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Analyze Repository
          </Button>
        </div>

        <p className="text-foreground/70 text-base font-medium">
          Start a comprehensive security audit and code analysis
        </p>
      </div>
    </div>
  );
};
