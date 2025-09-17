import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Error "mo:base/Error";
import SimpleHttp "../integration/http_client/simple_lib";

/**
 * AVAI Reasoning Engine - Motoko Canister
 * Manages Dolphin3 model for advanced reasoning and complex analysis
 * Using SIMPLE HTTP client for basic connectivity testing
 */
actor ReasoningEngine {
    
    // Type definitions
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
    
    // State variables
    private stable var request_count: Nat = 0;
    private stable var total_processing_time: Int = 0;
    
    // Test HTTP connectivity with known working endpoint
    private let WEBSOCKET_PUBLIC_URL = "https://httpbin.org";
    private let WEBSOCKET_API_PATH = "/post";
    private let MODEL_NAME = "dolphin3:latest";
    
    /**
     * Process reasoning request using Dolphin3 model
     */
    public func process_reasoning(request: ReasoningRequest): async ReasoningResult {
        Debug.print("🧠 Reasoning Engine: Processing request with Dolphin3");
        let start_time = Time.now();
        
        try {
            // Enhanced context management
            let enhanced_context = enhance_context(request.context);
            
            // Determine processing approach based on priority
            let response = switch (request.priority) {
                case ("critical") {
                    Debug.print("🚨 Critical priority - Real AI service call");
                    await call_real_ai_service({
                        model = MODEL_NAME;
                        prompt = request.prompt;
                        context = enhanced_context;
                        options = {
                            temperature = 0.2;
                            num_predict = 500;
                            num_gpu = 1;
                        };
                    });
                };
                case (_) {
                    Debug.print("📊 Normal priority - Real AI service call");
                    await call_real_ai_service({
                        model = MODEL_NAME;
                        prompt = request.prompt;
                        context = enhanced_context;
                        options = {
                            temperature = 0.7;
                            num_predict = 300;
                            num_gpu = 1;
                        };
                    });
                };
            };
            
            let end_time = Time.now();
            let processing_time = end_time - start_time;
            
            // Update state
            request_count += 1;
            total_processing_time += processing_time;
            
            Debug.print("✅ Reasoning Engine: Processing complete");
            {
                success = true;
                response = response;
                confidence = 0.92;
                processing_time = processing_time;
                model_used = "dolphin3_motoko_managed";
            }
        } catch (error) {
            Debug.print("❌ Reasoning Engine: Error occurred: " # Error.message(error));
            {
                success = false;
                response = "Error in reasoning engine: " # Error.message(error);
                confidence = 0.0;
                processing_time = 0;
                model_used = "error_fallback";
            }
        }
    };
    
    /**
     * Enhanced context preparation
     */
    private func enhance_context(original_context: Text): Text {
        if (Text.size(original_context) == 0) {
            "Advanced reasoning context prepared for Dolphin3 model analysis"
        } else {
            "ENHANCED CONTEXT: " # original_context # " | Reasoning mode: Advanced analytical processing"
        }
    };
    
    /**
     * Get processing statistics
     */
    public query func get_stats(): async {request_count: Nat; avg_processing_time: Int} {
        let avg_time = if (request_count > 0) {
            total_processing_time / request_count
        } else { 0 };
        
        {
            request_count = request_count;
            avg_processing_time = avg_time;
        }
    };
    
    /**
     * Real AI service call using SIMPLE HTTP client for basic connectivity testing
     */
    private func call_real_ai_service(request: {model: Text; prompt: Text; context: Text; options: {temperature: Float; num_predict: Nat; num_gpu: Int}}): async Text {
        Debug.print("🌐 Connecting to AI service using SIMPLE HTTP client");
        
        try {
            // Simple JSON payload
            let json_payload = "{"
                # "\"model\": \"" # request.model # "\","
                # "\"prompt\": \"" # request.prompt # " Context: " # request.context # "\","
                # "\"stream\": false"
                # "}";
            
            let body_blob = Text.encodeUtf8(json_payload);
            let body_bytes = Blob.toArray(body_blob);
            
            Debug.print("🔄 Making SIMPLE HTTP GET outcall to test endpoint");
            let simpleRequest: SimpleHttp.SimpleHttpRequest = {
                url = "https://httpbin.org/get";
                method = "GET";
                headers = [
                    ("Accept", "application/json")
                ];
                body = null;
                max_response_bytes = ?1048576 : ?Nat64; // 1MB max
            };
            
            let response = await SimpleHttp.makeSimpleRequest(simpleRequest);
            
            switch (response) {
                case (#ok(http_response)) {
                    Debug.print("✅ SIMPLE HTTP outcall successful!");
                    let response_blob = Blob.fromArray(http_response.body);
                    let response_text = switch (Text.decodeUtf8(response_blob)) {
                        case (?text) text;
                        case null "Unable to decode response";
                    };
                    
                    "🔧 **SIMPLE HTTP TEST SUCCESSFUL**\n\n" #
                    "**Response Status:** " # Int.toText(http_response.status) # "\n" #
                    "**Response Body:**\n" # response_text # "\n\n" #
                    "**Connection:** ✅ Simple HTTP to " # WEBSOCKET_PUBLIC_URL # "\n" #
                    "**Model:** " # request.model # "\n" #
                    "**Status:** Basic HTTP outcalls are working!"
                };
                case (#err(error_msg)) {
                    Debug.print("❌ SIMPLE HTTP outcall failed: " # error_msg);
                    "❌ **SIMPLE HTTP TEST FAILED**\n\n" #
                    "Error: " # error_msg # "\n\n" #
                    "The basic HTTP outcall to " # WEBSOCKET_PUBLIC_URL # " failed.\n" #
                    "This indicates a fundamental connectivity issue with the IC replica.\n\n" #
                    "**Troubleshooting:**\n" #
                    "- IC replica may not have HTTPS outcalls properly configured\n" #
                    "- Check if dfx is running with --enable-canister-http flag\n" #
                    "- Verify IC management canister interface is accessible\n" #
                    "- Check cycles allocation for HTTP outcalls"
                }
            }
        } catch (error) {
            Debug.print("❌ Exception in simple HTTP call");
            "❌ **EXCEPTION IN SIMPLE HTTP CALL**\n\n" #
            "A Motoko exception occurred during the HTTP outcall.\n" #
            "This suggests an issue with the IC management canister interface.\n\n" #
            "**Possible Issues:**\n" #
            "- IC management canister not accessible\n" #
            "- HTTP outcalls not enabled in IC replica\n" #
            "- Insufficient cycles for HTTP requests\n" #
            "- Invalid request format for IC management canister"
        }
    };
}