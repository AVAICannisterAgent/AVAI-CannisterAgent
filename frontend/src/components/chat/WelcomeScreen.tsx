import { Stethoscope, Activity, Shield } from "lucide-react";

export const WelcomeScreen = () => {
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

        {/* Playful welcome message */}
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Hey! I'm <span className="text-blue-400 font-extrabold drop-shadow-glow">AVAI</span> 🩺
        </h1>
        
        <p className="text-foreground/90 text-lg mb-6 leading-relaxed">
          Your friendly blockchain doctor! Ready to diagnose, audit, and heal your Web3 needs.
        </p>

        {/* Compact feature pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm text-blue-300 hover:bg-blue-500/30 transition-colors pill-hover">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Audit</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-sm text-green-300 hover:bg-green-500/30 transition-colors pill-hover">
            <Activity className="w-4 h-4" />
            <span className="font-medium">Monitor</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-300 hover:bg-purple-500/30 transition-colors pill-hover">
            <Stethoscope className="w-4 h-4" />
            <span className="font-medium">Diagnose</span>
          </div>
        </div>

        <p className="text-foreground/70 text-base font-medium">
          What can I help you with today?
        </p>
      </div>
    </div>
  );
};
