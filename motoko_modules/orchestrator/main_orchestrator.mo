/**
 * AVAI Main Orchestrator - Central coordination system for all AVAI agents
 * Implements intelligent task routing, resource management, and unified control
 */

import Types "../core/types";
import Utils "../core/utils";
import PromptAnalyzer "./prompt_analyzer";
import TaskRouter "./task_router";
import UnifiedManager "./unified_manager";

import Time "mo:base/Time";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Text "mo:base/Text";

actor class AVAIOrchestrator() = {
    
    // ================================
    // STATE MANAGEMENT
    // ================================
    
    /// System configuration
    private stable var config: ?Types.SystemConfig = null;
    
    /// Current system status
    private stable var systemStatus: Types.SystemStatus = #Initializing;
    
    /// Active tasks tracking
    private var activeTasks = HashMap.HashMap<Text, Types.TaskStatus>(10, Text.equal, Text.hash);
    
    /// Agent performance metrics
    private var agentMetrics = HashMap.HashMap<Text, Types.AgentMetrics>(10, Text.equal, Text.hash);
    
    /// User contexts for personalized responses
    private var userContexts = HashMap.HashMap<Text, Types.UserContext>(10, Text.equal, Text.hash);
    
    /// System startup timestamp
    private stable var startupTime: Int = 0;
    
    /// Task counter for unique IDs
    private stable var taskCounter: Nat = 0;
    
    // ================================
    // INITIALIZATION
    // ================================
    
    /// Initialize the AVAI orchestrator system
    public func initialize(systemConfig: Types.SystemConfig): async Types.AVAIResult<Text> {
        Utils.debugLog("🚀 Initializing AVAI Orchestrator...");
        
        // Validate configuration
        switch (Utils.validateConfig(systemConfig)) {
            case (#err(error)) {
                Utils.logError(error, "Configuration validation");
                return Types.error<Text>(error);
            };
            case (#ok(validConfig)) {
                config := ?validConfig;
            };
        };
        
        // Initialize core components
        try {
            // Initialize prompt analyzer
            await PromptAnalyzer.initialize();
            
            // Initialize task router
            await TaskRouter.initialize(systemConfig.agents);
            
            // Initialize unified manager
            await UnifiedManager.initialize(systemConfig);
            
            // Set system status
            systemStatus := #Active;
            startupTime := Time.now();
            
            Utils.debugLog("✅ AVAI Orchestrator initialized successfully");
            Types.success<Text>("AVAI Orchestrator initialized successfully")
            
        } catch (error) {
            systemStatus := #Error;
            let errorMsg = "Failed to initialize orchestrator: " # debug_show(error);
            Utils.debugLog("❌ " # errorMsg);
            Types.error<Text>(#SystemError(errorMsg))
        }
    };
    
    /// Get system status and health information
    public query func getSystemStatus(): async Types.APIResponse<{
        status: Types.SystemStatus;
        uptime: Nat;
        activeTasks: Nat;
        totalProcessed: Nat;
        agentCount: Nat;
        memoryUsage: Nat;
    }> {
        let uptime = if (startupTime > 0) {
            Int.abs(Time.now() - startupTime) / 1000000 // milliseconds
        } else { 0 };
        
        {
            success = true;
            data = ?{
                status = systemStatus;
                uptime = uptime;
                activeTasks = activeTasks.size();
                totalProcessed = taskCounter;
                agentCount = agentMetrics.size();
                memoryUsage = 0; // Would be implemented with proper memory tracking
            };
            error = null;
            timestamp = Time.now();
            requestId = "status_" # Int.toText(Time.now());
            processingTime = 1;
        }
    };
    
    // ================================
    // MAIN PROCESSING INTERFACE
    // ================================
    
    /// Main entry point for processing prompts with full intelligence
    public func processPrompt(
        prompt: Text,
        userContext: ?Types.UserContext,
        options: ?{
            priority: ?Types.Priority;
            forceAgent: ?Text;
            enableLearning: ?Bool;
            timeoutMs: ?Nat;
        }
    ): async Types.AVAIResult<{
        response: Text;
        processingTime: Nat;
        agentUsed: Text;
        confidence: Float;
        learningApplied: Bool;
        fallbackUsed: Bool;
    }> {
        
        let startTime = Time.now();
        let taskId = await generateTaskId();
        
        Utils.debugLog("📥 Processing prompt: " # Utils.sanitizeForLogging(prompt));
        
        // Validate input
        switch (Utils.validatePrompt(prompt)) {
            case (#err(error)) {
                Utils.logError(error, "Prompt validation");
                return Types.error(error);
            };
            case (#ok(validPrompt)) {
                // Continue with validated prompt
            };
        };
        
        // Check system status
        if (systemStatus != #Active and systemStatus != #PythonFallback) {
            return Types.error(#SystemError("System not available: " # debug_show(systemStatus)));
        };
        
        // Update task status
        activeTasks.put(taskId, #Processing({ 
            started = Time.now(); 
            agent = "orchestrator" 
        }));
        
        try {
            // Step 1: Analyze prompt for intelligent routing
            let analysis = PromptAnalyzer.analyzePrompt(prompt, userContext);
            
            // Step 2: Determine priority and processing options
            let priority = switch (options) {
                case (?opts) {
                    switch (opts.priority) {
                        case (?p) { p };
                        case null { Utils.extractPriority(prompt) };
                    }
                };
                case null { Utils.extractPriority(prompt) };
            };
            
            // Step 3: Route task to appropriate agent(s)
            let routingResult = await TaskRouter.routeTask({
                id = taskId;
                prompt = prompt;
                category = analysis.category;
                priority = priority;
                context = userContext;
                forceAgent = switch (options) {
                    case (?opts) { opts.forceAgent };
                    case null { null };
                };
            });
            
            switch (routingResult) {
                case (#err(error)) {
                    activeTasks.put(taskId, #Failed({ error = error; timestamp = Time.now() }));
                    return Types.error(error);
                };
                case (#ok(routingInfo)) {
                    // Step 4: Execute task with unified manager
                    let executionResult = await UnifiedManager.executeTask({
                        id = taskId;
                        prompt = prompt;
                        agent = routingInfo.selectedAgent;
                        priority = priority;
                        context = userContext;
                        metadata = routingInfo.metadata;
                    });
                    
                    switch (executionResult) {
                        case (#err(error)) {
                            // Check if we should fall back to Python
                            if (shouldFallbackToPython(analysis.category, analysis.complexity)) {
                                Utils.debugLog("🐍 Falling back to Python for complex task");
                                let pythonResult = await fallbackToPython(taskId, prompt, analysis);
                                
                                switch (pythonResult) {
                                    case (#ok(result)) {
                                        let endTime = Time.now();
                                        let processingTime = Int.abs(endTime - startTime) / 1000000;
                                        
                                        activeTasks.put(taskId, #Completed({ 
                                            finished = endTime; 
                                            duration = processingTime 
                                        }));
                                        
                                        // Apply learning if enabled
                                        if (isLearningEnabled(options)) {
                                            await applyLearning(prompt, result.response, userContext, #PythonFallback);
                                        };
                                        
                                        return Types.success({
                                            response = result.response;
                                            processingTime = processingTime;
                                            agentUsed = "python_fallback";
                                            confidence = result.confidence;
                                            learningApplied = isLearningEnabled(options);
                                            fallbackUsed = true;
                                        });
                                    };
                                    case (#err(fallbackError)) {
                                        activeTasks.put(taskId, #Failed({ error = fallbackError; timestamp = Time.now() }));
                                        return Types.error(fallbackError);
                                    };
                                };
                            } else {
                                activeTasks.put(taskId, #Failed({ error = error; timestamp = Time.now() }));
                                return Types.error(error);
                            }
                        };
                        case (#ok(result)) {
                            let endTime = Time.now();
                            let processingTime = Int.abs(endTime - startTime) / 1000000;
                            
                            activeTasks.put(taskId, #Completed({ 
                                finished = endTime; 
                                duration = processingTime 
                            }));
                            
                            // Update agent metrics
                            updateAgentMetrics(result.agentUsed, processingTime, true);
                            
                            // Apply learning if enabled
                            if (isLearningEnabled(options)) {
                                await applyLearning(prompt, result.response, userContext, #Success);
                            };
                            
                            Utils.debugLog("✅ Task completed: " # taskId # " in " # Utils.formatDuration(processingTime));
                            
                            return Types.success({
                                response = result.response;
                                processingTime = processingTime;
                                agentUsed = result.agentUsed;
                                confidence = result.confidence;
                                learningApplied = isLearningEnabled(options);
                                fallbackUsed = false;
                            });
                        };
                    };
                };
            };
            
        } catch (error) {
            let errorMsg = "Orchestrator processing error: " # debug_show(error);
            activeTasks.put(taskId, #Failed({ 
                error = #ProcessingError(errorMsg); 
                timestamp = Time.now() 
            }));
            Utils.debugLog("❌ " # errorMsg);
            Types.error(#ProcessingError(errorMsg))
        }
    };
    
    // ================================
    // INTELLIGENT ROUTING
    // ================================
    
    /// Determine if Python fallback is needed
    private func shouldFallbackToPython(
        category: Types.PromptCategory,
        complexity: Float
    ): Bool {
        Utils.needsPythonFallback(category, complexity, getCurrentResourceUsage())
    };
    
    /// Get current system resource usage
    private func getCurrentResourceUsage(): Float {
        // Calculate based on active tasks and system metrics
        let activeTaskCount = Float.fromInt(activeTasks.size());
        let maxTasks = switch (config) {
            case (?cfg) { Float.fromInt(cfg.performance.maxConcurrentTasks) };
            case null { 10.0 };
        };
        
        Float.min(1.0, activeTaskCount / maxTasks)
    };
    
    /// Check if learning is enabled for this request
    private func isLearningEnabled(options: ?{
        priority: ?Types.Priority;
        forceAgent: ?Text;
        enableLearning: ?Bool;
        timeoutMs: ?Nat;
    }): Bool {
        switch (options) {
            case (?opts) {
                switch (opts.enableLearning) {
                    case (?enabled) { enabled };
                    case null { true }; // Default enabled
                };
            };
            case null { true }; // Default enabled
        }
    };
    
    // ================================
    // PYTHON FALLBACK INTEGRATION
    // ================================
    
    /// Fallback to Python system for complex operations
    private func fallbackToPython(
        taskId: Text,
        prompt: Text,
        analysis: {
            category: Types.PromptCategory;
            complexity: Float;
            keywords: [Text];
        }
    ): async Types.AVAIResult<{
        response: Text;
        confidence: Float;
        metadata: [(Text, Text)];
    }> {
        
        Utils.debugLog("🐍 Initiating Python fallback for task: " # taskId);
        
        // Mark task as delegated to Python
        activeTasks.put(taskId, #PythonDelegated({ 
            delegated = Time.now(); 
            reason = "Complex operation requiring Python libraries" 
        }));
        
        // This would integrate with the actual Python bridge
        // For now, return a placeholder response
        Types.success({
            response = "Python fallback executed for: " # prompt;
            confidence = 0.85;
            metadata = [
                ("fallback_reason", "complex_operation"),
                ("original_category", debug_show(analysis.category)),
                ("complexity_score", Float.toText(analysis.complexity))
            ];
        })
    };
    
    // ================================
    // LEARNING SYSTEM INTEGRATION
    // ================================
    
    /// Apply learning from successful interactions
    private func applyLearning(
        prompt: Text,
        response: Text,
        userContext: ?Types.UserContext,
        outcome: { #Success; #PythonFallback; #Failed }
    ): async () {
        
        try {
            // Extract learning signals
            let category = Utils.analyzePromptText(prompt);
            let keywords = Utils.extractKeywords(prompt);
            let responseQuality = calculateResponseQuality(response);
            
            // Update user context if provided
            switch (userContext) {
                case (?context) {
                    let updatedContext = updateUserLearningProfile(context, prompt, category, outcome);
                    userContexts.put(context.sessionId, updatedContext);
                };
                case null { /* No user context to update */ };
            };
            
            Utils.debugLog("🧠 Learning applied for prompt category: " # debug_show(category));
            
        } catch (error) {
            Utils.debugLog("⚠️ Learning application failed: " # debug_show(error));
        }
    };
    
    /// Calculate response quality score
    private func calculateResponseQuality(response: Text): Float {
        let length = Float.fromInt(response.size());
        let complexity = if (Text.contains(response, #text "```")) { 0.8 } else { 0.5 };
        let completeness = if (response.size() > 100) { 0.9 } else { 0.6 };
        
        Float.min(1.0, (complexity + completeness) / 2.0)
    };
    
    /// Update user learning profile
    private func updateUserLearningProfile(
        context: Types.UserContext,
        prompt: Text,
        category: Types.PromptCategory,
        outcome: { #Success; #PythonFallback; #Failed }
    ): Types.UserContext {
        
        // Update interaction history
        let updatedHistory = Array.append(context.interactionHistory, [prompt]);
        let trimmedHistory = if (updatedHistory.size() > 10) {
            Array.subArray(updatedHistory, updatedHistory.size() - 10, 10)
        } else {
            updatedHistory
        };
        
        // Update learning profile
        let updatedProfile = switch (context.learningProfile) {
            case (?profile) {
                ?{
                    preferredAgents = profile.preferredAgents;
                    commonTasks = addToCommonTasks(profile.commonTasks, category);
                    feedbackPatterns = profile.feedbackPatterns;
                    skillLevel = profile.skillLevel;
                    customSettings = profile.customSettings;
                }
            };
            case null {
                ?{
                    preferredAgents = [];
                    commonTasks = [category];
                    feedbackPatterns = [];
                    skillLevel = #Adaptive;
                    customSettings = [];
                }
            };
        };
        
        {
            sessionId = context.sessionId;
            userId = context.userId;
            preferences = context.preferences;
            interactionHistory = trimmedHistory;
            learningProfile = updatedProfile;
        }
    };
    
    /// Add category to common tasks list
    private func addToCommonTasks(
        currentTasks: [Types.PromptCategory],
        newCategory: Types.PromptCategory
    ): [Types.PromptCategory] {
        
        // Check if category already exists
        let exists = Array.find<Types.PromptCategory>(currentTasks, func(task) {
            debug_show(task) == debug_show(newCategory)
        }) != null;
        
        if (exists) {
            currentTasks
        } else {
            let updated = Array.append(currentTasks, [newCategory]);
            // Keep only last 5 common tasks
            if (updated.size() > 5) {
                Array.subArray(updated, updated.size() - 5, 5)
            } else {
                updated
            }
        }
    };
    
    // ================================
    // METRICS AND MONITORING
    // ================================
    
    /// Update agent performance metrics
    private func updateAgentMetrics(
        agentId: Text,
        responseTime: Nat,
        success: Bool
    ) {
        let currentMetrics = switch (agentMetrics.get(agentId)) {
            case (?metrics) { metrics };
            case null {
                {
                    taskCount = 0;
                    successRate = 0.0;
                    averageResponseTime = 0;
                    lastUsed = Time.now();
                    errorCount = 0;
                    qualityScore = 0.5;
                }
            };
        };
        
        let updatedMetrics = {
            taskCount = currentMetrics.taskCount + 1;
            successRate = if (success) {
                (currentMetrics.successRate * Float.fromInt(currentMetrics.taskCount) + 1.0) / 
                Float.fromInt(currentMetrics.taskCount + 1)
            } else {
                (currentMetrics.successRate * Float.fromInt(currentMetrics.taskCount)) / 
                Float.fromInt(currentMetrics.taskCount + 1)
            };
            averageResponseTime = (currentMetrics.averageResponseTime * currentMetrics.taskCount + responseTime) / 
                                (currentMetrics.taskCount + 1);
            lastUsed = Time.now();
            errorCount = if (success) { currentMetrics.errorCount } else { currentMetrics.errorCount + 1 };
            qualityScore = Utils.calculatePerformanceScore(
                responseTime, 
                currentMetrics.successRate, 
                Float.fromInt(currentMetrics.errorCount) / Float.fromInt(currentMetrics.taskCount + 1)
            );
        };
        
        agentMetrics.put(agentId, updatedMetrics);
    };
    
    /// Get agent performance metrics
    public query func getAgentMetrics(agentId: ?Text): async Types.APIResponse<[(Text, Types.AgentMetrics)]> {
        let metrics = switch (agentId) {
            case (?id) {
                switch (agentMetrics.get(id)) {
                    case (?m) { [(id, m)] };
                    case null { [] };
                }
            };
            case null {
                agentMetrics.entries() |> Iter.toArray(_)
            };
        };
        
        {
            success = true;
            data = ?metrics;
            error = null;
            timestamp = Time.now();
            requestId = "metrics_" # Int.toText(Time.now());
            processingTime = 1;
        }
    };
    
    // ================================
    // UTILITY FUNCTIONS
    // ================================
    
    /// Generate unique task ID
    private func generateTaskId(): async Text {
        taskCounter += 1;
        "avai_task_" # Nat.toText(taskCounter) # "_" # Int.toText(Time.now())
    };
    
    /// Get active task information
    public query func getActiveTasks(): async Types.APIResponse<[(Text, Types.TaskStatus)]> {
        {
            success = true;
            data = ?activeTasks.entries() |> Iter.toArray(_);
            error = null;
            timestamp = Time.now();
            requestId = "tasks_" # Int.toText(Time.now());
            processingTime = 1;
        }
    };
    
    /// Clear completed and failed tasks (cleanup)
    public func cleanupTasks(): async Nat {
        let beforeCount = activeTasks.size();
        let currentTime = Time.now();
        
        // Remove tasks older than 1 hour
        let cutoffTime = currentTime - (60 * 60 * 1000000); // 1 hour in nanoseconds
        
        for ((taskId, status) in activeTasks.entries()) {
            let shouldRemove = switch (status) {
                case (#Completed({ finished; duration })) { finished < cutoffTime };
                case (#Failed({ error; timestamp })) { timestamp < cutoffTime };
                case (#PythonDelegated({ delegated; reason })) { delegated < cutoffTime };
                case (_) { false }; // Keep active tasks
            };
            
            if (shouldRemove) {
                activeTasks.delete(taskId);
            };
        };
        
        let cleanedCount = beforeCount - activeTasks.size();
        Utils.debugLog("🧹 Cleaned up " # Nat.toText(cleanedCount) # " old tasks");
        cleanedCount
    };
}
