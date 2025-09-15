// Enhanced Motoko Logger for Agent Orchestrator System
// Provides comprehensive logging capabilities for all agent operations

import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Int "mo:base/Int";

module Logger {
    
    // Log levels for different types of operations
    public type LogLevel = {
        #DEBUG;
        #INFO;
        #WARN;
        #ERROR;
        #AGENT_COORDINATION;
        #ORCHESTRATOR;
        #PERFORMANCE;
    };
    
    // Enhanced log entry structure
    public type LogEntry = {
        timestamp: Int;
        level: LogLevel;
        component: Text;
        agentId: ?Text;
        orchestratorId: ?Text;
        message: Text;
        metadata: ?Text;
        requestId: ?Text;
        duration: ?Int;
    };
    
    // Log buffer for storing recent logs
    private stable var logBuffer = Buffer.Buffer<LogEntry>(1000);
    private stable var maxLogEntries : Nat = 1000;
    private stable var logCounter : Nat = 0;
    
    // Enhanced logging function with agent context
    public func logAgentOperation(
        level: LogLevel,
        component: Text,
        agentId: ?Text,
        orchestratorId: ?Text,
        message: Text,
        metadata: ?Text,
        requestId: ?Text,
        duration: ?Int
    ) : () {
        let entry: LogEntry = {
            timestamp = Time.now();
            level = level;
            component = component;
            agentId = agentId;
            orchestratorId = orchestratorId;
            message = message;
            metadata = metadata;
            requestId = requestId;
            duration = duration;
        };
        
        // Add to buffer (circular buffer implementation)
        if (logBuffer.size() >= maxLogEntries) {
            let _ = logBuffer.removeFirst();
        };
        logBuffer.add(entry);
        logCounter += 1;
        
        // Also output to debug console for immediate visibility
        let logLevelText = switch (level) {
            case (#DEBUG) { "🔍 DEBUG" };
            case (#INFO) { "ℹ️ INFO" };
            case (#WARN) { "⚠️ WARN" };
            case (#ERROR) { "❌ ERROR" };
            case (#AGENT_COORDINATION) { "🤝 AGENT_COORD" };
            case (#ORCHESTRATOR) { "🎭 ORCHESTRATOR" };
            case (#PERFORMANCE) { "📊 PERFORMANCE" };
        };
        
        let agentInfo = switch (agentId) {
            case (?id) { " [Agent:" # id # "]" };
            case null { "" };
        };
        
        let orchestratorInfo = switch (orchestratorId) {
            case (?id) { " [Orchestrator:" # id # "]" };
            case null { "" };
        };
        
        let requestInfo = switch (requestId) {
            case (?id) { " [Req:" # id # "]" };
            case null { "" };
        };
        
        let durationInfo = switch (duration) {
            case (?dur) { " [" # Int.toText(dur) # "ms]" };
            case null { "" };
        };
        
        Debug.print(logLevelText # " [" # component # "]" # agentInfo # orchestratorInfo # requestInfo # durationInfo # " " # message);
    };
    
    // Convenience functions for different log levels
    public func debug(component: Text, message: Text, agentId: ?Text, requestId: ?Text) : () {
        logAgentOperation(#DEBUG, component, agentId, null, message, null, requestId, null);
    };
    
    public func info(component: Text, message: Text, agentId: ?Text, requestId: ?Text) : () {
        logAgentOperation(#INFO, component, agentId, null, message, null, requestId, null);
    };
    
    public func warn(component: Text, message: Text, agentId: ?Text, requestId: ?Text) : () {
        logAgentOperation(#WARN, component, agentId, null, message, null, requestId, null);
    };
    
    public func error(component: Text, message: Text, agentId: ?Text, requestId: ?Text) : () {
        logAgentOperation(#ERROR, component, agentId, null, message, null, requestId, null);
    };
    
    public func agentCoordination(component: Text, message: Text, agentId: ?Text, orchestratorId: ?Text, requestId: ?Text) : () {
        logAgentOperation(#AGENT_COORDINATION, component, agentId, orchestratorId, message, null, requestId, null);
    };
    
    public func orchestrator(component: Text, message: Text, orchestratorId: ?Text, requestId: ?Text, duration: ?Int) : () {
        logAgentOperation(#ORCHESTRATOR, component, null, orchestratorId, message, null, requestId, duration);
    };
    
    public func performance(component: Text, message: Text, agentId: ?Text, duration: Int, metadata: ?Text) : () {
        logAgentOperation(#PERFORMANCE, component, agentId, null, message, metadata, null, ?duration);
    };
    
    // Enhanced performance metrics logging
    public func logPerformanceMetrics(component: Text, responseTime: Int, successRate: Float, agentId: ?Text) : () {
        let metricsMessage = "Performance metrics: response_time=" # Int.toText(responseTime) # "ms, success_rate=" # Float.toText(successRate);
        logAgentOperation(#PERFORMANCE, component, agentId, null, metricsMessage, ?"metrics=true", null, ?responseTime);
    };
    
    // Duration tracking for operations
    public func logDurationTracking(component: Text, operation: Text, duration: Int, agentId: ?Text) : () {
        let durationMessage = "Duration tracking for " # operation # ": " # Int.toText(duration) # "ms";
        logAgentOperation(#PERFORMANCE, component, agentId, null, durationMessage, ?"duration_tracking=true", null, ?duration);
    };
    
    // Get recent logs with filtering
    public func getRecentLogs(count: ?Nat, level: ?LogLevel, component: ?Text, agentId: ?Text) : [LogEntry] {
        let maxCount = switch (count) {
            case (?c) { if (c > logBuffer.size()) logBuffer.size() else c };
            case null { logBuffer.size() };
        };
        
        let allLogs = Buffer.toArray(logBuffer);
        let filteredLogs = Array.filter<LogEntry>(allLogs, func(entry) {
            let levelMatch = switch (level) {
                case (?l) { entry.level == l };
                case null { true };
            };
            
            let componentMatch = switch (component) {
                case (?c) { entry.component == c };
                case null { true };
            };
            
            let agentMatch = switch (agentId) {
                case (?a) { 
                    switch (entry.agentId) {
                        case (?entryAgent) { entryAgent == a };
                        case null { false };
                    }
                };
                case null { true };
            };
            
            levelMatch and componentMatch and agentMatch
        });
        
        // Return most recent entries
        let startIndex = if (filteredLogs.size() > maxCount) {
            filteredLogs.size() - maxCount
        } else {
            0
        };
        
        Array.slice<LogEntry>(filteredLogs, startIndex, filteredLogs.size())
    };
    
    // Get log statistics
    public func getLogStats() : {
        totalLogs: Nat;
        bufferSize: Nat;
        maxBufferSize: Nat;
        logsByLevel: [(LogLevel, Nat)];
    } {
        let allLogs = Buffer.toArray(logBuffer);
        
        var debugCount = 0;
        var infoCount = 0;
        var warnCount = 0;
        var errorCount = 0;
        var agentCoordCount = 0;
        var orchestratorCount = 0;
        var performanceCount = 0;
        
        for (entry in allLogs.vals()) {
            switch (entry.level) {
                case (#DEBUG) { debugCount += 1 };
                case (#INFO) { infoCount += 1 };
                case (#WARN) { warnCount += 1 };
                case (#ERROR) { errorCount += 1 };
                case (#AGENT_COORDINATION) { agentCoordCount += 1 };
                case (#ORCHESTRATOR) { orchestratorCount += 1 };
                case (#PERFORMANCE) { performanceCount += 1 };
            };
        };
        
        {
            totalLogs = logCounter;
            bufferSize = logBuffer.size();
            maxBufferSize = maxLogEntries;
            logsByLevel = [
                (#DEBUG, debugCount),
                (#INFO, infoCount),
                (#WARN, warnCount),
                (#ERROR, errorCount),
                (#AGENT_COORDINATION, agentCoordCount),
                (#ORCHESTRATOR, orchestratorCount),
                (#PERFORMANCE, performanceCount)
            ];
        }
    };
    
    // Clear logs (for maintenance)
    public func clearLogs() : () {
        logBuffer.clear();
        logCounter := 0;
    };
    
    // Set maximum log entries
    public func setMaxLogEntries(max: Nat) : () {
        maxLogEntries := max;
        
        // Trim buffer if necessary
        while (logBuffer.size() > maxLogEntries) {
            let _ = logBuffer.removeFirst();
        };
    };
}
