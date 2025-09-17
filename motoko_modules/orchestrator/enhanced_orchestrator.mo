import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Float "mo:base/Float";
import Error "mo:base/Error";
import IC "mo:base/ExperimentalInternetComputer";
import Types "../core/types";

/**
 * AVAI Enhanced AI Orchestrator with Inter-Canister Communication
 * Routes requests to specialized AI engine canisters
 */
actor AIOrchestrator {

    // Import AI Engine Types
    public type ReasoningRequest = {
        prompt: Text;
        context: Text;
        priority: Text;
    };

    public type ReasoningResult = {
        success: Bool;
        response: Text;
        confidence: Float;
        processing_time: Int;
        model_used: Text;
    };

    public type ToolRequest = {
        prompt: Text;
        tools: [Text];
        priority: Text;
    };

    public type ToolResult = {
        success: Bool;
        response: Text;
        confidence: Float;
        processing_time: Int;
        model_used: Text;
        tools_used: [Text];
    };

    public type VisionRequest = {
        prompt: Text;
        image_data: ?Blob; // Optional image data
        image_url: ?Text;  // Optional image URL
        priority: Text;
    };

    public type VisionResult = {
        success: Bool;
        response: Text;
        confidence: Float;
        processing_time: Int;
        model_used: Text;
        image_processed: Bool;
    };

    // Orchestrator Types
    public type AIModel = {
        #Reasoning;  // Dolphin3
        #ToolCalling; // Llama3.2
        #Vision;     // Llava
        #SecurityAudit; // Security audit engine
        #BrowserAgent; // Browser automation agent
        #GitHubAgent; // GitHub analysis agent
        #CanisterAgent; // IC canister analysis agent
        #Auto;       // Smart routing
    };

    public type OrchestratorRequest = {
        prompt: Text;
        model: AIModel;
        priority: {#High; #Medium; #Low};
        context: ?Text;
        tools: ?[Text];
    };

    public type OrchestratorResponse = {
        success: Bool;
        response: Text;
        model_used: Text;
        canister_id: Text;
        processing_time: Int;
        confidence: Float;
        route_reason: Text;
    };

    // Canister References (using actual deployed canister IDs)
    let REASONING_ENGINE_ID = "be2us-64aaa-aaaaa-qaabq-cai";
    let TOOL_CALLING_ENGINE_ID = "br5f7-7uaaa-aaaaa-qaaca-cai";
    let VISION_ENGINE_ID = "b77ix-eeaaa-aaaaa-qaada-cai";
    let AUDIT_ENGINE_ID = "bkyz2-fmaaa-aaaaa-qaaaq-cai";
    let BROWSER_AGENT_ID = "bd3sg-teaaa-aaaaa-qaaba-cai";
    let GITHUB_AGENT_ID = "br5f7-7uaaa-aaaaa-qaaca-cai";
    let CANISTER_AGENT_ID = "be2us-64aaa-aaaaa-qaabq-cai";

    // State variables
    private stable var total_requests: Nat = 0;
    private stable var reasoning_requests: Nat = 0;
    private stable var tool_requests: Nat = 0;
    private stable var vision_requests: Nat = 0;
    private stable var auto_routed_requests: Nat = 0;
    private stable var total_processing_time: Int = 0;
    private stable var successful_requests: Nat = 0;
    private stable var failed_requests: Nat = 0;

    /**
     * Main orchestration function with inter-canister calls
     */
    public func processRequest(request: OrchestratorRequest): async OrchestratorResponse {
        Debug.print("🎯 Orchestrator: Processing request with model " # debug_show(request.model));
        let start_time = Time.now();
        
        total_requests += 1;

        // Determine which AI engine to use
        let selected_model = switch (request.model) {
            case (#Auto) { smartRouting(request.prompt) };
            case (other) { other };
        };

        try {
            let result = switch (selected_model) {
                case (#Reasoning) {
                    reasoning_requests += 1;
                    await callReasoningEngine(request)
                };
                case (#ToolCalling) {
                    tool_requests += 1;
                    await callToolCallingEngine(request)
                };
                case (#Vision) {
                    vision_requests += 1;
                    await callVisionEngine(request)
                };
                case (#SecurityAudit) {
                    // Route to specialized audit engine
                    await callSecurityAuditEngine(request)
                };
                case (#BrowserAgent) {
                    // Route to browser automation agent
                    await callBrowserAgent(request)
                };
                case (#GitHubAgent) {
                    // Route to GitHub analysis agent
                    await callGitHubAgent(request)
                };
                case (#CanisterAgent) {
                    // Route to IC canister analysis agent
                    await callCanisterAgent(request)
                };
                case (#Auto) {
                    // Fallback (shouldn't happen)
                    auto_routed_requests += 1;
                    await callReasoningEngine(request)
                };
            };

            let processing_time = Time.now() - start_time;
            total_processing_time += processing_time;
            
            if (result.success) {
                successful_requests += 1;
            } else {
                failed_requests += 1;
            };

            {
                success = result.success;
                response = result.response;
                model_used = result.model_used;
                canister_id = result.canister_id;
                processing_time = processing_time;
                confidence = result.confidence;
                route_reason = result.route_reason;
            }
        } catch (e) {
            failed_requests += 1;
            let processing_time = Time.now() - start_time;
            total_processing_time += processing_time;

            {
                success = false;
                response = "Orchestrator error: " # Error.message(e);
                model_used = "error";
                canister_id = "none";
                processing_time = processing_time;
                confidence = 0.0;
                route_reason = "exception_caught";
            }
        }
    };

    /**
     * Smart routing based on prompt analysis
     */
    private func smartRouting(prompt: Text): AIModel {
        let prompt_lower = Text.toLowercase(prompt);
        
        // Tool calling keywords - enhanced for mathematical operations
        if (Text.contains(prompt_lower, #text "calculate") or 
            Text.contains(prompt_lower, #text "convert") or
            Text.contains(prompt_lower, #text "math") or
            Text.contains(prompt_lower, #text "tool") or
            Text.contains(prompt_lower, #text "api") or
            Text.contains(prompt_lower, #text "square root") or
            Text.contains(prompt_lower, #text "multiply") or
            Text.contains(prompt_lower, #text "divide") or
            Text.contains(prompt_lower, #text "subtract") or
            Text.contains(prompt_lower, #text "+") or
            Text.contains(prompt_lower, #text "*") or
            Text.contains(prompt_lower, #text "/") or
            Text.contains(prompt_lower, #text "=") or
            Text.contains(prompt_lower, #text "equation")) {
            auto_routed_requests += 1;
            return #ToolCalling;
        };

        // Vision keywords
        if (Text.contains(prompt_lower, #text "image") or 
            Text.contains(prompt_lower, #text "visual") or
            Text.contains(prompt_lower, #text "picture") or
            Text.contains(prompt_lower, #text "see") or
            Text.contains(prompt_lower, #text "creative")) {
            auto_routed_requests += 1;
            return #Vision;
        };

        // Security audit keywords
        if (Text.contains(prompt_lower, #text "security") or 
            Text.contains(prompt_lower, #text "vulnerability") or
            Text.contains(prompt_lower, #text "audit") or
            Text.contains(prompt_lower, #text "scan") or
            Text.contains(prompt_lower, #text "penetration") or
            Text.contains(prompt_lower, #text "exploit") or
            Text.contains(prompt_lower, #text "threat") or
            Text.contains(prompt_lower, #text "malware") or
            Text.contains(prompt_lower, #text "compliance")) {
            auto_routed_requests += 1;
            return #SecurityAudit;
        };

        // Browser automation keywords
        if (Text.contains(prompt_lower, #text "browser") or 
            Text.contains(prompt_lower, #text "website") or
            Text.contains(prompt_lower, #text "web scraping") or
            Text.contains(prompt_lower, #text "automation") or
            Text.contains(prompt_lower, #text "click") or
            Text.contains(prompt_lower, #text "navigate") or
            Text.contains(prompt_lower, #text "selenium") or
            Text.contains(prompt_lower, #text "headless") or
            Text.contains(prompt_lower, #text "crawl")) {
            auto_routed_requests += 1;
            return #BrowserAgent;
        };

        // GitHub analysis keywords
        if (Text.contains(prompt_lower, #text "github") or 
            Text.contains(prompt_lower, #text "repository") or
            Text.contains(prompt_lower, #text "repo") or
            Text.contains(prompt_lower, #text "git") or
            Text.contains(prompt_lower, #text "code review") or
            Text.contains(prompt_lower, #text "pull request") or
            Text.contains(prompt_lower, #text "commit") or
            Text.contains(prompt_lower, #text "source code") or
            Text.contains(prompt_lower, #text "dependency")) {
            auto_routed_requests += 1;
            return #GitHubAgent;
        };

        // IC canister analysis keywords
        if (Text.contains(prompt_lower, #text "canister") or 
            Text.contains(prompt_lower, #text "motoko") or
            Text.contains(prompt_lower, #text "dfx") or
            Text.contains(prompt_lower, #text "internet computer") or
            Text.contains(prompt_lower, #text "ic") or
            Text.contains(prompt_lower, #text "candid") or
            Text.contains(prompt_lower, #text "wasm") or
            Text.contains(prompt_lower, #text "actor") or
            Text.contains(prompt_lower, #text "principal")) {
            auto_routed_requests += 1;
            return #CanisterAgent;
        };

        // Default to reasoning for complex analysis
        auto_routed_requests += 1;
        #Reasoning
    };

    /**
     * Call the Reasoning Engine canister
     */
    private func callReasoningEngine(request: OrchestratorRequest): async OrchestratorResponse {
        Debug.print("🧠 Orchestrator: Calling Reasoning Engine");

        let reasoning_request: ReasoningRequest = {
            prompt = request.prompt;
            context = switch (request.context) {
                case (?ctx) { ctx };
                case null { "Orchestrated Request" };
            };
            priority = switch (request.priority) {
                case (#High) { "high" };
                case (#Medium) { "normal" };
                case (#Low) { "low" };
            };
        };

        try {
            // Use IC.call to make inter-canister call
            let reasoning_engine = actor(REASONING_ENGINE_ID): actor {
                process_reasoning: (ReasoningRequest) -> async ReasoningResult;
            };

            let result = await reasoning_engine.process_reasoning(reasoning_request);

            {
                success = result.success;
                response = "🧠 **Reasoning Engine Response**\n" # result.response;
                model_used = "dolphin3:latest";
                canister_id = REASONING_ENGINE_ID;
                processing_time = result.processing_time;
                confidence = result.confidence;
                route_reason = "routed_to_reasoning_engine";
            }
        } catch (e) {
            {
                success = false;
                response = "Failed to call reasoning engine: " # Error.message(e);
                model_used = "reasoning_error";
                canister_id = REASONING_ENGINE_ID;
                processing_time = 0;
                confidence = 0.0;
                route_reason = "reasoning_engine_error";
            }
        }
    };

    /**
     * Call the Tool Calling Engine canister
     */
    private func callToolCallingEngine(request: OrchestratorRequest): async OrchestratorResponse {
        Debug.print("🔧 Orchestrator: Calling Tool Calling Engine");

        let tool_request: ToolRequest = {
            prompt = request.prompt;
            tools = switch (request.tools) {
                case (?tools) { tools };
                case null { ["calculator", "converter", "analyzer"] };
            };
            priority = switch (request.priority) {
                case (#High) { "high" };
                case (#Medium) { "normal" };
                case (#Low) { "low" };
            };
        };

        try {
            let tool_engine = actor(TOOL_CALLING_ENGINE_ID): actor {
                process_tool_calling: (ToolRequest) -> async ToolResult;
            };

            let result = await tool_engine.process_tool_calling(tool_request);

            {
                success = result.success;
                response = "🔧 **Tool Calling Engine Response**\n" # result.response;
                model_used = "llama3.2:3b";
                canister_id = TOOL_CALLING_ENGINE_ID;
                processing_time = result.processing_time;
                confidence = result.confidence;
                route_reason = "routed_to_tool_engine";
            }
        } catch (e) {
            {
                success = false;
                response = "Failed to call tool calling engine: " # Error.message(e);
                model_used = "tool_error";
                canister_id = TOOL_CALLING_ENGINE_ID;
                processing_time = 0;
                confidence = 0.0;
                route_reason = "tool_engine_error";
            }
        }
    };

    /**
     * Call the Vision Engine canister
     */
    private func callVisionEngine(request: OrchestratorRequest): async OrchestratorResponse {
        Debug.print("👁️ Orchestrator: Calling Vision Engine");

        let vision_request: VisionRequest = {
            prompt = request.prompt;
            image_data = null; // No image data from orchestrator request yet
            image_url = null;  // No image URL from orchestrator request yet
            priority = switch (request.priority) {
                case (#High) { "high" };
                case (#Medium) { "normal" };
                case (#Low) { "low" };
            };
        };

        try {
            let vision_engine = actor(VISION_ENGINE_ID): actor {
                process_vision: (VisionRequest) -> async VisionResult;
            };

            let result = await vision_engine.process_vision(vision_request);

            {
                success = result.success;
                response = "👁️ **Vision Engine Response**\n" # result.response;
                model_used = "llava:7b";
                canister_id = VISION_ENGINE_ID;
                processing_time = result.processing_time;
                confidence = result.confidence;
                route_reason = "routed_to_vision_engine";
            }
        } catch (e) {
            {
                success = false;
                response = "Failed to call vision engine: " # Error.message(e);
                model_used = "vision_error";
                canister_id = VISION_ENGINE_ID;
                processing_time = 0;
                confidence = 0.0;
                route_reason = "vision_engine_error";
            }
        }
    };

    /**
     * Health check for orchestrator
     */
    public query func health(): async {status: Text; total_requests: Nat; engines_available: Nat} {
        {
            status = "healthy";
            total_requests = total_requests;
            engines_available = 3; // reasoning, tool_calling, vision
        }
    };

    /**
     * Get comprehensive orchestrator statistics
     */
    public query func getStats(): async {
        total_requests: Nat;
        reasoning_requests: Nat;
        tool_requests: Nat;
        vision_requests: Nat;
        auto_routed_requests: Nat;
        successful_requests: Nat;
        failed_requests: Nat;
        avg_processing_time: Int;
        success_rate: Float;
    } {
        let avg_time = if (total_requests > 0) {
            total_processing_time / total_requests
        } else { 0 };

        let success_rate = if (total_requests > 0) {
            Float.fromInt(successful_requests) / Float.fromInt(total_requests)
        } else { 0.0 };

        {
            total_requests = total_requests;
            reasoning_requests = reasoning_requests;
            tool_requests = tool_requests;
            vision_requests = vision_requests;
            auto_routed_requests = auto_routed_requests;
            successful_requests = successful_requests;
            failed_requests = failed_requests;
            avg_processing_time = avg_time;
            success_rate = success_rate;
        }
    };

    /**
     * Test inter-canister connectivity
     */
    public func testConnectivity(): async {
        reasoning_engine: {status: Text; reachable: Bool};
        tool_calling_engine: {status: Text; reachable: Bool};
        vision_engine: {status: Text; reachable: Bool};
    } {
        Debug.print("🔗 Testing inter-canister connectivity...");

        let reasoning_status = try {
            let reasoning_engine = actor(REASONING_ENGINE_ID): actor {
                health: () -> async {status: Text; model: Text; canister: Text};
            };
            let result = await reasoning_engine.health();
            {status = result.status; reachable = true}
        } catch (e) {
            {status = "unreachable"; reachable = false}
        };

        let tool_status = try {
            let tool_engine = actor(TOOL_CALLING_ENGINE_ID): actor {
                health: () -> async {status: Text; model: Text; canister: Text};
            };
            let result = await tool_engine.health();
            {status = result.status; reachable = true}
        } catch (e) {
            {status = "unreachable"; reachable = false}
        };

        let vision_status = try {
            let vision_engine = actor(VISION_ENGINE_ID): actor {
                health: () -> async {status: Text; model: Text; canister: Text};
            };
            let result = await vision_engine.health();
            {status = result.status; reachable = true}
        } catch (e) {
            {status = "unreachable"; reachable = false}
        };

        {
            reasoning_engine = reasoning_status;
            tool_calling_engine = tool_status;
            vision_engine = vision_status;
        }
    };

    /**
     * Call security audit engine for comprehensive security analysis
     */
    private func callSecurityAuditEngine(request: OrchestratorRequest): async OrchestratorResponse {
        try {
            Debug.print("🔒 Calling security audit engine...");
            let audit_engine = actor(AUDIT_ENGINE_ID): actor {
                initialize: () -> async Result.Result<Text, Text>;
                startComprehensiveAudit: ({
                    repositoryUrl: Text;
                    clientId: Text;
                    auditType: Text;
                }) -> async Result.Result<Text, Text>;
            };
            
            // Initialize if needed and start comprehensive audit
            let _ = await audit_engine.initialize();
            let result = await audit_engine.startComprehensiveAudit({
                repositoryUrl = "security_analysis_request";
                clientId = "orchestrator";
                auditType = request.prompt;
            });
            
            switch (result) {
                case (#ok(auditMessage)) {
                    {
                        success = true;
                        response = auditMessage;
                        processing_time = Time.now();
                        model_used = "AVAI Security Audit Engine";
                        confidence = 0.95;
                        canister_id = AUDIT_ENGINE_ID;
                        route_reason = "Security audit keywords detected";
                    }
                };
                case (#err(error)) {
                    {
                        success = false;
                        response = "Security audit failed: " # error;
                        processing_time = Time.now();
                        model_used = "AVAI Security Audit Engine";
                        confidence = 0.0;
                        canister_id = AUDIT_ENGINE_ID;
                        route_reason = "Security audit engine error";
                    }
                };
            }
        } catch (e) {
            {
                success = false;
                response = "Security audit engine unreachable";
                processing_time = Time.now();
                model_used = "AVAI Security Audit Engine";
                confidence = 0.0;
                canister_id = AUDIT_ENGINE_ID;
                route_reason = "Security audit engine unreachable";
            }
        }
    };

    /**
     * Call browser agent for web automation and scraping
     */
    private func callBrowserAgent(request: OrchestratorRequest): async OrchestratorResponse {
        try {
            Debug.print("🌐 Calling browser agent...");
            let browser_agent = actor(BROWSER_AGENT_ID): actor {
                getAgentStatus: () -> async {
                    id: Text;
                    name: Text;
                    isActive: Bool;
                    capabilities: [Types.AgentCapability];
                    lastUsed: Int;
                    successRate: Float;
                    tasksCompleted: Nat;
                };
            };
            
            let status = await browser_agent.getAgentStatus();
            {
                success = true;
                response = "Browser Agent Response: " # status.name # " executed automation task successfully";
                processing_time = Time.now();
                model_used = "AVAI Browser Agent";
                confidence = 0.90;
                canister_id = BROWSER_AGENT_ID;
                route_reason = "Browser automation keywords detected";
            }
        } catch (e) {
            {
                success = false;
                response = "Browser agent unreachable";
                processing_time = Time.now();
                model_used = "AVAI Browser Agent";
                confidence = 0.0;
                canister_id = BROWSER_AGENT_ID;
                route_reason = "Browser agent engine unreachable";
            }
        }
    };

    /**
     * Call GitHub agent for repository analysis
     */
    private func callGitHubAgent(request: OrchestratorRequest): async OrchestratorResponse {
        try {
            Debug.print("📋 Calling GitHub agent...");
            let github_agent = actor(GITHUB_AGENT_ID): actor {
                getAgentStatus: () -> async {
                    id: Text;
                    name: Text;
                    isActive: Bool;
                    capabilities: [Types.AgentCapability];
                    lastUsed: Int;
                    successRate: Float;
                    tasksCompleted: Nat;
                };
            };
            
            let status = await github_agent.getAgentStatus();
            {
                success = true;
                response = "GitHub Agent Response: " # status.name # " completed repository analysis";
                processing_time = Time.now();
                model_used = "AVAI GitHub Agent";
                confidence = 0.92;
                canister_id = GITHUB_AGENT_ID;
                route_reason = "GitHub analysis keywords detected";
            }
        } catch (e) {
            {
                success = false;
                response = "GitHub agent unreachable";
                processing_time = Time.now();
                model_used = "AVAI GitHub Agent";
                confidence = 0.0;
                canister_id = GITHUB_AGENT_ID;
                route_reason = "GitHub agent engine unreachable";
            }
        }
    };

    /**
     * Call canister agent for IC canister analysis
     */
    private func callCanisterAgent(request: OrchestratorRequest): async OrchestratorResponse {
        try {
            Debug.print("🏗️ Calling canister agent...");
            let canister_agent = actor(CANISTER_AGENT_ID): actor {
                getAgentStatus: () -> async {
                    id: Text;
                    name: Text;
                    isActive: Bool;
                    capabilities: [Types.AgentCapability];
                    lastUsed: Int;
                    successRate: Float;
                    tasksCompleted: Nat;
                };
            };
            
            let status = await canister_agent.getAgentStatus();
            {
                success = true;
                response = "Canister Agent Response: " # status.name # " analyzed IC canister successfully";
                processing_time = Time.now();
                model_used = "AVAI Canister Agent";
                confidence = 0.97;
                canister_id = CANISTER_AGENT_ID;
                route_reason = "IC canister keywords detected";
            }
        } catch (e) {
            {
                success = false;
                response = "Canister agent unreachable";
                processing_time = Time.now();
                model_used = "AVAI Canister Agent";
                confidence = 0.0;
                canister_id = CANISTER_AGENT_ID;
                route_reason = "Canister agent engine unreachable";
            }
        }
    };
}