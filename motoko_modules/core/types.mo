/**
 * AVAI Core Types - Fundamental type definitions for the Motoko AVAI system
 * Provides comprehensive type safety and structure for all AVAI operations
 */

import Time "mo:base/Time";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Float "mo:base/Float";

module Types {
    
    // ================================
    // CORE SYSTEM TYPES
    // ================================
    
    /// System-wide result type for error handling
    public type AVAIResult<T> = Result.Result<T, AVAIError>;
    
    /// Comprehensive error type system
    public type AVAIError = {
        #InvalidInput : Text;
        #ProcessingError : Text;
        #NetworkError : Text;
        #AuthenticationError : Text;
        #ResourceLimit : Text;
        #NotFound : Text;
        #PermissionDenied : Text;
        #SystemError : Text;
        #PythonFallbackRequired : Text;
        #TimeoutError : Text;
        #ConfigurationError : Text;
    };
    
    /// System status enumeration
    public type SystemStatus = {
        #Active;
        #Initializing;
        #Maintenance;
        #Error;
        #PythonFallback;
    };
    
    // ================================
    // PROMPT AND TASK TYPES
    // ================================
    
    /// Prompt classification for intelligent routing
    public type PromptCategory = {
        #Research : ResearchType;
        #CodeAnalysis : CodeType;
        #SecurityAudit : SecurityType;
        #ReportGeneration : ReportType;
        #BrowserAutomation : BrowserType;
        #GeneralConversation;
        #SystemCommand;
        #LearningFeedback;
    };
    
    /// Research-specific subtypes
    public type ResearchType = {
        #WebResearch;
        #DataAnalysis;
        #FactVerification;
        #TrendAnalysis;
        #CompetitorAnalysis;
    };
    
    /// Code analysis subtypes
    public type CodeType = {
        #SecurityScan;
        #PerformanceAnalysis;
        #CodeReview;
        #RefactoringAssistance;
        #DebugAssistance;
        #DocumentationGeneration;
    };
    
    /// Security audit subtypes
    public type SecurityType = {
        #VulnerabilityScanning;
        #ComplianceCheck;
        #PenetrationTesting;
        #SecurityReporting;
        #ThreatModeling;
    };
    
    /// Report generation subtypes
    public type ReportType = {
        #SecurityReport;
        #AnalysisReport;
        #PerformanceReport;
        #ComplianceReport;
        #ExecutiveSummary;
    };
    
    /// Browser automation subtypes
    public type BrowserType = {
        #DataExtraction;
        #FormAutomation;
        #TestingAutomation;
        #MonitoringTasks;
        #InteractionSimulation;
    };
    
    /// Task priority levels
    public type Priority = {
        #Critical;
        #High;
        #Medium;
        #Low;
        #Background;
    };
    
    /// Task status tracking
    public type TaskStatus = {
        #Queued : Int; // timestamp
        #Processing : { started: Int; agent: Text };
        #Completed : { finished: Int; duration: Nat };
        #Failed : { error: AVAIError; timestamp: Int };
        #PythonDelegated : { delegated: Int; reason: Text };
    };
    
    // ================================
    // AGENT AND ORCHESTRATOR TYPES
    // ================================
    
    /// Agent capability definitions
    public type AgentCapability = {
        #WebSearch;
        #CodeAnalysis;
        #SecurityScanning;
        #ReportGeneration;
        #BrowserAutomation;
        #DataProcessing;
        #MachineLearning;
        #NaturalLanguageProcessing;
    };
    
    /// Agent performance metrics
    public type AgentMetrics = {
        taskCount: Nat;
        successRate: Float;
        averageResponseTime: Nat; // milliseconds
        lastUsed: Int; // timestamp
        errorCount: Nat;
        qualityScore: Float; // 0.0 to 1.0
    };
    
    /// Agent configuration
    public type AgentConfig = {
        id: Text;
        name: Text;
        capabilities: [AgentCapability];
        maxConcurrentTasks: Nat;
        timeoutMs: Nat;
        fallbackToPython: Bool;
        learningEnabled: Bool;
    };
    
    /// Agent status for runtime monitoring
    public type AgentStatus = {
        id: Text;
        name: Text;
        isActive: Bool;
        capabilities: [AgentCapability];
        lastUsed: Int;
        successRate: Float;
        tasksCompleted: Nat;
    };
    
    // ================================
    // LEARNING SYSTEM TYPES
    // ================================
    
    /// Learning feedback types
    public type FeedbackType = {
        #Positive : Float; // confidence score
        #Negative : Float; // severity score
        #Neutral;
        #Correction : Text; // corrected response
    };
    
    /// Pattern recognition data
    public type Pattern = {
        id: Text;
        pattern: Text;
        frequency: Nat;
        successRate: Float;
        lastSeen: Int;
        category: PromptCategory;
        confidence: Float;
    };
    
    /// Learning model state
    public type LearningModel = {
        version: Nat;
        trainedOn: Nat; // number of examples
        accuracy: Float;
        lastUpdated: Int;
        parameters: [(Text, Float)];
    };
    
