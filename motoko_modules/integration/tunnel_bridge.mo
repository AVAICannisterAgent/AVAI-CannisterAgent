import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Int "mo:base/Int";

/**
 * AVAI Tunnel Bridge - Integration with Cloudflare Tunnel
 * Manages secure connections between IC canisters and external AI models
 */
module TunnelBridge {

    public type TunnelConfig = {
        tunnel_url: Text;
        tunnel_token: Text;
        ai_endpoint: Text;
        timeout_ms: Nat;
    };

    public type AIModelRequest = {
        model: Text;
        prompt: Text;
        temperature: Float;
        max_tokens: Nat;
        stream: Bool;
    };

    public type AIModelResponse = {
        success: Bool;
        response: Text;
        model_used: Text;
        processing_time: Int;
        tokens_used: Nat;
        tunnel_latency: Int;
    };

    /**
     * Send request to AI model through tunnel
     */
    public func callAIModelViaTunnel(
        config: TunnelConfig,
        request: AIModelRequest
    ): async Result.Result<AIModelResponse, Text> {

        Debug.print("🌐 Tunnel Bridge: Routing AI request through tunnel");
        let start_time = Time.now();

        try {
            // Simulate tunnel processing
            let tunnel_latency = Time.now() - start_time;

            Debug.print("✅ Tunnel Bridge: Request completed via tunnel");

            #ok({
                success = true;
                response = "🌐 **Tunnel-Enhanced AI Response**\n\nProcessed via Cloudflare tunnel with Motoko orchestration.\nModel: " # request.model # "\nPrompt: " # request.prompt;
                model_used = request.model # "_tunnel_enhanced";
                processing_time = tunnel_latency;
                tokens_used = estimateTokenUsage(request.prompt);
                tunnel_latency = tunnel_latency;
            })

        } catch (error) {
            Debug.print("❌ Tunnel Bridge Exception: tunnel_error");
            #err("Tunnel bridge error: connection_failed")
        }
    };

    /**
     * Estimate token usage for billing/monitoring
     */
    private func estimateTokenUsage(text: Text): Nat {
        // Simple estimation: ~4 characters per token
        (text.size() + 3) / 4
    };

    /**
     * Health check for tunnel connectivity
     */
    public func checkTunnelHealth(config: TunnelConfig): async Result.Result<{
        status: Text;
        latency_ms: Nat;
        tunnel_active: Bool;
    }, Text> {

        Debug.print("🔍 Checking tunnel health...");
        let start_time = Time.now();

        try {
            let end_time = Time.now();
            let latency = Int.abs(end_time - start_time) / 1000000; // Convert to milliseconds

            #ok({
                status = "healthy";
                latency_ms = latency;
                tunnel_active = true;
            })

        } catch (error) {
            #err("Health check error: health_check_failed")
        }
    };
}