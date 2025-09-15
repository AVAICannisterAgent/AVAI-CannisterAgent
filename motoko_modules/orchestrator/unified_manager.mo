/**
 * Unified Manager - Manages agent coordination and responses
 */

import Types "../core/types";
import Result "mo:base/Result";
import Text "mo:base/Text";

module UnifiedManager {
    
    public type AgentResponse = {
        agentId: Text;
        status: Text;
        response: Text;
        pythonFallbackUsed: Bool;
        executionTime: Nat;
    };

    public type UnifiedResponse = {
        primaryResponse: AgentResponse;
        coordinationStatus: Text;
        fallbackRequired: Bool;
        pythonCommand: ?Text;
    };

    public func processAgentResponse(agentId: Text, task: Text, pythonFallbackRequired: Bool) : UnifiedResponse {
        let response: AgentResponse = {
            agentId = agentId;
            status = "ready_for_python_handoff";
            response = "Agent " # agentId # " coordinated task: " # task;
            pythonFallbackUsed = pythonFallbackRequired;
            executionTime = 100; // Simulated execution time
        };

        let pythonCmd: ?Text = if (pythonFallbackRequired) {
            switch (agentId) {
                case ("github_agent") { ?"github_tool.analyze_repo(" # task # ")" };
                case ("browser_agent") { ?"browser_tool.navigate(" # task # ")" };
                case (_) { ?"general_tool.process(" # task # ")" };
            }
        } else {
            null
        };

        {
            primaryResponse = response;
            coordinationStatus = "motoko_coordination_complete";
            fallbackRequired = pythonFallbackRequired;
            pythonCommand = pythonCmd;
        }
    };

    public func formatResponse(unified: UnifiedResponse) : Text {
        "MOTOKO_COORDINATION: " # unified.primaryResponse.status # 
        " | AGENT: " # unified.primaryResponse.agentId #
        " | FALLBACK_REQUIRED: " # (if (unified.fallbackRequired) "true" else "false") #
        " | PYTHON_CMD: " # (switch (unified.pythonCommand) { case (?cmd) cmd; case null "none" })
    };
}