    /// User interaction context
    public type UserContext = {
        sessionId: Text;
        userId: ?Text;
        preferences: [(Text, Text)];
        interactionHistory: [Text];
        learningProfile: ?LearningProfile;
    };
    
    /// User learning profile
    public type LearningProfile = {
        preferredAgents: [Text];
        commonTasks: [PromptCategory];
        feedbackPatterns: [(Text, FeedbackType)];
        skillLevel: SkillLevel;
        customSettings: [(Text, Text)];
    };
    
    /// User skill level for adaptive responses
    public type SkillLevel = {
        #Beginner;
        #Intermediate;
        #Advanced;
        #Expert;
        #Adaptive; // Auto-detected
    };
    
    // ================================
    // REPORT AND ANALYSIS TYPES
    // ================================
    
    /// Report structure
    public type Report = {
        id: Text;
        title: Text;
        category: ReportType;
        content: ReportContent;
        metadata: ReportMetadata;
        format: ReportFormat;
        created: Int;
        lastModified: Int;
    };
    
    /// Report content structure
    public type ReportContent = {
        sections: [ReportSection];
        summary: Text;
        recommendations: [Text];
        findings: [Finding];
        attachments: [Attachment];
    };
    
    /// Report section
    public type ReportSection = {
        title: Text;
        content: Text;
        subsections: [ReportSection];
        charts: ?[ChartData];
        codeBlocks: ?[CodeBlock];
    };
    
    /// Security or analysis finding
    public type Finding = {
        id: Text;
        severity: Severity;
        category: Text;
        title: Text;
        description: Text;
        location: ?Location;
        recommendation: Text;
        evidence: [Evidence];
        cvssScore: ?Float;
    };
    
    /// Severity levels
    public type Severity = {
        #Critical;
        #High;
        #Medium;
        #Low;
        #Info;
    };
    
    /// Location information for findings
    public type Location = {
        file: ?Text;
        line: ?Nat;
        column: ?Nat;
        function: ?Text;
        url: ?Text;
    };
    
    /// Evidence for findings
    public type Evidence = {
        type_: EvidenceType;
        data: Text;
        timestamp: Int;
        source: Text;
    };
    
    /// Evidence types
    public type EvidenceType = {
        #CodeSnippet;
        #Screenshot;
        #LogEntry;
        #NetworkTrace;
        #FileContent;
        #APIResponse;
    };
    
    /// Report formats
    public type ReportFormat = {
        #Markdown;
        #JSON;
        #PDF;
        #HTML;
        #PlainText;
    };
    
    /// Report metadata
    public type ReportMetadata = {
        author: Text;
        version: Text;
        tags: [Text];
        visibility: Visibility;
        expiresAt: ?Int;
        size: Nat; // bytes
    };
    
    /// Visibility levels
    public type Visibility = {
        #Public;
        #Private;
        #Shared : [Text]; // user IDs
        #Organization;
    };
    
    // ================================
    // INTEGRATION TYPES
    // ================================
    
    /// Redis integration types
    public type RedisConfig = {
        host: Text;
        port: Nat16;
        database: Nat;
        password: ?Text;
        maxConnections: Nat;
        timeoutMs: Nat;
    };
    
    /// WebSocket message types
    public type WebSocketMessage = {
        id: Text;
        type_: MessageType;
        payload: Text;
        timestamp: Int;
        sender: Text;
        recipient: ?Text;
    };
    
    /// WebSocket message types
    public type MessageType = {
        #PromptRequest;
        #PromptResponse;
        #StatusUpdate;
        #ErrorNotification;
        #Heartbeat;
        #LearningFeedback;
        #SystemAlert;
    };
    
    /// Python bridge communication
    public type PythonRequest = {
        id: Text;
        moduleName: Text;
        functionName: Text;
        arguments: [(Text, Text)];
        timeout: Nat;
        priority: Priority;
    };
    
    /// Python response
    public type PythonResponse = {
        id: Text;
        success: Bool;
        result: ?Text;
        error: ?Text;
        executionTime: Nat;
        metadata: [(Text, Text)];
    };
    
    // ================================
    // CONFIGURATION TYPES
    // ================================
    
    /// System configuration
    public type SystemConfig = {
        redis: RedisConfig;
        websocket: WebSocketConfig;
        agents: [AgentConfig];
        learning: LearningConfig;
        security: SecurityConfig;
        performance: PerformanceConfig;
    };
    
    /// WebSocket configuration
    public type WebSocketConfig = {
        url: Text;
        maxConnections: Nat;
        heartbeatInterval: Nat;
        reconnectAttempts: Nat;
        messageBufferSize: Nat;
    };
    
    /// Learning system configuration
    public type LearningConfig = {
        enabled: Bool;
        learningRate: Float;
        batchSize: Nat;
        modelUpdateInterval: Nat;
        feedbackWeighting: Float;
        patternDetectionThreshold: Float;
    };
    
