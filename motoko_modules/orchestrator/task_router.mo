/**
 * Task Router - Routes tasks to appropriate agents
 */

import Types "../core/types";
import Result "mo:base/Result";
import Text "mo:base/Text";

module TaskRouter {
    
    public type TaskRouteResult = {
        agentId: Text;
        routingReason: Text;
        priority: Nat;
        pythonFallbackRequired: Bool;
    };

    public func routeTask(task: Text) : TaskRouteResult {
        // Simple routing logic based on task content
        if (Text.contains(task, #text "github") or Text.contains(task, #text "repo")) {
            {
                agentId = "github_agent";
                routingReason = "GitHub repository analysis detected";
                priority = 1;
                pythonFallbackRequired = true;
            }
        } else if (Text.contains(task, #text "browser") or Text.contains(task, #text "navigate")) {
            {
                agentId = "browser_agent";
                routingReason = "Browser automation task detected";
                priority = 1;
                pythonFallbackRequired = true;
            }
        } else if (Text.contains(task, #text "audit") or Text.contains(task, #text "analyze")) {
            {
                agentId = "audit_engine";
                routingReason = "Audit or analysis task detected";
                priority = 2;
                pythonFallbackRequired = false;
            }
        } else {
            {
                agentId = "main_orchestrator";
                routingReason = "General task processing";
                priority = 3;
                pythonFallbackRequired = false;
            }
        }
    };

    public func getPythonCommand(agentId: Text, task: Text) : Text {
        switch (agentId) {
            case ("github_agent") { "github_tool.analyze_repo(" # task # ")" };
            case ("browser_agent") { "browser_tool.navigate(" # task # ")" };
            case (_) { "general_tool.process(" # task # ")" };
        }
    };
}
