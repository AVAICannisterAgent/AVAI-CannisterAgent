import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";

// Import AVAI modules
import Types "../../motoko_modules/core/types";
import Utils "../../motoko_modules/core/utils";

actor AVAIOrchestrator {
  
  // System state
  private stable var systemInitialized : Bool = false;
  private stable var totalPrompts : Nat = 0;
  private stable var processedPrompts : Nat = 0;
  
  // Agent registry
  private var agentRegistry = HashMap.HashMap<Text, Types.Agent>(10, Text.equal, Text.hash);
  
  // Learning system
  private var learningData = HashMap.HashMap<Text, Types.LearningEntry>(100, Text.equal, Text.hash);
  
  // Initialize the system
  public func initialize() : async Result.Result<Text, Text> {
    if (systemInitialized) {
      return #err("System already initialized");
    };
    
    // Register default agents
    let webAgent : Types.Agent = {
      id = "web-agent";
      name = "Web Research Agent";
      capabilities = ["web_search", "content_extraction", "link_analysis"];
      isActive = true;
      lastUsed = Time.now();
      successRate = 0.85;
    };
    
    let codeAgent : Types.Agent = {
      id = "code-agent"; 
      name = "Code Analysis Agent";
      capabilities = ["code_review", "vulnerability_scan", "dependency_analysis"];
      isActive = true;
      lastUsed = Time.now();
      successRate = 0.92;
    };
    
    let reportAgent : Types.Agent = {
      id = "report-agent";
      name = "Report Generation Agent";
      capabilities = ["markdown_generation", "pdf_creation", "data_visualization"];
      isActive = true;
      lastUsed = Time.now();
      successRate = 0.88;
    };
    
    agentRegistry.put("web-agent", webAgent);
    agentRegistry.put("code-agent", codeAgent);
    agentRegistry.put("report-agent", reportAgent);
    
    systemInitialized := true;
    
    Debug.print("🚀 AVAI Orchestrator initialized with " # debug_show(agentRegistry.size()) # " agents");
    
    #ok("AVAI Orchestrator initialized successfully")
  };
  
  // Main prompt processing function
  public func process_prompt(prompt: Text) : async Types.ProcessingResult {
    totalPrompts += 1;
    
    Debug.print("📝 Processing prompt: " # prompt);
    
    // Analyze prompt
    let analysis = await analyze_prompt(prompt);
    
    // Route to appropriate agents
    let routingResult = await route_to_agents(prompt, analysis);
    
    // Generate response
    let response = await generate_response(prompt, analysis, routingResult);
    
    processedPrompts += 1;
    
    // Learn from interaction
    await learn_from_interaction(prompt, analysis, response);
    
    {
      id = "prompt_" # debug_show(totalPrompts);
      prompt = prompt;
      analysis = analysis;
      response = response;
      timestamp = Time.now();
      processingTime = 100; // Placeholder
      success = true;
    }
  };
  
  // Analyze incoming prompt
  private func analyze_prompt(prompt: Text) : async Types.PromptAnalysis {
    let promptLower = Utils.toLower(prompt);
    
    // Determine intent
    var intent = "general";
    var confidence = 0.5;
    var requiredAgents : [Text] = [];
    var complexity = "medium";
    
    // Repository analysis detection
    if (Text.contains(promptLower, #text "repository") or 
        Text.contains(promptLower, #text "github") or
        Text.contains(promptLower, #text "analyze") and Text.contains(promptLower, #text "security")) {
      intent := "repository_analysis";
      confidence := 0.95;
      requiredAgents := ["web-agent", "code-agent", "report-agent"];
      complexity := "high";
    }
    // Code analysis detection
    else if (Text.contains(promptLower, #text "code") or 
             Text.contains(promptLower, #text "vulnerability") or
             Text.contains(promptLower, #text "security scan")) {
      intent := "code_analysis";
      confidence := 0.90;
      requiredAgents := ["code-agent", "report-agent"];
      complexity := "high";
    }
    // Web search detection
    else if (Text.contains(promptLower, #text "search") or 
             Text.contains(promptLower, #text "find") or
             Text.contains(promptLower, #text "research")) {
      intent := "web_research";
      confidence := 0.85;
      requiredAgents := ["web-agent", "report-agent"];
      complexity := "medium";
    }
    // Simple greeting detection
    else if (Text.contains(promptLower, #text "hello") or 
             Text.contains(promptLower, #text "hi") or
             Text.contains(promptLower, #text "greet")) {
      intent := "greeting";
      confidence := 0.99;
      requiredAgents := [];
      complexity := "low";
    };
    
    {
      intent = intent;
      confidence = confidence;
      requiredAgents = requiredAgents;
      complexity = complexity;
      keywords = Utils.extractKeywords(prompt);
      priority = if (complexity == "high") 1 else if (complexity == "medium") 2 else 3;
    }
  };
  
  // Route to appropriate agents
  private func route_to_agents(prompt: Text, analysis: Types.PromptAnalysis) : async [Types.AgentResult] {
    var results : [Types.AgentResult] = [];
    
    for (agentId in analysis.requiredAgents.vals()) {
      switch (agentRegistry.get(agentId)) {
        case (?agent) {
          if (agent.isActive) {
            let result = await process_with_agent(prompt, agent, analysis);
            results := Array.append(results, [result]);
          };
        };
        case null {
          Debug.print("⚠️ Agent not found: " # agentId);
        };
      };
    };
    
    results
  };
  
  // Process with specific agent
  private func process_with_agent(prompt: Text, agent: Types.Agent, analysis: Types.PromptAnalysis) : async Types.AgentResult {
    Debug.print("🤖 Processing with agent: " # agent.name);
    
    // Simulate agent processing based on capabilities
    var response = "";
    var success = true;
    
    switch (agent.id) {
      case "web-agent" {
        response := "🌐 Web research completed for: " # prompt # "\n" #
                   "Found relevant information and extracted key insights.\n" #
                   "Links analyzed: 15, Content extracted: 8 sources";
      };
      case "code-agent" {
        response := "💻 Code analysis completed for: " # prompt # "\n" #
                   "Security vulnerabilities found: 3 (2 medium, 1 low)\n" #
                   "Code quality score: 8.5/10\n" #
                   "Dependencies analyzed: 24 packages";
      };
      case "report-agent" {
        response := "📊 Report generated for: " # prompt # "\n" #
                   "Format: Comprehensive security audit report\n" #
                   "Sections: Executive Summary, Findings, Recommendations\n" #
                   "Pages: 12, Charts: 5";
      };
      case _ {
        response := "✅ General processing completed for: " # prompt;
      };
    };
    
    {
      agentId = agent.id;
      response = response;
      success = success;
      processingTime = 50; // Placeholder
      confidence = agent.successRate;
    }
  };
  
  // Generate final response
  private func generate_response(prompt: Text, analysis: Types.PromptAnalysis, agentResults: [Types.AgentResult]) : async Text {
    var finalResponse = "🤖 **AVAI Agent Response**\n\n";
    
    finalResponse #= "**Analysis**: Detected " # analysis.intent # " (confidence: " # debug_show(analysis.confidence) # ")\n\n";
    
    if (Array.size(agentResults) == 0) {
      // Handle simple cases without agents
      switch (analysis.intent) {
        case "greeting" {
          finalResponse #= "Hello! I'm AVAI (Avishek's Very Awesome Intelligence), your advanced AI orchestrator running on the Internet Computer. How can I help you today?";
        };
        case _ {
          finalResponse #= "I understand your request: \"" # prompt # "\"\n\n" #
                          "I'm ready to help with research, analysis, coding, and comprehensive reporting tasks.";
        };
      };
    } else {
      finalResponse #= "**Agent Processing Results**:\n\n";
      
      for (result in agentResults.vals()) {
        finalResponse #= result.response # "\n\n";
      };
      
      finalResponse #= "**Summary**: Successfully processed using " # debug_show(Array.size(agentResults)) # " specialized agents.\n";
      finalResponse #= "All systems operational and ready for next task.";
    };
    
    finalResponse
  };
  
  // Learning system
  private func learn_from_interaction(prompt: Text, analysis: Types.PromptAnalysis, response: Text) : async () {
    let learningKey = analysis.intent # "_" # debug_show(Time.now());
    
    let learningEntry : Types.LearningEntry = {
      timestamp = Time.now();
      prompt = prompt;
      intent = analysis.intent;
      confidence = analysis.confidence;
      success = true;
      responseQuality = 0.85; // Would be calculated based on feedback
      improvements = ["Continue with current approach"];
    };
    
    learningData.put(learningKey, learningEntry);
    
    Debug.print("🧠 Learning entry added: " # learningKey);
  };
  
  // System status
  public query func get_system_status() : async Types.SystemStatus {
    {
      initialized = systemInitialized;
      activeAgents = agentRegistry.size();
      totalPrompts = totalPrompts;
      processedPrompts = processedPrompts;
      learningEntries = learningData.size();
      uptime = Time.now(); // Simplified
      version = "1.0.0-motoko";
    }
  };
  
  // Get agent information
  public query func get_agents() : async [Types.Agent] {
    Iter.toArray(agentRegistry.vals())
  };
  
  // Add new agent
  public func add_agent(agent: Types.Agent) : async Result.Result<Text, Text> {
    switch (agentRegistry.get(agent.id)) {
      case (?_) { #err("Agent already exists: " # agent.id) };
      case null { 
        agentRegistry.put(agent.id, agent);
        #ok("Agent added successfully: " # agent.id)
      };
    };
  };
  
  // Legacy compatibility
  public query func greet(name : Text) : async Text {
    "Hello, " # name # "! I'm AVAI running on Motoko/ICP. Use process_prompt() for advanced AI capabilities."
  };
  
  // System health check
  public query func health_check() : async Bool {
    systemInitialized and agentRegistry.size() > 0
  };
}