    /// Security configuration
    public type SecurityConfig = {
        authentication: Bool;
        rateLimiting: Bool;
        maxRequestsPerMinute: Nat;
        encryptionEnabled: Bool;
        auditLogging: Bool;
        allowedOrigins: [Text];
    };
    
    /// Performance configuration
    public type PerformanceConfig = {
        maxConcurrentTasks: Nat;
        taskTimeoutMs: Nat;
        cacheSize: Nat;
        memoryLimit: Nat;
        cpuLimit: Float;
        fallbackThresholdMs: Nat;
    };
    
    // ================================
    // UTILITY TYPES
    // ================================
    
    /// Chart data for reports
    public type ChartData = {
        type_: ChartType;
        title: Text;
        data: [(Text, Float)]; // label, value pairs
        options: [(Text, Text)];
    };
    
    /// Chart types
    public type ChartType = {
        #Line;
        #Bar;
        #Pie;
        #Scatter;
        #Histogram;
    };
    
    /// Code block for reports
    public type CodeBlock = {
        language: Text;
        code: Text;
        filename: ?Text;
        lineNumbers: Bool;
        highlighted: [Nat]; // highlighted line numbers
    };
    
    /// File attachment
    public type Attachment = {
        filename: Text;
        mimeType: Text;
        size: Nat;
        content: [Nat8]; // binary content
        checksum: Text;
    };
    
    /// API response wrapper
    public type APIResponse<T> = {
        success: Bool;
        data: ?T;
        error: ?Text;
        timestamp: Int;
        requestId: Text;
        processingTime: Nat;
    };
    
    /// Pagination for large datasets
    public type Pagination = {
        page: Nat;
        size: Nat;
        total: Nat;
        hasNext: Bool;
        hasPrevious: Bool;
    };
    
    /// Search parameters
    public type SearchParams = {
        searchQuery: Text;
        filters: [(Text, Text)];
        sortBy: ?Text;
        sortOrder: SortOrder;
        pagination: Pagination;
    };
    
    /// Sort order
    public type SortOrder = {
        #Ascending;
        #Descending;
    };
    
    // ================================
    // HELPER FUNCTIONS
    // ================================
    
    /// Create a new AVAI result
    public func success<T>(value: T): AVAIResult<T> {
        #ok(value)
    };
    
    /// Create an error result
    public func error<T>(err: AVAIError): AVAIResult<T> {
        #err(err)
    };
    
    /// Get current timestamp
    public func getCurrentTimestamp(): Int {
        Time.now()
    };
    
    /// Create a new task ID
    public func generateTaskId(): Text {
        let timestamp = Time.now();
        "task_" # Int.toText(timestamp)
    };
    
    /// Create a new report ID
    public func generateReportId(): Text {
        let timestamp = Time.now();
        "report_" # Int.toText(timestamp)
    };
    
    /// Check if a capability is supported
    public func hasCapability(capabilities: [AgentCapability], required: AgentCapability): Bool {
        Array.find<AgentCapability>(capabilities, func(cap) = cap == required) != null
    };
    
    /// Calculate success rate
    public func calculateSuccessRate(successes: Nat, total: Nat): Float {
        if (total == 0) {
            0.0
        } else {
            Float.fromInt(successes) / Float.fromInt(total)
        }
    };
    
    /// Format timestamp as readable string
    public func formatTimestamp(timestamp: Int): Text {
        // This would be implemented with proper time formatting
        Int.toText(timestamp)
    };
    
    // ================================
    // AUDIT SYSTEM TYPES
    // ================================
    
    /// Audit initialization request
    public type AuditInitRequest = {
        repositoryUrl : Text;
        auditType : Text; // "basic", "comprehensive", "deep"
        clientId : Text;
    };
    
    /// Repository analysis request
    public type RepositoryAnalysisRequest = {
        repositoryUrl : Text;
        analysisType : Text;
        generateReport : Bool;
        includeSecurityScan : Bool;
        includeDependencyAudit : Bool;
        includeCodeQuality : Bool;
    };
    
    /// Analysis result
    public type AnalysisResult = {
        repositoryUrl : Text;
        analysisType : Text;
        findingsCount : Nat;
        securityIssues : Nat;
        codeQualityScore : Float;
        dependencyVulnerabilities : Nat;
        riskLevel : Text;
        recommendations : [Text];
        analysisTimestamp : Int;
        processingTime : Int;
    };
    
    /// Audit report request
    public type AuditReportRequest = {
        auditId : Text;
        reportType : Text; // "executive_summary", "detailed", "technical"
        includeRecommendations : Bool;
        outputFormat : Text; // "pdf", "html", "json"
    };
    
    /// Audit report result
    public type AuditReportResult = {
        auditId : Text;
        reportType : Text;
        totalFindings : Nat;
        criticalIssues : Nat;
        highSeverityIssues : Nat;
        mediumSeverityIssues : Nat;
        lowSeverityIssues : Nat;
        overallRiskScore : Float;
        reportPath : Text;
        reportGenerated : Bool;
        generationTime : Int;
    };
}
