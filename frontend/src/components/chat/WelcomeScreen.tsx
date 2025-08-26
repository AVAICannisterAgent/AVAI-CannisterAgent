import { Stethoscope, Activity, Shield } from "lucide-react";

export const WelcomeScreen = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md animate-fade-in">
        {/* AVAI Logo with medical/blockchain theme */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          {/* Blockchain pulse indicator */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <Activity className="w-3 h-3 text-white" />
          </div>
        </div>

        {/* Playful welcome message */}
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Hey! I'm <span className="text-transparent bg-clip-text bg-gradient-primary">AVAI</span> 🩺
        </h1>
        
        <p className="text-text-secondary text-lg mb-6">
          Your friendly blockchain doctor! Ready to diagnose, audit, and heal your Web3 needs.
        </p>

        {/* Compact feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <div className="flex items-center gap-1 px-3 py-1 bg-surface/50 rounded-full text-xs">
            <Shield className="w-3 h-3 text-blue-400" />
            <span>Audit</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-surface/50 rounded-full text-xs">
            <Activity className="w-3 h-3 text-green-400" />
            <span>Monitor</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-surface/50 rounded-full text-xs">
            <Stethoscope className="w-3 h-3 text-purple-400" />
            <span>Diagnose</span>
          </div>
        </div>

        <p className="text-text-secondary text-sm opacity-75">
          What can I help you with today?
        </p>
      </div>
    </div>
  );
};
