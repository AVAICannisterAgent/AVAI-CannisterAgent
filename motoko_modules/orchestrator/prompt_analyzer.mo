/**
 * Prompt Analyzer - Analyzes prompts to determine routing and processing strategy
 */

import Types "../core/types";
import Result "mo:base/Result";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";

module PromptAnalyzer {
    
    public type AnalysisResult = {
        agentType: Text;
        confidence: Float;
        requiresPython: Bool;
        complexity: Nat;
        keywords: [Text];
    };

    public type AnalysisWeights = {
        urgencyWeight: Float;
        complexityWeight: Float;
        contextWeight: Float;
        technicalWeight: Float;
    };

    // Default analysis weights
    public let defaultWeights: AnalysisWeights = {
        urgencyWeight = 0.25;
        complexityWeight = 0.25;
        contextWeight = 0.25;
        technicalWeight = 0.25;
    };

    public func analyzePrompt(prompt: Text) : AnalysisResult {
        let keywords = extractKeywords(prompt);
        let agentType = determineAgentType(keywords);
        let requiresPython = needsPythonFallback(keywords);
        let complexity = calculateComplexity(prompt);
        let confidence = calculateConfidence(keywords, agentType);

        {
            agentType = agentType;
            confidence = confidence;
            requiresPython = requiresPython;
            complexity = complexity;
            keywords = keywords;
        }
    };

    private func extractKeywords(prompt: Text) : [Text] {
        // Simple keyword extraction
        let lowerPrompt = Text.toLowercase(prompt);
        var keywords: [Text] = [];
        
        if (Text.contains(lowerPrompt, #text "github")) {
            keywords := Array.append(keywords, ["github"]);
        };
        if (Text.contains(lowerPrompt, #text "repo")) {
            keywords := Array.append(keywords, ["repository"]);
        };
        if (Text.contains(lowerPrompt, #text "browser")) {
            keywords := Array.append(keywords, ["browser"]);
        };
        if (Text.contains(lowerPrompt, #text "navigate")) {
            keywords := Array.append(keywords, ["navigation"]);
        };
        if (Text.contains(lowerPrompt, #text "audit")) {
            keywords := Array.append(keywords, ["audit"]);
        };
        if (Text.contains(lowerPrompt, #text "analyze")) {
            keywords := Array.append(keywords, ["analysis"]);
        };
        
        keywords
    };

    private func determineAgentType(keywords: [Text]) : Text {
        for (keyword in keywords.vals()) {
            switch (keyword) {
                case ("github" or "repository") { return "github_agent" };
                case ("browser" or "navigation") { return "browser_agent" };
                case ("audit" or "analysis") { return "audit_engine" };
                case (_) { };
            }
        };
        "main_orchestrator"
    };

    private func needsPythonFallback(keywords: [Text]) : Bool {
        for (keyword in keywords.vals()) {
            switch (keyword) {
                case ("github" or "repository" or "browser" or "navigation") { return true };
                case (_) { };
            }
        };
        false
    };

    private func calculateComplexity(prompt: Text) : Nat {
        let length = prompt.size();
        if (length > 100) { 3 } else if (length > 50) { 2 } else { 1 }
    };

    private func calculateConfidence(keywords: [Text], agentType: Text) : Float {
        if (keywords.size() > 0) { 0.8 } else { 0.3 }
    };
}
