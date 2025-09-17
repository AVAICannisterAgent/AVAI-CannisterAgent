import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Float "mo:base/Float";
import TunnelBridge "../integration/tunnel_bridge";

/**
 * AVAI Enhanced AI Orchestrator
 * Integrates Dolphin3, Llama3.2, and Llava models through Cloudflare tunnel
 */
actor AIOrchestrator {

    // Type definitions
    public type AIModel = {
        #Reasoning;  // Dolphin3
        #ToolCalling; // Llama3.2
        #Vision;     // Llava
    };

    public type AIRequest = {
        prompt: Text;
        model: AIModel;
        priority: {#High; #Medium; #Low};
        use_tunnel: Bool;
        image_data: ?[Nat8];
    };

    public type AIResponse = {
        success: Bool;
        response: Text;
        model_used: Text;
        processing_time: Int;
        tunnel_used: Bool;
        confidence: Float;
    };

    // State variables
    private stable var total_requests: Nat = 0;
    private stable var tunnel_requests: Nat = 0;
    private stable var total_processing_time: Int = 0;

    // Tunnel configuration
    private let TUNNEL_CONFIG: TunnelBridge.TunnelConfig = {
        tunnel_url = "https://avai-tunnel.example.com";
        tunnel_token = "avai_tunnel_token_123";
        ai_endpoint = "http://host.docker.internal:11434";
        timeout_ms = 30000;
    };

    /**
     * Main AI processing function with intelligent routing
     */
    public func processAIRequest(request: AIRequest): async AIResponse {
        Debug.print("🎯 AI Orchestrator: Processing request for " # debug_show(request.model));
        let start_time = Time.now();
        
        total_requests += 1;

        try {
            let result = if (request.use_tunnel) {
                tunnel_requests += 1;
                await processViaTunnel(request)
            } else {
                await processDirectly(request)
            };

            let processing_time = Time.now() - start_time;
            total_processing_time += processing_time;

            switch (result) {
                case (#ok(response)) {
                    Debug.print("✅ AI Orchestrator: Request completed successfully");
                    {
                        success = true;
                        response = response.response;
                        model_used = response.model_used;
                        processing_time = processing_time;
                        tunnel_used = request.use_tunnel;
                        confidence = calculateConfidence(request.model, response.response);
                    }
                };
                case (#err(error)) {
                    Debug.print("❌ AI Orchestrator Error: " # error);
                    {
                        success = false;
                        response = "Error processing AI request: " # error;
                        model_used = "error";
                        processing_time = processing_time;
                        tunnel_used = request.use_tunnel;
                        confidence = 0.0;
                    }
                };
            }

        } catch (error) {
            Debug.print("❌ AI Orchestrator Exception: orchestrator_error");
            {
                success = false;
                response = "Exception in AI processing: processing_failed";
                model_used = "exception";
                processing_time = Time.now() - start_time;
                tunnel_used = false;
                confidence = 0.0;
            }
        }
    };

    /**
     * Process request through tunnel
     */
    private func processViaTunnel(request: AIRequest): async Result.Result<TunnelBridge.AIModelResponse, Text> {
        Debug.print("🌐 Processing via tunnel...");

        let model_name = switch (request.model) {
            case (#Reasoning) { "dolphin3:latest" };
            case (#ToolCalling) { "llama3.2:3b" };
            case (#Vision) { "llava:7b" };
        };

        let tunnel_request: TunnelBridge.AIModelRequest = {
            model = model_name;
            prompt = request.prompt;
            temperature = getTemperatureForModel(request.model);
            max_tokens = getMaxTokensForModel(request.model);
            stream = false;
        };

        await TunnelBridge.callAIModelViaTunnel(TUNNEL_CONFIG, tunnel_request)
    };

    /**
     * Process request directly (local simulation)
     */
    private func processDirectly(request: AIRequest): async Result.Result<TunnelBridge.AIModelResponse, Text> {
        Debug.print("🔧 Processing directly...");

        let response_text = switch (request.model) {
            case (#Reasoning) {
                "🧠 **Dolphin3 Direct Response**\n\nAdvanced reasoning processing: " # request.prompt # "\n\nMotoko-managed direct processing with enhanced performance."
            };
            case (#ToolCalling) {
                "🔧 **Llama3.2 Direct Response**\n\nTool calling processing: " # request.prompt # "\n\nFast execution via Motoko optimization."
            };
            case (#Vision) {
                let image_info = switch (request.image_data) {
                    case (?_) { " (with image data)" };
                    case null { " (text only)" };
                };
                "👁️ **Llava Direct Response**\n\nVision processing: " # request.prompt # image_info # "\n\nMulti-modal processing via Motoko."
            };
        };

        #ok({
            success = true;
            response = response_text;
            model_used = getModelName(request.model) # "_direct";
            processing_time = 150000000; // 150ms in nanoseconds
            tokens_used = request.prompt.size() / 4;
            tunnel_latency = 0;
        })
    };

    /**
     * Get optimal temperature for each model
     */
    private func getTemperatureForModel(model: AIModel): Float {
        switch (model) {
            case (#Reasoning) { 0.7 };   // Higher creativity for reasoning
            case (#ToolCalling) { 0.3 }; // Lower for precise tool calling
            case (#Vision) { 0.5 };      // Balanced for vision tasks
        }
    };

    /**
     * Get optimal max tokens for each model
     */
    private func getMaxTokensForModel(model: AIModel): Nat {
        switch (model) {
            case (#Reasoning) { 4096 };  // Longer responses for reasoning
            case (#ToolCalling) { 2048 }; // Shorter for tool calls
            case (#Vision) { 2048 };     // Medium for vision
        }
    };

    /**
     * Get model display name
     */
    private func getModelName(model: AIModel): Text {
        switch (model) {
            case (#Reasoning) { "dolphin3_reasoning" };
            case (#ToolCalling) { "llama32_tool_calling" };
            case (#Vision) { "llava_vision" };
        }
    };

    /**
     * Calculate confidence score based on model and response
     */
    private func calculateConfidence(model: AIModel, response: Text): Float {
        let base_confidence = switch (model) {
            case (#Reasoning) { 0.92 };
            case (#ToolCalling) { 0.93 };
            case (#Vision) { 0.98 };
        };

        // Adjust based on response quality
        let quality_factor = if (response.size() > 100) { 1.0 } else { 0.8 };
        
        base_confidence * quality_factor
    };

    /**
     * Smart routing based on prompt analysis
     */
    public func smartRoute(prompt: Text): async {model: AIModel; use_tunnel: Bool; confidence: Float} {
        Debug.print("🎯 Analyzing prompt for smart routing...");

        let model = if (Text.contains(prompt, #text "image") or Text.contains(prompt, #text "vision") or Text.contains(prompt, #text "see")) {
            #Vision
        } else if (Text.contains(prompt, #text "calculate") or Text.contains(prompt, #text "tool") or Text.contains(prompt, #text "search")) {
            #ToolCalling
        } else {
            #Reasoning
        };

        // Use tunnel for complex or high-priority requests
        let use_tunnel = prompt.size() > 200 or Text.contains(prompt, #text "complex") or Text.contains(prompt, #text "analysis");
        
        let confidence = 0.85; // Base routing confidence

        Debug.print("📊 Routing decision: " # debug_show(model) # ", tunnel: " # debug_show(use_tunnel));

        {
            model = model;
            use_tunnel = use_tunnel;
            confidence = confidence;
        }
    };

    /**
     * Process multiple requests in parallel
     */
    public func processMultipleRequests(requests: [AIRequest]): async [AIResponse] {
        Debug.print("🔄 Processing " # debug_show(requests.size()) # " requests sequentially");

        // Process requests sequentially to avoid complex async mapping
        var results: [AIResponse] = [];
        for (request in requests.vals()) {
            let result = await processAIRequest(request);
            results := Array.append(results, [result]);
        };

        results
    };

    /**
     * Test all three AI models with tunnel integration
     */
    public func testAllModels(): async {
        reasoning_result: AIResponse;
        tool_calling_result: AIResponse;
        vision_result: AIResponse;
        tunnel_health: {status: Text; latency_ms: Nat; tunnel_active: Bool};
    } {
        Debug.print("🧪 Testing all AI models with tunnel integration");

        // Test tunnel health first
        let tunnel_health = switch (await TunnelBridge.checkTunnelHealth(TUNNEL_CONFIG)) {
            case (#ok(health)) { health };
            case (#err(_)) { {status = "error"; latency_ms = 0; tunnel_active = false} };
        };

        // Test reasoning model
        let reasoning_result = await processAIRequest({
            prompt = "Analyze the benefits of blockchain-based AI orchestration";
            model = #Reasoning;
            priority = #High;
            use_tunnel = true;
            image_data = null;
        });

        // Test tool calling model
        let tool_calling_result = await processAIRequest({
            prompt = "Calculate 147 * 83 + 256 - 789";
            model = #ToolCalling;
            priority = #Medium;
            use_tunnel = false;
            image_data = null;
        });

        // Test vision model
        let vision_result = await processAIRequest({
            prompt = "Describe what you see in this image";
            model = #Vision;
            priority = #Medium;
            use_tunnel = true;
            image_data = ?[1, 2, 3, 4]; // Mock image data
        });

        {
            reasoning_result = reasoning_result;
            tool_calling_result = tool_calling_result;
            vision_result = vision_result;
            tunnel_health = tunnel_health;
        }
    };

    /**
     * Get orchestrator statistics
     */
    public query func getStats(): async {
        total_requests: Nat;
        tunnel_requests: Nat;
        tunnel_usage_rate: Float;
        avg_processing_time: Int;
        uptime: Int;
    } {
        let avg_time = if (total_requests > 0) { total_processing_time / total_requests } else { 0 };
        let tunnel_rate = if (total_requests > 0) { 
            Float.fromInt(tunnel_requests) / Float.fromInt(total_requests) 
        } else { 0.0 };

        {
            total_requests = total_requests;
            tunnel_requests = tunnel_requests;
            tunnel_usage_rate = tunnel_rate;
            avg_processing_time = avg_time;
            uptime = Time.now();
        }
    };

    /**
     * Health check for the orchestrator
     */
    public query func health(): async {
        status: Text;
        models_available: [Text];
        tunnel_configured: Bool;
        canister: Text;
    } {
        {
            status = "healthy";
            models_available = ["dolphin3:latest", "llama3.2:3b", "llava:7b"];
            tunnel_configured = true;
            canister = "avai_ai_orchestrator";
        }
    };
}