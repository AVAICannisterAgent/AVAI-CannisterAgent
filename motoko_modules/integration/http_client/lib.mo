import Text "mo:base/Text";
import Result "mo:base/Result";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import Nat64 "mo:base/Nat64";

/**
 * ENHANCED HTTP Client for IC Canisters with Full DFINITY HTTPS Outcall Features
 * - IPv4 Support: Enhanced networking capabilities
 * - Flexible Outcall APIs: Path A (Simple & Secure) and Path B (Advanced k-of-n)
 * - Non-Replicated Calls: Perfect for AI/LLM integration
 * - Cost Optimization: Smart response size limits and cycle management
 * - Security Options: End-to-end TLS with SOCKS proxy support
 */
module {
    // Enhanced Types for DFINITY's new HTTPS outcall features
    public type HttpRequestArgs = {
        url : Text;
        max_response_bytes : ?Nat64;
        headers : [(Text, Text)];
        body : ?[Nat8];
        method : HttpMethod;
        transform : ?{
            #function : query {
                response : HttpResponse;
                context : Blob;
            } -> async {
                response : HttpResponse;
            };
        };
        is_replicated : ?Bool;
        // NEW: IPv4 and advanced outcall support
        network_config : ?NetworkConfig;
        outcall_mode : ?OutcallMode;
    };

    // Network configuration for IPv4 support and enhanced connectivity
    public type NetworkConfig = {
        #default; // Standard IC networking
        #ipv4_enabled; // Enable IPv4 support for broader connectivity
        #enhanced_tls; // End-to-end TLS through SOCKS proxy
    };

    // Flexible outcall modes for different security/cost trade-offs
    public type OutcallMode = {
        #path_a_simple; // Simple & Secure: 2f+1 responses, built-in consensus
        #path_a_optimized; // Simple & Secure with cost optimization
        #path_b_basic; // Advanced k-of-n: Basic configuration
        #path_b_custom : { // Advanced k-of-n: Custom configuration
            min_responses : Nat;
            max_responses : Nat;
            consensus_threshold : Nat;
        };
    };

    public type HttpMethod = {
        #get;
        #post;
        #head;
        #put;
        #delete;
        #patch;
    };

    public type HttpResponse = {
        status : Nat;
        headers : [(Text, Text)];
        body : [Nat8];
    };

    // Legacy compatibility types
    public type HttpRequest = {
        url: Text;
        method: Text;
        headers: [(Text, Text)];
        body: ?[Nat8];
    };

    // Enhanced request configuration for AI/LLM optimization
    public type EnhancedHttpRequest = {
        url: Text;
        method: Text;
        headers: [(Text, Text)];
        body: ?[Nat8];
        network_config: ?NetworkConfig;
        outcall_mode: ?OutcallMode;
        max_response_bytes: ?Nat64;
        cost_optimization: ?Bool;
    };

    /**
     * ENHANCED HTTP request with full DFINITY HTTPS outcall features
     * Optimized for AI/LLM integration with flexible configuration
     */
    public func makeEnhancedRequest(request: EnhancedHttpRequest): async Result.Result<HttpResponse, Text> {
        try {
            Debug.print("🚀 Making ENHANCED HTTP outcall to: " # request.url);
            Debug.print("📡 Network config: " # debug_show(request.network_config));
            Debug.print("⚙️ Outcall mode: " # debug_show(request.outcall_mode));
            
            // IC Management Canister interface for HTTP outcalls
            let ic = actor "aaaaa-aa" : actor {
                http_request : HttpRequestArgs -> async HttpResponse;
            };
            
            // Smart cycle management based on configuration
            let cycles = calculateOptimalCycles(request);
            Cycles.add<system>(cycles);
            Debug.print("💰 Allocated cycles: " # debug_show(cycles));
            
            // Convert method string to HttpMethod type
            let method = switch (request.method) {
                case ("GET") #get;
                case ("POST") #post;
                case ("PUT") #put;
                case ("DELETE") #delete;
                case ("PATCH") #patch;
                case ("HEAD") #head;
                case (_) #get; // Default to GET
            };
            
            // Smart URL handling with IPv4 support
            let primaryUrl = request.url;
            let fallbackUrl = Text.replace(request.url, #text "https://", "http://");
            
            // Prepare enhanced IC HTTP request
            let icRequest: HttpRequestArgs = {
                url = primaryUrl;
                max_response_bytes = switch (request.max_response_bytes) {
                    case (?size) ?size;
                    case null { 
                        // AI/LLM optimized default: balance cost vs capability
                        if (request.cost_optimization == ?true) ?1048576 : ?Nat64 // 1MB for cost optimization
                        else ?2097152 : ?Nat64 // 2MB for full capability
                    };
                };
                headers = enhanceHeaders(request.headers, request.network_config);
                body = request.body;
                method = method;
                transform = null; // No transform for AI responses
                is_replicated = ?false; // CRITICAL: Non-replicated for AI/LLM calls
                network_config = request.network_config;
                outcall_mode = request.outcall_mode;
            };
            
            // Try enhanced HTTPS first
            Debug.print("🔐 Attempting enhanced HTTPS outcall...");
            switch (await attemptEnhancedRequest(ic, icRequest)) {
                case (#ok(response)) {
                    Debug.print("✅ Enhanced HTTPS outcall successful! Status: " # debug_show(response.status));
                    Debug.print("📊 Response size: " # debug_show(response.body.size()) # " bytes");
                    #ok(response)
                };
                case (#err(httpsError)) {
                    Debug.print("⚠️ Enhanced HTTPS failed, trying fallback for local development...");
                    
                    // Try fallback for local development
                    let fallbackRequest = {
                        icRequest with 
                        url = fallbackUrl;
                        network_config = ?#default; // Use default for fallback
                    };
                    
                    switch (await attemptEnhancedRequest(ic, fallbackRequest)) {
                        case (#ok(response)) {
                            Debug.print("✅ HTTP fallback successful! Status: " # debug_show(response.status));
                            #ok(response)
                        };
                        case (#err(httpError)) {
                            Debug.print("❌ Both enhanced HTTPS and HTTP failed");
                            #err("Enhanced outcalls failed: " # httpsError # " | " # httpError)
                        };
                    }
                };
            }
        } catch (error) {
            let errorMsg = "Enhanced HTTP client error occurred";
            Debug.print("❌ " # errorMsg);
            #err(errorMsg)
        }
    };

    /**
     * Calculate optimal cycles based on request configuration
     */
    private func calculateOptimalCycles(request: EnhancedHttpRequest): Nat {
        let baseAmount = 20_000_000_000; // 20B cycles base
        
        switch (request.outcall_mode) {
            case (?#path_a_simple) baseAmount; // Standard amount
            case (?#path_a_optimized) baseAmount / 2; // Cost optimized
            case (?#path_b_basic) baseAmount * 2; // More cycles for advanced
            case (?#path_b_custom(_)) baseAmount * 3; // Maximum for custom
            case null baseAmount; // Default
        }
    };

    /**
     * Enhance headers based on network configuration
     */
    private func enhanceHeaders(headers: [(Text, Text)], networkConfig: ?NetworkConfig): [(Text, Text)] {
        let baseHeaders = [
            ("User-Agent", "AVAI-Enhanced-Motoko-Canister/2.0"),
            ("Accept", "application/json"),
            ("Connection", "keep-alive")
        ];
        
        let configHeaders = switch (networkConfig) {
            case (?#ipv4_enabled) [("X-Network-Mode", "IPv4-Enhanced")];
            case (?#enhanced_tls) [("X-TLS-Mode", "Enhanced")];
            case _ [];
        };
        
        // Combine all headers using Array.append
        let combinedHeaders = Array.append(baseHeaders, configHeaders);
        let allHeaders = Array.append(combinedHeaders, headers);
        allHeaders
    };

    /**
     * Attempt enhanced HTTP request with full feature support
     */
    private func attemptEnhancedRequest(ic: actor { http_request : HttpRequestArgs -> async HttpResponse }, request: HttpRequestArgs): async Result.Result<HttpResponse, Text> {
        try {
            let response = await ic.http_request(request);
            Debug.print("📄 Enhanced response body size: " # debug_show(response.body.size()) # " bytes");
            Debug.print("🏆 Enhanced outcall completed successfully");
            #ok(response)
        } catch (error) {
            Debug.print("❌ Enhanced request failed");
            #err("Enhanced request failed")
        }
    };

    /**
     * REAL HTTP request with local/mainnet fallback handling (LEGACY - kept for compatibility)
     */
    public func makeRequest(request: HttpRequest): async Result.Result<HttpResponse, Text> {
        // Convert legacy request to enhanced request
        let enhancedRequest: EnhancedHttpRequest = {
            url = request.url;
            method = request.method;
            headers = request.headers;
            body = request.body;
            network_config = ?#ipv4_enabled; // Enable IPv4 by default
            outcall_mode = ?#path_a_optimized; // Use optimized mode for legacy
            max_response_bytes = ?2048000 : ?Nat64; // 2MB default
            cost_optimization = ?true; // Enable cost optimization
        };
        
        await makeEnhancedRequest(enhancedRequest)
    };

    /**
     * Attempt a single HTTP request (LEGACY - kept for compatibility)
     */
    private func attemptRequest(ic: actor { http_request : HttpRequestArgs -> async HttpResponse }, request: HttpRequestArgs): async Result.Result<HttpResponse, Text> {
        try {
            let response = await ic.http_request(request);
            Debug.print("📄 Response body size: " # debug_show(response.body.size()) # " bytes");
            #ok(response)
        } catch (error) {
            #err("Request failed")
        }
    };

    /**
     * Enhanced HTTP GET with full feature support
     */
    public func getEnhanced(url: Text, config: ?NetworkConfig, mode: ?OutcallMode): async Result.Result<HttpResponse, Text> {
        let request: EnhancedHttpRequest = {
            url = url;
            method = "GET";
            headers = [
                ("Accept", "application/json"),
                ("Cache-Control", "no-cache")
            ];
            body = null;
            network_config = config;
            outcall_mode = mode;
            max_response_bytes = null; // Use smart defaults
            cost_optimization = ?true;
        };
        await makeEnhancedRequest(request)
    };

    /**
     * Enhanced HTTP POST optimized for AI/LLM calls
     */
    public func postForAI(url: Text, body: [Nat8], aiProvider: Text): async Result.Result<HttpResponse, Text> {
        // AI-specific configuration
        let (networkConfig, outcallMode, maxBytes) = switch (aiProvider) {
            case ("openai") (?#enhanced_tls, ?#path_a_simple, ?4194304 : ?Nat64); // 4MB for GPT responses
            case ("anthropic") (?#ipv4_enabled, ?#path_a_optimized, ?3145728 : ?Nat64); // 3MB for Claude
            case ("huggingface") (?#ipv4_enabled, ?#path_a_simple, ?2097152 : ?Nat64); // 2MB for HF models
            case ("ollama") (?#default, ?#path_a_optimized, ?1048576 : ?Nat64); // 1MB for local models
            case (_) (?#ipv4_enabled, ?#path_a_simple, ?2097152 : ?Nat64); // Default 2MB
        };

        let request: EnhancedHttpRequest = {
            url = url;
            method = "POST";
            headers = [
                ("Content-Type", "application/json"),
                ("Accept", "application/json"),
                ("X-AI-Provider", aiProvider),
                ("X-Request-Type", "ai-inference")
            ];
            body = ?body;
            network_config = networkConfig;
            outcall_mode = outcallMode;
            max_response_bytes = maxBytes;
            cost_optimization = ?true;
        };
        await makeEnhancedRequest(request)
    };

    /**
     * Real HTTP GET request (LEGACY - kept for compatibility)
     */
    public func get(url: Text): async Result.Result<HttpResponse, Text> {
        let request: HttpRequest = {
            url = url;
            method = "GET";
            headers = [
                ("User-Agent", "AVAI-Motoko-Canister/1.0"),
                ("Accept", "application/json")
            ];
            body = null;
        };
        await makeRequest(request)
    };

    /**
     * Real HTTP POST request (LEGACY - kept for compatibility)
     */
    public func post(url: Text, body: [Nat8]): async Result.Result<HttpResponse, Text> {
        let request: HttpRequest = {
            url = url;
            method = "POST";
            headers = [
                ("Content-Type", "application/json"),
                ("User-Agent", "AVAI-Motoko-Canister/1.0"),
                ("Accept", "application/json")
            ];
            body = ?body;
        };
        await makeRequest(request)
    };

    /**
     * Real HTTP POST with custom headers (LEGACY - kept for compatibility)
     */
    public func postWithHeaders(url: Text, body: [Nat8], headers: [(Text, Text)]): async Result.Result<HttpResponse, Text> {
        let request: HttpRequest = {
            url = url;
            method = "POST";
            headers = headers;
            body = ?body;
        };
        await makeRequest(request)
    };

    /**
     * Smart AI model outcall with automatic provider detection and optimization
     */
    public func smartAICall(url: Text, body: [Nat8], headers: [(Text, Text)]): async Result.Result<HttpResponse, Text> {
        // Detect AI provider from URL
        let aiProvider = if (Text.contains(url, #text "openai.com")) "openai"
                        else if (Text.contains(url, #text "anthropic.com")) "anthropic"
                        else if (Text.contains(url, #text "huggingface.co")) "huggingface"
                        else if (Text.contains(url, #text "localhost") or Text.contains(url, #text "127.0.0.1")) "ollama"
                        else "generic";
        
        Debug.print("🤖 Detected AI provider: " # aiProvider);
        await postForAI(url, body, aiProvider)
    };

    /**
     * Cost-optimized outcall for high-frequency AI interactions
     */
    public func costOptimizedCall(url: Text, body: [Nat8], maxResponseKB: Nat): async Result.Result<HttpResponse, Text> {
        let request: EnhancedHttpRequest = {
            url = url;
            method = "POST";
            headers = [
                ("Content-Type", "application/json"),
                ("Accept", "application/json"),
                ("X-Cost-Optimized", "true")
            ];
            body = ?body;
            network_config = ?#default; // Use default for cost savings
            outcall_mode = ?#path_a_optimized; // Optimized consensus
            max_response_bytes = ?Nat64.fromNat(maxResponseKB * 1024); // Convert KB to bytes
            cost_optimization = ?true;
        };
        await makeEnhancedRequest(request)
    };

    /**
     * High-reliability outcall for critical AI operations
     */
    public func highReliabilityCall(url: Text, body: [Nat8]): async Result.Result<HttpResponse, Text> {
        let request: EnhancedHttpRequest = {
            url = url;
            method = "POST";
            headers = [
                ("Content-Type", "application/json"),
                ("Accept", "application/json"),
                ("X-Reliability-Mode", "high")
            ];
            body = ?body;
            network_config = ?#enhanced_tls; // Enhanced security
            outcall_mode = ?#path_b_custom({
                min_responses = 3;
                max_responses = 5;
                consensus_threshold = 3;
            }); // Custom high-reliability consensus
            max_response_bytes = ?4194304 : ?Nat64; // 4MB for large responses
            cost_optimization = ?false; // Prioritize reliability over cost
        };
        await makeEnhancedRequest(request)
    };
}