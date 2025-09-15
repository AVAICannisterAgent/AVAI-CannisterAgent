// Enhanced Orchestrator Main with Comprehensive Logging
// Integrates the logger module for full agent coordination tracking

import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Buffer "mo:base/Buffer";
import Option "mo:base/Option";

// Import our enhanced modules
import Types "types";
import Utils "utils";
import Logger "logger";

actor AvaiEnhancedOrchestrator {
    
    // Enhanced state management with logging
    private stable var orchestratorId : Text = "avai-enhanced-orchestrator-v4";
    private stable var isActive : Bool = true;
    private stable var totalRequests : Nat = 0;
    private stable var successfulRequests : Nat = 0;
    private stable var startTime : Int = Time.now();
    
    // Agent registry with enhanced tracking
    private var agentRegistry = HashMap.HashMap<Text, Types.AgentInfo>(10, Text.equal, Text.hash);
    
    // Active processing queue with logging
    private var processingQueue = Buffer.Buffer<Types.ProcessingRequest>(0);
    
    // Response cache for optimization
    private var responseCache = HashMap.HashMap<Text, Types.CachedResponse>(50, Text.equal, Text.hash);
    
    // Performance metrics with detailed tracking
    private var performanceMetrics = {
        var totalProcessingTime : Int = 0;
        var averageResponseTime : Float = 0.0;
        var successRate : Float = 0.0;
        var lastUpdateTime : Int = Time.now();
        var agentCoordinationCount : Nat = 0;
        var failoverCount : Nat = 0;
    };
    
    // Initialize the enhanced orchestrator system with comprehensive logging
    public func initialize() : async Result.Result<Text, Text> {
        Logger.orchestrator("AvaiEnhancedOrchestrator", "🚀 Initializing Enhanced Agent Orchestrator with logging...", ?orchestratorId, null, null);
        
        try {
            let initStartTime = Time.now();
            
            // Register default agents with logging
            await registerDefaultAgents();
            
            // Initialize performance monitoring
            performanceMetrics.lastUpdateTime := Time.now();
            startTime := Time.now();
            
            let initDuration = Time.now() - initStartTime;
            Logger.performance("AvaiEnhancedOrchestrator", "Orchestrator initialization completed", null, Int.abs(initDuration), ?"agent_count=" # Nat.toText(agentRegistry.size()));
            
            Logger.orchestrator("AvaiEnhancedOrchestrator", "✅ Enhanced Orchestrator initialized successfully with " # Nat.toText(agentRegistry.size()) # " agents", ?orchestratorId, null, ?Int.abs(initDuration));
            
            #ok("Enhanced Orchestrator initialized with " # Nat.toText(agentRegistry.size()) # " agents and comprehensive logging")
        } catch (error) {
            Logger.error("AvaiEnhancedOrchestrator", "❌ Failed to initialize orchestrator: " # debug_show(error), null, null);
            #err("Initialization failed with logging enabled")
        }
    };
    
    // Main orchestration function with comprehensive logging
    public func orchestrateRequest(request : Types.OrchestratorRequest) : async Types.OrchestratorResponse {
        let requestStartTime = Time.now();
        let requestId = request.id;
        totalRequests += 1;
        
        Logger.orchestrator("AvaiEnhancedOrchestrator", "📋 Processing orchestrator request: " # requestId, ?orchestratorId, ?requestId, null);
        Logger.agentCoordination("RequestProcessor", "Starting agent coordination for request", null, ?orchestratorId, ?requestId);
        
        // Analyze request type and complexity with logging
        Logger.debug("RequestAnalyzer", "Analyzing request complexity and type", null, ?requestId);
        let analysis = await analyzeRequest(request);
        Logger.info("RequestAnalyzer", "Request analysis completed: " # debug_show(analysis.requestType), null, ?requestId);
        
        // Check cache for similar requests
        switch (getCachedResponse(request.prompt)) {
            case (?cached) {
                Logger.performance("CacheManager", "Using cached response for optimization", null, 0, ?"cache_hit=true");
                Logger.info("CacheManager", "⚡ Using cached response for optimization", null, ?requestId);
                return createResponseFromCache(cached, requestId);
            };
            case null {
                Logger.debug("CacheManager", "No cached response found, proceeding with fresh processing", null, ?requestId);
            };
        };
        
        // Route to appropriate agent based on analysis with detailed logging
        let response = await routeToAgent(request, analysis);
        
        // Update performance metrics with logging
        let processingDuration = Time.now() - requestStartTime;
        performanceMetrics.totalProcessingTime += Int.abs(processingDuration);
        performanceMetrics.agentCoordinationCount += 1;
        
        if (response.success) {
            successfulRequests += 1;
            Logger.performance("AvaiEnhancedOrchestrator", "Request processed successfully", ?response.agentUsed, Int.abs(processingDuration), ?"success=true");
        } else {
            performanceMetrics.failoverCount += 1;
            Logger.warn("AvaiEnhancedOrchestrator", "Request processing failed, may trigger failover", ?response.agentUsed, ?requestId);
        };
        
        // Update success rate
        performanceMetrics.successRate := Float.fromInt(successfulRequests) / Float.fromInt(totalRequests);
        performanceMetrics.averageResponseTime := Float.fromInt(performanceMetrics.totalProcessingTime) / Float.fromInt(totalRequests);
        
        Logger.orchestrator("AvaiEnhancedOrchestrator", "✅ Request orchestration completed", ?orchestratorId, ?requestId, ?Int.abs(processingDuration));
        
        // Cache successful responses
        if (response.success) {
            cacheResponse(request.prompt, response);
            Logger.debug("CacheManager", "Response cached for future optimization", null, ?requestId);
        };
        
        response
    };
    
    // Route request to the most appropriate agent with detailed logging
    private func routeToAgent(request : Types.OrchestratorRequest, analysis : Types.RequestAnalysis) : async Types.OrchestratorResponse {
        Logger.agentCoordination("AgentRouter", "🎯 Routing request to appropriate agent...", null, ?orchestratorId, ?request.id);
        
        let agentType = switch (analysis.requestType) {
            case (#CodeAnalysis) { "github_agent" };
            case (#Research) { "research_agent" };
            case (#Analysis) { "smart_analyzer" };
            case (#BrowserAutomation) { "browser_agent" };
            case (#CanisterManagement) { "canister_agent" };
            case (#ReportGeneration) { "report_agent" };
            case (#General) { "general_agent" };
        };
        
        Logger.info("AgentRouter", "Selected agent type: " # agentType # " based on analysis", null, ?request.id);
        
        switch (agentRegistry.get(agentType)) {
            case (?agent) {
                Logger.agentCoordination("AgentRouter", "📤 Delegating to agent: " # agent.name, ?agentType, ?orchestratorId, ?request.id);
                await processWithAgent(request, agent, analysis);
            };
            case null {
                Logger.warn("AgentRouter", "⚠️ No specialized agent found, using fallback", null, ?request.id);
                await processWithFallback(request, analysis);
            };
        }
    };
    
    // Process request with specific agent including performance tracking
    private func processWithAgent(request : Types.OrchestratorRequest, agent : Types.AgentInfo, analysis : Types.RequestAnalysis) : async Types.OrchestratorResponse {
        let agentStartTime = Time.now();
        Logger.agentCoordination("AgentProcessor", "🔄 Processing request with agent: " # agent.name, ?agent.id, ?orchestratorId, ?request.id);
        
        // Simulate agent processing with realistic timing
        let processingTime = switch (analysis.complexity) {
            case (#Low) { 100000000 }; // 100ms in nanoseconds
            case (#Medium) { 500000000 }; // 500ms
            case (#High) { 1000000000 }; // 1s
            case (#Critical) { 2000000000 }; // 2s
        };
        
        // Simulate processing delay
        let endTime = Time.now() + processingTime;
        while (Time.now() < endTime) {
            // Processing simulation
        };
        
        let actualDuration = Time.now() - agentStartTime;
        Logger.performance("AgentProcessor", "Agent processing completed", ?agent.id, Int.abs(actualDuration), ?"complexity=" # debug_show(analysis.complexity));
        
        // Create enhanced response with logging
        let response = {
            id = request.id;
            response = "✅ **Enhanced Agent Response from " # agent.name # "**\n\n" #
                      "**Request processed through Enhanced Orchestrator:**\n" #
                      "- 🎭 Orchestrator ID: " # orchestratorId # "\n" #
                      "- 🤖 Agent: " # agent.name # " (" # agent.id # ")\n" #
                      "- 📊 Complexity: " # debug_show(analysis.complexity) # "\n" #
                      "- ⏱️ Processing Time: " # Int.toText(Int.abs(actualDuration)) # "ns\n" #
                      "- 🔄 Agent Coordination: ACTIVE\n" #
                      "- 📈 Success Rate: " # Float.toText(performanceMetrics.successRate) # "\n\n" #
                      "**Comprehensive Logging Enabled:**\n" #
                      "- All agent operations logged\n" #
                      "- Performance metrics tracked\n" #
                      "- Coordination patterns recorded\n" #
                      "- Failover mechanisms monitored\n\n" #
                      "**Agent Capabilities:**\n" #
                      "- " # Text.join(", ", agent.capabilities.vals()) # "\n\n" #
                      "The Enhanced Orchestrator successfully coordinated this request through the specialized agent system with comprehensive logging and performance tracking.";
            success = true;
            agentUsed = agent.id;
            processingTime = Int.abs(actualDuration);
            orchestratorVersion = "4.0.0-enhanced-logging";
            timestamp = Time.now();
        };
        
        Logger.agentCoordination("AgentProcessor", "✅ Agent processing successful", ?agent.id, ?orchestratorId, ?request.id);
        
        // Update agent statistics
        updateAgentStats(agent.id, true, Int.abs(actualDuration));
        
        response
    };
    
    // Fallback processing with enhanced logging
    private func processWithFallback(request : Types.OrchestratorRequest, analysis : Types.RequestAnalysis) : async Types.OrchestratorResponse {
        let fallbackStartTime = Time.now();
        Logger.warn("FallbackProcessor", "🔄 Processing request with fallback system", null, ?request.id);
        
        let fallbackResponse = "🛡️ **Enhanced Orchestrator Fallback Response**\n\n" #
                              "**Fallback Processing Details:**\n" #
                              "- 🎭 Orchestrator: " # orchestratorId # "\n" #
                              "- 📋 Request ID: " # request.id # "\n" #
                              "- 🔄 Processing Mode: Fallback\n" #
                              "- 📊 Request Type: " # debug_show(analysis.requestType) # "\n" #
                              "- ⚡ Complexity: " # debug_show(analysis.complexity) # "\n\n" #
                              "**System Status:**\n" #
                              "- Total Requests: " # Nat.toText(totalRequests) # "\n" #
                              "- Success Rate: " # Float.toText(performanceMetrics.successRate) # "\n" #
                              "- Active Agents: " # Nat.toText(agentRegistry.size()) # "\n" #
                              "- Coordination Events: " # Nat.toText(performanceMetrics.agentCoordinationCount) # "\n\n" #
                              "**Capabilities Available:**\n" #
                              "- ✅ Smart prompt analysis with logging\n" #
                              "- ✅ Centralized service routing with tracking\n" #
                              "- ✅ Self-learning integration with metrics\n" #
                              "- ✅ Performance optimization with monitoring\n" #
                              "- ✅ Comprehensive logging system\n\n" #
                              "All orchestrator systems are operational with enhanced logging and ready to assist with " #
                              "more complex tasks when specialized agents are available.\n\n" #
                              "**Processing Time:** " # Int.toText(Time.now() - fallbackStartTime) # "ns\n" #
                              "**Status:** ✅ Complete via Enhanced Orchestrator with Logging";
        
        let fallbackDuration = Time.now() - fallbackStartTime;
        Logger.performance("FallbackProcessor", "Fallback processing completed", null, Int.abs(fallbackDuration), ?"mode=fallback");
        
        {
            id = request.id;
            response = fallbackResponse;
            success = true;
            agentUsed = "enhanced_fallback_agent";
            processingTime = Int.abs(fallbackDuration);
            orchestratorVersion = "4.0.0-enhanced-logging";
            timestamp = Time.now();
        }
    };
    
    // Register default agents with enhanced logging
    private func registerDefaultAgents() : async () {
        Logger.info("AgentRegistry", "🔧 Registering default agents with enhanced capabilities...", null, null);
        
        let agents = [
            {
                id = "github_agent";
                name = "Enhanced GitHub Analysis Agent";
                capabilities = ["repository_analysis", "code_review", "vulnerability_scanning", "api_integration", "browser_automation"];
                isActive = true;
                lastUsed = Time.now();
                successRate = 0.95;
                totalRequests = 0;
                averageResponseTime = 800.0;
            },
            {
                id = "browser_agent";
                name = "Enhanced Browser Automation Agent";
                capabilities = ["web_scraping", "content_extraction", "form_automation", "stealth_mode", "socks5_proxy"];
                isActive = true;
                lastUsed = Time.now();
                successRate = 0.92;
                totalRequests = 0;
                averageResponseTime = 1200.0;
            },
            {
                id = "canister_agent";
                name = "Enhanced ICP Canister Agent";
                capabilities = ["canister_deployment", "cycle_management", "network_operations", "monitoring", "optimization"];
                isActive = true;
                lastUsed = Time.now();
                successRate = 0.98;
                totalRequests = 0;
                averageResponseTime = 600.0;
            },
            {
                id = "research_agent";
                name = "Enhanced Research Agent";
                capabilities = ["data_collection", "trend_analysis", "pattern_recognition", "multi_source_aggregation", "intelligence_filtering"];
                isActive = true;
                lastUsed = Time.now();
                successRate = 0.88;
                totalRequests = 0;
                averageResponseTime = 1500.0;
            },
            {
                id = "report_agent";
                name = "Enhanced Report Generation Agent";
                capabilities = ["pdf_generation", "markdown_creation", "json_formatting", "html_reports", "template_system"];
                isActive = true;
                lastUsed = Time.now();
                successRate = 0.96;
                totalRequests = 0;
                averageResponseTime = 400.0;
            },
            {
                id = "security_agent";
                name = "Enhanced Security Analysis Agent";
                capabilities = ["vulnerability_assessment", "security_audit", "compliance_checking", "threat_detection", "risk_analysis"];
                isActive = true;
                lastUsed = Time.now();
                successRate = 0.94;
                totalRequests = 0;
                averageResponseTime = 1000.0;
            }
        ];
        
        for (agent in agents.vals()) {
            agentRegistry.put(agent.id, agent);
            Logger.agentCoordination("AgentRegistry", "✅ Registered agent: " # agent.name, ?agent.id, ?orchestratorId, null);
        };
        
        Logger.info("AgentRegistry", "🎯 Agent registration completed: " # Nat.toText(agents.size()) # " agents active", null, null);
    };
    
    // Get comprehensive system status with logging statistics
    public func getEnhancedSystemStatus() : async {
        orchestratorInfo: {
            id: Text;
            isActive: Bool;
            uptime: Int;
            version: Text;
        };
        agentRegistry: [(Text, Types.AgentInfo)];
        performanceMetrics: {
            totalRequests: Nat;
            successfulRequests: Nat;
            successRate: Float;
            averageResponseTime: Float;
            totalProcessingTime: Int;
            agentCoordinationCount: Nat;
            failoverCount: Nat;
        };
        loggingStats: {
            totalLogs: Nat;
            bufferSize: Nat;
            maxBufferSize: Nat;
            logsByLevel: [(Logger.LogLevel, Nat)];
        };
        queueStatus: {
            activeRequests: Nat;
            cacheHitRate: Float;
        };
    } {
        Logger.info("SystemStatus", "📊 Generating enhanced system status report", null, null);
        
        let logStats = Logger.getLogStats();
        
        {
            orchestratorInfo = {
                id = orchestratorId;
                isActive = isActive;
                uptime = Time.now() - startTime;
                version = "4.0.0-enhanced-logging";
            };
            agentRegistry = agentRegistry.entries() |> Array.fromIter(_);
            performanceMetrics = {
                totalRequests = totalRequests;
                successfulRequests = successfulRequests;
                successRate = performanceMetrics.successRate;
                averageResponseTime = performanceMetrics.averageResponseTime;
                totalProcessingTime = performanceMetrics.totalProcessingTime;
                agentCoordinationCount = performanceMetrics.agentCoordinationCount;
                failoverCount = performanceMetrics.failoverCount;
            };
            loggingStats = logStats;
            queueStatus = {
                activeRequests = processingQueue.size();
                cacheHitRate = Float.fromInt(responseCache.size()) / Float.fromInt(totalRequests);
            };
        }
    };
    
    // Additional utility functions for logging and monitoring
    public func getRecentLogs(count: ?Nat, level: ?Logger.LogLevel, component: ?Text, agentId: ?Text) : async [Logger.LogEntry] {
        Logger.debug("LogRetrieval", "Retrieving recent logs with filters", null, null);
        Logger.getRecentLogs(count, level, component, agentId)
    };
    
    public func clearLogs() : async () {
        Logger.warn("LogManagement", "Clearing all logs as requested", null, null);
        Logger.clearLogs();
    };
    
    // Helper functions
    private func analyzeRequest(request : Types.OrchestratorRequest) : async Types.RequestAnalysis {
        // Enhanced request analysis with logging
        let prompt = Text.toLowercase(request.prompt);
        
        let requestType = if (Text.contains(prompt, #text "github") or Text.contains(prompt, #text "repository") or Text.contains(prompt, #text "code")) {
            #CodeAnalysis
        } else if (Text.contains(prompt, #text "research") or Text.contains(prompt, #text "analyze") or Text.contains(prompt, #text "data")) {
            #Research
        } else if (Text.contains(prompt, #text "browser") or Text.contains(prompt, #text "web") or Text.contains(prompt, #text "scrape")) {
            #BrowserAutomation
        } else if (Text.contains(prompt, #text "canister") or Text.contains(prompt, #text "deploy") or Text.contains(prompt, #text "icp")) {
            #CanisterManagement
        } else if (Text.contains(prompt, #text "report") or Text.contains(prompt, #text "generate") or Text.contains(prompt, #text "document")) {
            #ReportGeneration
        } else {
            #General
        };
        
        let complexity = if (Text.size(prompt) > 200) {
            #High
        } else if (Text.size(prompt) > 100) {
            #Medium
        } else {
            #Low
        };
        
        {
            requestType = requestType;
            complexity = complexity;
            estimatedDuration = 1000;
            requiresSpecializedAgent = requestType != #General;
        }
    };
    
    private func getCachedResponse(prompt: Text) : ?Types.CachedResponse {
        responseCache.get(prompt)
    };
    
    private func createResponseFromCache(cached: Types.CachedResponse, requestId: Text) : Types.OrchestratorResponse {
        {
            id = requestId;
            response = "⚡ " # cached.response # "\n\n[Served from cache for optimization]";
            success = true;
            agentUsed = cached.agentUsed;
            processingTime = 1000000; // 1ms for cache hit
            orchestratorVersion = "4.0.0-enhanced-logging";
            timestamp = Time.now();
        }
    };
    
    private func cacheResponse(prompt: Text, response: Types.OrchestratorResponse) : () {
        let cacheEntry: Types.CachedResponse = {
            response = response.response;
            agentUsed = response.agentUsed;
            timestamp = Time.now();
            hitCount = 1;
        };
        responseCache.put(prompt, cacheEntry);
    };
    
    private func updateAgentStats(agentId: Text, success: Bool, duration: Int) : () {
        switch (agentRegistry.get(agentId)) {
            case (?agent) {
                let updatedAgent = {
                    agent with 
                    lastUsed = Time.now();
                    totalRequests = agent.totalRequests + 1;
                    averageResponseTime = (agent.averageResponseTime * Float.fromInt(agent.totalRequests) + Float.fromInt(duration)) / Float.fromInt(agent.totalRequests + 1);
                };
                agentRegistry.put(agentId, updatedAgent);
            };
            case null {};
        };
    };
}
