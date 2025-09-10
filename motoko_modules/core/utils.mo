/**
 * AVAI Core Utilities - Essential utility functions for the Motoko AVAI system
 * Provides common functionality used across all modules
 */

import Types "./types";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Random "mo:base/Random";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Float "mo:base/Float";
import Char "mo:base/Char";
import Iter "mo:base/Iter";

module Utils {
    
    // ================================
    // TEXT PROCESSING UTILITIES
    // ================================
    
    /// Smart text analysis for prompt classification
    public func analyzePromptText(prompt: Text): Types.PromptCategory {
        let lowerPrompt = Text.toLowercase(prompt);
        
        // Research keywords
        if (containsAny(lowerPrompt, [
            "research", "find", "search", "analyze data", "investigate", 
            "fact check", "trends", "competitor analysis", "market research"
        ])) {
            if (containsAny(lowerPrompt, ["web", "online", "internet", "website"])) {
                #Research(#WebResearch)
            } else if (containsAny(lowerPrompt, ["data", "statistics", "analytics", "metrics"])) {
                #Research(#DataAnalysis)
            } else if (containsAny(lowerPrompt, ["fact", "verify", "truth", "accurate"])) {
                #Research(#FactVerification)
            } else if (containsAny(lowerPrompt, ["trend", "pattern", "evolution", "change"])) {
                #Research(#TrendAnalysis)
            } else if (containsAny(lowerPrompt, ["competitor", "competition", "market", "industry"])) {
                #Research(#CompetitorAnalysis)
            } else {
                #Research(#WebResearch)
            }
        }
        // Code analysis keywords
        else if (containsAny(lowerPrompt, [
            "code", "analyze", "review", "debug", "refactor", "optimize",
            "security scan", "vulnerability", "performance", "documentation"
        ])) {
            if (containsAny(lowerPrompt, ["security", "vulnerability", "exploit", "cve"])) {
                #CodeAnalysis(#SecurityScan)
            } else if (containsAny(lowerPrompt, ["performance", "optimize", "speed", "memory"])) {
                #CodeAnalysis(#PerformanceAnalysis)
            } else if (containsAny(lowerPrompt, ["review", "quality", "best practices", "standards"])) {
                #CodeAnalysis(#CodeReview)
            } else if (containsAny(lowerPrompt, ["refactor", "improve", "restructure", "modernize"])) {
                #CodeAnalysis(#RefactoringAssistance)
            } else if (containsAny(lowerPrompt, ["debug", "error", "bug", "issue", "fix"])) {
                #CodeAnalysis(#DebugAssistance)
            } else if (containsAny(lowerPrompt, ["document", "comment", "explain", "readme"])) {
                #CodeAnalysis(#DocumentationGeneration)
            } else {
                #CodeAnalysis(#CodeReview)
            }
        }
        // Security audit keywords
        else if (containsAny(lowerPrompt, [
            "security audit", "penetration test", "vulnerability scan",
            "compliance", "threat model", "security report"
        ])) {
            if (containsAny(lowerPrompt, ["vulnerability", "scan", "cve", "exploit"])) {
                #SecurityAudit(#VulnerabilityScanning)
            } else if (containsAny(lowerPrompt, ["compliance", "standard", "regulation", "policy"])) {
                #SecurityAudit(#ComplianceCheck)
            } else if (containsAny(lowerPrompt, ["penetration", "pentest", "attack", "exploit"])) {
                #SecurityAudit(#PenetrationTesting)
            } else if (containsAny(lowerPrompt, ["report", "summary", "findings", "audit"])) {
                #SecurityAudit(#SecurityReporting)
            } else if (containsAny(lowerPrompt, ["threat", "model", "risk", "attack surface"])) {
                #SecurityAudit(#ThreatModeling)
            } else {
                #SecurityAudit(#VulnerabilityScanning)
            }
        }
        // Report generation keywords
        else if (containsAny(lowerPrompt, [
            "generate report", "create report", "summary", "findings",
            "executive summary", "analysis report", "compliance report"
        ])) {
            if (containsAny(lowerPrompt, ["security", "vulnerability", "audit"])) {
                #ReportGeneration(#SecurityReport)
            } else if (containsAny(lowerPrompt, ["analysis", "findings", "investigation"])) {
                #ReportGeneration(#AnalysisReport)
            } else if (containsAny(lowerPrompt, ["performance", "benchmark", "metrics"])) {
                #ReportGeneration(#PerformanceReport)
            } else if (containsAny(lowerPrompt, ["compliance", "regulation", "standard"])) {
                #ReportGeneration(#ComplianceReport)
            } else if (containsAny(lowerPrompt, ["executive", "summary", "overview", "brief"])) {
                #ReportGeneration(#ExecutiveSummary)
            } else {
                #ReportGeneration(#AnalysisReport)
            }
        }
        // Browser automation keywords
        else if (containsAny(lowerPrompt, [
            "browser", "web automation", "scrape", "extract data",
            "fill form", "test website", "monitor", "interact"
        ])) {
            if (containsAny(lowerPrompt, ["extract", "scrape", "data", "content"])) {
                #BrowserAutomation(#DataExtraction)
            } else if (containsAny(lowerPrompt, ["form", "fill", "submit", "input"])) {
                #BrowserAutomation(#FormAutomation)
            } else if (containsAny(lowerPrompt, ["test", "testing", "verify", "validate"])) {
                #BrowserAutomation(#TestingAutomation)
            } else if (containsAny(lowerPrompt, ["monitor", "track", "watch", "observe"])) {
                #BrowserAutomation(#MonitoringTasks)
            } else if (containsAny(lowerPrompt, ["interact", "click", "navigate", "simulate"])) {
                #BrowserAutomation(#InteractionSimulation)
            } else {
                #BrowserAutomation(#DataExtraction)
            }
        }
        // System command keywords
        else if (containsAny(lowerPrompt, [
            "system", "config", "settings", "status", "health",
            "restart", "stop", "start", "deploy"
        ])) {
            #SystemCommand
        }
        // Learning feedback keywords
        else if (containsAny(lowerPrompt, [
            "feedback", "learn", "improve", "remember", "adapt",
            "correction", "wrong", "better"
        ])) {
            #LearningFeedback
        }
        // Default to general conversation
        else {
            #GeneralConversation
        }
    };
    
    /// Check if text contains any of the keywords
    public func containsAny(text: Text, keywords: [Text]): Bool {
        for (keyword in keywords.vals()) {
            if (Text.contains(text, #text keyword)) {
                return true;
            };
        };
        false
    };
    
    /// Extract priority from prompt text
    public func extractPriority(prompt: Text): Types.Priority {
        let lowerPrompt = Text.toLowercase(prompt);
        
        if (containsAny(lowerPrompt, ["urgent", "critical", "emergency", "asap", "immediately"])) {
            #Critical
        } else if (containsAny(lowerPrompt, ["high priority", "important", "soon", "quickly"])) {
            #High
        } else if (containsAny(lowerPrompt, ["medium", "normal", "standard", "regular"])) {
            #Medium
        } else if (containsAny(lowerPrompt, ["low priority", "when possible", "no rush", "later"])) {
            #Low
        } else if (containsAny(lowerPrompt, ["background", "batch", "offline", "slow"])) {
            #Background
        } else {
            #Medium // Default priority
        }
    };
    
    /// Clean and normalize text
    public func normalizeText(text: Text): Text {
        // Remove extra whitespace and normalize
        let trimmed = Text.trim(text, #char ' ');
        // Additional normalization logic would go here
        trimmed
    };
    
    /// Extract keywords from text
    public func extractKeywords(text: Text): [Text] {
        let normalized = Text.toLowercase(normalizeText(text));
        let words = Text.split(normalized, #char ' ');
        
        // Filter out common stop words and short words
        let stopWords = [
            "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
            "a", "an", "is", "are", "was", "were", "be", "been", "have", "has", "had",
            "do", "does", "did", "will", "would", "could", "should", "may", "might",
            "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they"
        ];
        
        Array.filter<Text>(Iter.toArray(words), func(word) {
            word.size() > 2 and not Array.find<Text>(stopWords, func(stop) = stop == word) != null
        })
    };
    
    // ================================
    // VALIDATION UTILITIES
    // ================================
    
    /// Validate prompt input
    public func validatePrompt(prompt: Text): Types.AVAIResult<Text> {
        let normalized = normalizeText(prompt);
        
        if (normalized.size() == 0) {
            Types.error<Text>(#InvalidInput("Empty prompt not allowed"))
        } else if (normalized.size() > 10000) {
            Types.error<Text>(#InvalidInput("Prompt too long (max 10,000 characters)"))
        } else if (containsMaliciousContent(normalized)) {
            Types.error<Text>(#InvalidInput("Potentially malicious content detected"))
        } else {
            Types.success<Text>(normalized)
        }
    };
    
    /// Basic malicious content detection
    public func containsMaliciousContent(text: Text): Bool {
        let lowerText = Text.toLowercase(text);
        let maliciousPatterns = [
            "<script", "javascript:", "eval(", "exec(",
            "system(", "shell_exec", "passthru(", "../../",
            "union select", "drop table", "delete from",
            "insert into", "update set"
        ];
        
        containsAny(lowerText, maliciousPatterns)
    };
    
    /// Validate configuration
    public func validateConfig(config: Types.SystemConfig): Types.AVAIResult<Types.SystemConfig> {
        // Validate Redis config
        if (config.redis.port == 0 or config.redis.port > 65535) {
            return Types.error<Types.SystemConfig>(#ConfigurationError("Invalid Redis port"));
        };
        
        // Validate WebSocket config
        if (config.websocket.maxConnections == 0) {
            return Types.error<Types.SystemConfig>(#ConfigurationError("WebSocket max connections must be > 0"));
        };
        
        // Validate agent configs
        for (agent in config.agents.vals()) {
            if (agent.maxConcurrentTasks == 0) {
                return Types.error<Types.SystemConfig>(#ConfigurationError("Agent max concurrent tasks must be > 0"));
            };
        };
        
        Types.success<Types.SystemConfig>(config)
    };
    
    // ================================
    // PERFORMANCE UTILITIES
    // ================================
    
    /// Measure execution time
    public func measureExecutionTime<T>(operation: () -> T): (T, Nat) {
        let startTime = Time.now();
        let result = operation();
        let endTime = Time.now();
        let duration = Int.abs(endTime - startTime) / 1000000; // Convert to milliseconds
        (result, duration)
    };
    
    /// Calculate performance score
    public func calculatePerformanceScore(
        responseTime: Nat,
        successRate: Float,
        errorRate: Float
    ): Float {
        // Normalize response time (lower is better, max expected 5000ms)
        let timeScore = Float.max(0.0, 1.0 - (Float.fromInt(responseTime) / 5000.0));
        
        // Success rate (higher is better)
        let successScore = successRate;
        
        // Error rate penalty (lower is better)
        let errorPenalty = 1.0 - errorRate;
        
        // Weighted average
        (timeScore * 0.3) + (successScore * 0.5) + (errorPenalty * 0.2)
    };
    
    /// Determine if Python fallback is needed
    public func needsPythonFallback(
        category: Types.PromptCategory,
        complexity: Float,
        resourceUsage: Float
    ): Bool {
        // Complex operations that benefit from Python libraries
        switch (category) {
            case (#CodeAnalysis(_)) {
                complexity > 0.8 or resourceUsage > 0.9
            };
            case (#Research(#DataAnalysis)) {
                complexity > 0.7 // Data analysis often needs pandas, numpy etc.
            };
            case (#SecurityAudit(_)) {
                complexity > 0.6 // Security tools often Python-based
            };
            case (#BrowserAutomation(_)) {
                complexity > 0.8 // Complex browser automation
            };
            case (_) {
                complexity > 0.9 or resourceUsage > 0.95
            };
        }
    };
    
    // ================================
    // LEARNING UTILITIES
    // ================================
    
    /// Calculate similarity between two prompts
    public func calculatePromptSimilarity(prompt1: Text, prompt2: Text): Float {
        let keywords1 = extractKeywords(prompt1);
        let keywords2 = extractKeywords(prompt2);
        
        if (keywords1.size() == 0 and keywords2.size() == 0) {
            return 1.0;
        };
        
        if (keywords1.size() == 0 or keywords2.size() == 0) {
            return 0.0;
        };
        
        // Calculate Jaccard similarity
        let intersection = Array.filter<Text>(keywords1, func(k1) {
            Array.find<Text>(keywords2, func(k2) = k1 == k2) != null
        }).size();
        
        let union = keywords1.size() + keywords2.size() - intersection;
        
        if (union == 0) {
            0.0
        } else {
            Float.fromInt(intersection) / Float.fromInt(union)
        }
    };
    
    /// Update learning model with feedback
    public func updateLearningScore(
        currentScore: Float,
        feedback: Types.FeedbackType,
        learningRate: Float
    ): Float {
        let adjustment = switch (feedback) {
            case (#Positive(confidence)) { confidence * learningRate };
            case (#Negative(severity)) { -severity * learningRate };
            case (#Neutral) { 0.0 };
            case (#Correction(_)) { -0.1 * learningRate }; // Penalty for corrections
        };
        
        Float.max(0.0, Float.min(1.0, currentScore + adjustment))
    };
    
    // ================================
    // FORMATTING UTILITIES
    // ================================
    
    /// Format file size in human readable format
    public func formatFileSize(bytes: Nat): Text {
        if (bytes < 1024) {
            Nat.toText(bytes) # " B"
        } else if (bytes < 1024 * 1024) {
            Nat.toText(bytes / 1024) # " KB"
        } else if (bytes < 1024 * 1024 * 1024) {
            Nat.toText(bytes / (1024 * 1024)) # " MB"
        } else {
            Nat.toText(bytes / (1024 * 1024 * 1024)) # " GB"
        }
    };
    
    /// Format duration in human readable format
    public func formatDuration(milliseconds: Nat): Text {
        if (milliseconds < 1000) {
            Nat.toText(milliseconds) # "ms"
        } else if (milliseconds < 60000) {
            Nat.toText(milliseconds / 1000) # "s"
        } else if (milliseconds < 3600000) {
            Nat.toText(milliseconds / 60000) # "m " #
            Nat.toText((milliseconds % 60000) / 1000) # "s"
        } else {
            Nat.toText(milliseconds / 3600000) # "h " #
            Nat.toText((milliseconds % 3600000) / 60000) # "m"
        }
    };
    
    /// Format timestamp as human readable
    public func formatTimestamp(timestamp: Int): Text {
        // This would be implemented with proper date/time formatting
        // For now, return basic representation
        "Timestamp: " # Int.toText(timestamp)
    };
    
    // ================================
    // SECURITY UTILITIES
    // ================================
    
    /// Generate secure random ID
    public func generateSecureId(): async Text {
        // This would use proper cryptographic randomness in production
        let timestamp = Time.now();
        let random = await Random.blob();
        "avai_" # Int.toText(timestamp) # "_" # debug_show(random)
    };
    
    /// Hash sensitive data (placeholder)
    public func hashSensitiveData(data: Text): Text {
        // This would use proper cryptographic hashing in production
        "hash_" # Nat.toText(data.size()) # "_" # debug_show(Text.hash(data))
    };
    
    /// Sanitize input for logging
    public func sanitizeForLogging(input: Text): Text {
        // Remove potential PII and sensitive information
        let sanitized = Text.replace(input, #text "password", "***");
        let sanitized2 = Text.replace(sanitized, #text "token", "***");
        let sanitized3 = Text.replace(sanitized2, #text "key", "***");
        
        // Truncate if too long
        if (sanitized3.size() > 500) {
            Text.take(sanitized3, 497) # "..."
        } else {
            sanitized3
        }
    };
    
    // ================================
    // ERROR HANDLING UTILITIES
    // ================================
    
    /// Convert result to option
    public func resultToOption<T>(result: Types.AVAIResult<T>): ?T {
        switch (result) {
            case (#ok(value)) { ?value };
            case (#err(_)) { null };
        }
    };
    
    /// Chain multiple results
    public func chainResults<T, U>(
        result: Types.AVAIResult<T>,
        next: (T) -> Types.AVAIResult<U>
    ): Types.AVAIResult<U> {
        switch (result) {
            case (#ok(value)) { next(value) };
            case (#err(e)) { Types.error<U>(e) };
        }
    };
    
    /// Log error with context
    public func logError(error: Types.AVAIError, context: Text) {
        let errorMsg = switch (error) {
            case (#InvalidInput(msg)) { "Invalid Input: " # msg };
            case (#ProcessingError(msg)) { "Processing Error: " # msg };
            case (#NetworkError(msg)) { "Network Error: " # msg };
            case (#AuthenticationError(msg)) { "Auth Error: " # msg };
            case (#ResourceLimit(msg)) { "Resource Limit: " # msg };
            case (#NotFound(msg)) { "Not Found: " # msg };
            case (#PermissionDenied(msg)) { "Permission Denied: " # msg };
            case (#SystemError(msg)) { "System Error: " # msg };
            case (#PythonFallbackRequired(msg)) { "Python Fallback: " # msg };
            case (#TimeoutError(msg)) { "Timeout: " # msg };
            case (#ConfigurationError(msg)) { "Config Error: " # msg };
        };
        
        Debug.print("[ERROR] " # context # ": " # errorMsg);
    };
    
    // ================================
    // DEBUGGING UTILITIES
    // ================================
    
    /// Debug print with timestamp
    public func debugLog(message: Text) {
        let timestamp = Time.now();
        Debug.print("[" # Int.toText(timestamp) # "] " # message);
    };
    
    /// Format debug information
    public func formatDebugInfo(
        operation: Text,
        duration: Nat,
        success: Bool,
        details: [(Text, Text)]
    ): Text {
        var info = operation # " - " # formatDuration(duration) # " - ";
        info := info # (if (success) "SUCCESS" else "FAILED");
        
        if (details.size() > 0) {
            info := info # " - Details: ";
            for ((key, value) in details.vals()) {
                info := info # key # "=" # value # " ";
            };
        };
        
        info
    };
    
    // ================================
    // AUDIT SYSTEM UTILITIES
    // ================================
    
    /// Validate GitHub repository URL format
    public func isValidGitHubUrl(url: Text): Bool {
        let lowerUrl = Text.toLowercase(url);
        Text.contains(lowerUrl, #text "github.com") and
        (Text.contains(lowerUrl, #text "https://") or Text.contains(lowerUrl, #text "http://"))
    };
    
    /// Extract repository name from GitHub URL
    public func extractRepoName(url: Text): ?Text {
        if (not isValidGitHubUrl(url)) {
            return null;
        };
        
        // Simple extraction - look for github.com/owner/repo pattern
        let parts = Text.split(url, #char '/');
        let partsArray = Iter.toArray(parts);
        
        if (partsArray.size() >= 5) {
            ?partsArray[4] // Return repo name
        } else {
            null
        }
    };
    
    /// Calculate audit risk level based on findings
    public func calculateRiskLevel(
        securityIssues: Nat,
        codeQualityIssues: Nat,
        documentationGaps: Nat
    ): Types.RiskLevel {
        let totalIssues = securityIssues + codeQualityIssues + documentationGaps;
        
        if (totalIssues == 0) {
            #Low
        } else if (totalIssues <= 3) {
            #Medium
        } else if (totalIssues <= 7) {
            #High
        } else {
            #Critical
        }
    };
    
    /// Format audit summary for reporting
    public func formatAuditSummary(
        repositoryUrl: Text,
        analysisResult: Types.AnalysisResult,
        riskLevel: Types.RiskLevel
    ): Text {
        var summary = "=== AUDIT SUMMARY ===\n";
        summary := summary # "Repository: " # repositoryUrl # "\n";
        summary := summary # "Risk Level: " # formatRiskLevel(riskLevel) # "\n";
        summary := summary # "Analysis Status: " # (if (analysisResult.success) "COMPLETED" else "FAILED") # "\n";
        
        if (analysisResult.success) {
            summary := summary # "Files Analyzed: " # Nat.toText(analysisResult.filesAnalyzed) # "\n";
            summary := summary # "Issues Found: " # Nat.toText(analysisResult.issuesFound) # "\n";
            summary := summary # "Security Score: " # Float.toText(analysisResult.securityScore) # "/100\n";
        };
        
        summary := summary # "Timestamp: " # Int.toText(analysisResult.timestamp) # "\n";
        summary # "===================";
    };
    
    /// Format risk level for display
    private func formatRiskLevel(risk: Types.RiskLevel): Text {
        switch (risk) {
            case (#Low) { "LOW" };
            case (#Medium) { "MEDIUM" };
            case (#High) { "HIGH" };
            case (#Critical) { "CRITICAL" };
        }
    };
    
    /// Check if text contains analysis-related keywords
    public func containsAnalysisKeywords(text: Text): Bool {
        let lowerText = Text.toLowercase(text);
        containsAny(lowerText, [
            "security", "vulnerability", "audit", "analysis", "review",
            "code quality", "documentation", "best practices", "compliance"
        ])
    };
}
