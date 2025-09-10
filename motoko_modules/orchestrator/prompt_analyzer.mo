/**
 * AVAI Smart Prompt Analyzer - Intelligent prompt analysis and classification
 * Provides advanced NLP capabilities for understanding user intent and context
 */

import Types "../core/types";
import Utils "../core/utils";

import Time "mo:base/Time";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Float "mo:base/Float";
import HashMap "mo:base/HashMap";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Result "mo:base/Result";

module PromptAnalyzer {
    
    // ================================
    // ANALYSIS CONFIGURATION
    // ================================
    
    /// Analysis confidence thresholds
    private let CONFIDENCE_THRESHOLDS = {
        high = 0.85;
        medium = 0.65;
        low = 0.45;
    };
    
    /// Complexity calculation weights
    private let COMPLEXITY_WEIGHTS = {
        lengthWeight = 0.2;
        keywordWeight = 0.3;
        contextWeight = 0.25;
        technicalWeight = 0.25;
    };
    
    /// Pattern learning storage
    private var learnedPatterns = HashMap.HashMap<Text, Types.Pattern>(50, Text.equal, Text.hash);
    
    /// Analysis cache for performance
    private var analysisCache = HashMap.HashMap<Text, AnalysisResult>(100, Text.equal, Text.hash);
    
    // ================================
    // ANALYSIS RESULT TYPES
    // ================================
    
    /// Comprehensive analysis result
    public type AnalysisResult = {
        category: Types.PromptCategory;
        confidence: Float;
        complexity: Float;
        keywords: [Text];
        intent: Intent;
        context: ContextAnalysis;
        suggestedAgents: [Text];
        estimatedProcessingTime: Nat; // milliseconds
        requiresExternalData: Bool;
        technicalComplexity: TechnicalComplexity;
        userExperienceLevel: Types.SkillLevel;
    };
    
    /// User intent classification
    public type Intent = {
        #Question;           // Asking for information
        #Request;           // Requesting action
        #Analysis;          // Requesting analysis/evaluation  
        #Creation;          // Creating something new
        #Modification;      // Changing existing content
        #Troubleshooting;   // Fixing problems
        #Learning;          // Educational purposes
        #Automation;        // Automating processes
    };
    
    /// Context analysis details
    public type ContextAnalysis = {
        hasCodeReferences: Bool;
        hasURLReferences: Bool;
        hasFileReferences: Bool;
        mentionsTimeConstraints: Bool;
        requiresRealTimeData: Bool;
        involvesPersonalData: Bool;
        crossDomainComplexity: Bool;
        followUpLikely: Bool;
    };
    
    /// Technical complexity assessment
    public type TechnicalComplexity = {
        level: ComplexityLevel;
        domains: [TechnicalDomain];
        estimatedSteps: Nat;
        parallelizable: Bool;
        requiresSpecialization: Bool;
    };
    
    /// Complexity levels
    public type ComplexityLevel = {
        #Simple;      // Single-step, well-defined
        #Moderate;    // Multi-step, standard patterns
        #Complex;     // Multi-domain, requires expertise
        #Expert;      // Cutting-edge, high specialization
    };
    
    /// Technical domains involved
    public type TechnicalDomain = {
        #WebDevelopment;
        #DataScience;
        #Cybersecurity;
        #DevOps;
        #MachineLearning;
        #SystemAdmin;
        #Database;
        #NetworkingProtocols;
        #CloudInfrastructure;
        #APIIntegration;
    };
    
    // ================================
    // INITIALIZATION
    // ================================
    
    /// Initialize the prompt analyzer
    public func initialize(): async () {
        Utils.debugLog("🧠 Initializing Smart Prompt Analyzer...");
        
        // Load pre-trained patterns
        await loadPretrainedPatterns();
        
        // Initialize analysis cache
        analysisCache := HashMap.HashMap<Text, AnalysisResult>(100, Text.equal, Text.hash);
        
        Utils.debugLog("✅ Smart Prompt Analyzer initialized");
    };
    
    /// Load pre-trained patterns for common prompt types
    private func loadPretrainedPatterns(): async () {
        // Security analysis patterns
        learnedPatterns.put("security_audit", {
            id = "security_audit";
            pattern = "security|audit|vulnerability|scan|penetration|test";
            frequency = 100;
            successRate = 0.92;
            lastSeen = Time.now();
            category = #SecurityAudit(#VulnerabilityScanning);
            confidence = 0.88;
        });
        
        // Code analysis patterns
        learnedPatterns.put("code_review", {
            id = "code_review";
            pattern = "code|review|analyze|quality|refactor|optimize";
            frequency = 150;
            successRate = 0.89;
            lastSeen = Time.now();
            category = #CodeAnalysis(#CodeReview);
            confidence = 0.85;
        });
        
        // Research patterns
        learnedPatterns.put("web_research", {
            id = "web_research";
            pattern = "research|find|search|investigate|data|information";
            frequency = 200;
            successRate = 0.91;
            lastSeen = Time.now();
            category = #Research(#WebResearch);
            confidence = 0.87;
        });
        
        // Report generation patterns
        learnedPatterns.put("report_generation", {
            id = "report_generation";
            pattern = "report|generate|summary|findings|document|create";
            frequency = 75;
            successRate = 0.86;
            lastSeen = Time.now();
            category = #ReportGeneration(#AnalysisReport);
            confidence = 0.83;
        });
    };
    
    // ================================
    // MAIN ANALYSIS FUNCTIONS
    // ================================
    
    /// Comprehensive prompt analysis with intelligent classification
    public func analyzePrompt(
        prompt: Text, 
        userContext: ?Types.UserContext
    ): AnalysisResult {
        
        let startTime = Time.now();
        
        // Check cache first for performance
        let cacheKey = generateCacheKey(prompt, userContext);
        switch (analysisCache.get(cacheKey)) {
            case (?cached) { 
                Utils.debugLog("📋 Using cached analysis for prompt");
                return cached;
            };
            case null { /* Continue with fresh analysis */ };
        };
        
        Utils.debugLog("🔍 Analyzing prompt: " # Utils.sanitizeForLogging(prompt));
        
        // Step 1: Basic text processing
        let normalizedPrompt = Utils.normalizeText(prompt);
        let keywords = Utils.extractKeywords(normalizedPrompt);
        
        // Step 2: Category classification
        let category = classifyPromptCategory(normalizedPrompt, keywords, userContext);
        
        // Step 3: Intent analysis
        let intent = analyzeIntent(normalizedPrompt, keywords);
        
        // Step 4: Context analysis
        let contextAnalysis = analyzeContext(normalizedPrompt);
        
        // Step 5: Complexity assessment
        let complexity = calculateComplexity(normalizedPrompt, keywords, contextAnalysis);
        
        // Step 6: Technical complexity
        let technicalComplexity = assessTechnicalComplexity(normalizedPrompt, category, keywords);
        
        // Step 7: User experience level detection
        let userLevel = detectUserExperienceLevel(normalizedPrompt, userContext);
        
        // Step 8: Agent suggestions
        let suggestedAgents = suggestOptimalAgents(category, technicalComplexity, complexity);
        
        // Step 9: Processing time estimation
        let estimatedTime = estimateProcessingTime(category, complexity, technicalComplexity);
        
        // Step 10: External data requirement check
        let requiresExternalData = checkExternalDataNeeds(normalizedPrompt, category);
        
        // Step 11: Confidence calculation
        let confidence = calculateAnalysisConfidence(category, keywords, contextAnalysis);
        
        let result: AnalysisResult = {
            category = category;
            confidence = confidence;
            complexity = complexity;
            keywords = keywords;
            intent = intent;
            context = contextAnalysis;
            suggestedAgents = suggestedAgents;
            estimatedProcessingTime = estimatedTime;
            requiresExternalData = requiresExternalData;
            technicalComplexity = technicalComplexity;
            userExperienceLevel = userLevel;
        };
        
        // Cache the result
        analysisCache.put(cacheKey, result);
        
        // Update learning patterns
        updateLearningPatterns(normalizedPrompt, result);
        
        let processingTime = Int.abs(Time.now() - startTime) / 1000000;
        Utils.debugLog("✅ Analysis completed in " # Utils.formatDuration(processingTime));
        
        result
    };
    
    // ================================
    // CLASSIFICATION FUNCTIONS
    // ================================
    
    /// Classify prompt into appropriate category using ML-enhanced rules
    private func classifyPromptCategory(
        prompt: Text,
        keywords: [Text],
        userContext: ?Types.UserContext
    ): Types.PromptCategory {
        
        // First, check learned patterns
        for ((_, pattern) in learnedPatterns.entries()) {
            if (matchesPattern(prompt, pattern.pattern) and pattern.confidence > CONFIDENCE_THRESHOLDS.medium) {
                // Update pattern usage
                updatePatternUsage(pattern.id);
                return pattern.category;
            };
        };
        
        // Fall back to rule-based classification with contextual enhancement
        let baseCategory = Utils.analyzePromptText(prompt);
        
        // Enhance with user context
        switch (userContext) {
            case (?context) {
                enhanceCategoryWithContext(baseCategory, context)
            };
            case null { baseCategory };
        }
    };
    
    /// Enhance category classification with user context
    private func enhanceCategoryWithContext(
        baseCategory: Types.PromptCategory,
        context: Types.UserContext
    ): Types.PromptCategory {
        
        switch (context.learningProfile) {
            case (?profile) {
                // Check if user commonly does this type of task
                let isCommon = Array.find<Types.PromptCategory>(profile.commonTasks, func(task) {
                    debug_show(task) == debug_show(baseCategory)
                }) != null;
                
                if (isCommon) {
                    // User is familiar with this category, keep classification
                    baseCategory
                } else {
                    // Check if we should suggest a different approach based on skill level
                    adaptCategoryForSkillLevel(baseCategory, profile.skillLevel)
                }
            };
            case null { baseCategory };
        }
    };
    
    /// Adapt category based on user skill level
    private func adaptCategoryForSkillLevel(
        category: Types.PromptCategory,
        skillLevel: Types.SkillLevel
    ): Types.PromptCategory {
        switch (skillLevel) {
            case (#Beginner) {
                // For beginners, prefer simpler approaches
                switch (category) {
                    case (#CodeAnalysis(#SecurityScan)) { #CodeAnalysis(#CodeReview) };
                    case (#SecurityAudit(#PenetrationTesting)) { #SecurityAudit(#VulnerabilityScanning) };
                    case (_) { category };
                }
            };
            case (#Expert) {
                // For experts, suggest more advanced approaches
                switch (category) {
                    case (#CodeAnalysis(#CodeReview)) { #CodeAnalysis(#SecurityScan) };
                    case (#Research(#WebResearch)) { #Research(#DataAnalysis) };
                    case (_) { category };
                }
            };
            case (_) { category }; // Intermediate, Advanced, Adaptive keep original
        }
    };
    
    // ================================
    // INTENT ANALYSIS
    // ================================
    
    /// Analyze user intent from prompt structure and content
    private func analyzeIntent(prompt: Text, keywords: [Text]): Intent {
        let lowerPrompt = Text.toLowercase(prompt);
        
        // Question patterns
        if (Utils.containsAny(lowerPrompt, ["what", "how", "why", "when", "where", "which", "?"])) {
            #Question
        }
        // Request patterns  
        else if (Utils.containsAny(lowerPrompt, ["please", "can you", "could you", "would you", "help me"])) {
            #Request
        }
        // Analysis patterns
        else if (Utils.containsAny(lowerPrompt, ["analyze", "evaluate", "assess", "examine", "review"])) {
            #Analysis
        }
        // Creation patterns
        else if (Utils.containsAny(lowerPrompt, ["create", "generate", "build", "make", "develop", "design"])) {
            #Creation
        }
        // Modification patterns
        else if (Utils.containsAny(lowerPrompt, ["modify", "change", "update", "edit", "improve", "refactor"])) {
            #Modification
        }
        // Troubleshooting patterns
        else if (Utils.containsAny(lowerPrompt, ["fix", "debug", "solve", "troubleshoot", "error", "problem"])) {
            #Troubleshooting
        }
        // Learning patterns
        else if (Utils.containsAny(lowerPrompt, ["learn", "teach", "explain", "understand", "tutorial"])) {
            #Learning
        }
        // Automation patterns
        else if (Utils.containsAny(lowerPrompt, ["automate", "script", "batch", "schedule", "workflow"])) {
            #Automation
        }
        // Default to request
        else {
            #Request
        }
    };
    
    // ================================
    // CONTEXT ANALYSIS
    // ================================
    
    /// Analyze contextual elements in the prompt
    private func analyzeContext(prompt: Text): ContextAnalysis {
        let lowerPrompt = Text.toLowercase(prompt);
        
        {
            hasCodeReferences = Utils.containsAny(lowerPrompt, ["```", "function", "class", "variable", "method", "api"]);
            hasURLReferences = Utils.containsAny(lowerPrompt, ["http", "www", "github", "gitlab", "website", "url"]);
            hasFileReferences = Utils.containsAny(lowerPrompt, [".py", ".js", ".ts", ".go", ".rs", ".java", "file", "directory"]);
            mentionsTimeConstraints = Utils.containsAny(lowerPrompt, ["urgent", "asap", "deadline", "quickly", "immediately"]);
            requiresRealTimeData = Utils.containsAny(lowerPrompt, ["current", "latest", "real-time", "live", "now", "today"]);
            involvesPersonalData = Utils.containsAny(lowerPrompt, ["personal", "private", "confidential", "sensitive", "pii"]);
            crossDomainComplexity = countTechnicalDomains(lowerPrompt) > 2;
            followUpLikely = Utils.containsAny(lowerPrompt, ["series", "multiple", "comprehensive", "detailed", "thorough"]);
        }
    };
    
    /// Count technical domains mentioned in prompt
    private func countTechnicalDomains(prompt: Text): Nat {
        var count = 0;
        
        if (Utils.containsAny(prompt, ["web", "html", "css", "javascript", "frontend", "backend"])) count += 1;
        if (Utils.containsAny(prompt, ["data", "analytics", "statistics", "ml", "ai", "machine learning"])) count += 1;
        if (Utils.containsAny(prompt, ["security", "vulnerability", "encryption", "authentication"])) count += 1;
        if (Utils.containsAny(prompt, ["devops", "deployment", "ci/cd", "docker", "kubernetes"])) count += 1;
        if (Utils.containsAny(prompt, ["database", "sql", "mongodb", "redis", "query"])) count += 1;
        if (Utils.containsAny(prompt, ["network", "tcp", "udp", "http", "api", "protocol"])) count += 1;
        if (Utils.containsAny(prompt, ["cloud", "aws", "azure", "gcp", "infrastructure"])) count += 1;
        
        count
    };
    
    // ================================
    // COMPLEXITY CALCULATION
    // ================================
    
    /// Calculate prompt complexity score (0.0 to 1.0)
    private func calculateComplexity(
        prompt: Text,
        keywords: [Text],
        context: ContextAnalysis
    ): Float {
        
        // Length complexity (longer prompts are generally more complex)
        let lengthScore = Float.min(1.0, Float.fromInt(prompt.size()) / 1000.0);
        
        // Keyword complexity (technical keywords increase complexity)
        let keywordScore = Float.min(1.0, Float.fromInt(keywords.size()) / 20.0);
        
        // Context complexity
        let contextScore = calculateContextComplexity(context);
        
        // Technical complexity
        let technicalScore = calculateTechnicalKeywordComplexity(keywords);
        
        // Weighted average
        (lengthScore * COMPLEXITY_WEIGHTS.lengthWeight) +
        (keywordScore * COMPLEXITY_WEIGHTS.keywordWeight) +
        (contextScore * COMPLEXITY_WEIGHTS.contextWeight) +
        (technicalScore * COMPLEXITY_WEIGHTS.technicalWeight)
    };
    
    /// Calculate context-based complexity
    private func calculateContextComplexity(context: ContextAnalysis): Float {
        var score = 0.0;
        
        if (context.hasCodeReferences) score += 0.2;
        if (context.hasURLReferences) score += 0.15;
        if (context.hasFileReferences) score += 0.15;
        if (context.requiresRealTimeData) score += 0.25;
        if (context.involvesPersonalData) score += 0.2;
        if (context.crossDomainComplexity) score += 0.3;
        if (context.followUpLikely) score += 0.1;
        
        Float.min(1.0, score)
    };
    
    /// Calculate technical keyword complexity
    private func calculateTechnicalKeywordComplexity(keywords: [Text]): Float {
        let technicalKeywords = [
            "algorithm", "optimization", "machine learning", "neural network",
            "blockchain", "cryptography", "microservices", "kubernetes",
            "terraform", "ansible", "penetration testing", "reverse engineering"
        ];
        
        var matches = 0;
        for (keyword in keywords.vals()) {
            if (Array.find<Text>(technicalKeywords, func(tech) = Text.contains(keyword, #text tech)) != null) {
                matches += 1;
            };
        };
        
        Float.min(1.0, Float.fromInt(matches) / 5.0)
    };
    
    // ================================
    // TECHNICAL COMPLEXITY ASSESSMENT
    // ================================
    
    /// Assess technical complexity and domains
    private func assessTechnicalComplexity(
        prompt: Text,
        category: Types.PromptCategory,
        keywords: [Text]
    ): TechnicalComplexity {
        
        let domains = identifyTechnicalDomains(prompt, keywords);
        let level = determineTechnicalLevel(prompt, domains.size());
        let steps = estimateRequiredSteps(category, level);
        
        {
            level = level;
            domains = domains;
            estimatedSteps = steps;
            parallelizable = isParallelizable(category, domains);
            requiresSpecialization = level == #Expert or domains.size() > 2;
        }
    };
    
    /// Identify technical domains involved
    private func identifyTechnicalDomains(prompt: Text, keywords: [Text]): [TechnicalDomain] {
        let lowerPrompt = Text.toLowercase(prompt);
        var domains = Buffer.Buffer<TechnicalDomain>(5);
        
        if (Utils.containsAny(lowerPrompt, ["web", "html", "css", "javascript", "react", "vue"])) {
            domains.add(#WebDevelopment);
        };
        
        if (Utils.containsAny(lowerPrompt, ["data", "analytics", "pandas", "numpy", "visualization"])) {
            domains.add(#DataScience);
        };
        
        if (Utils.containsAny(lowerPrompt, ["security", "vulnerability", "penetration", "encryption"])) {
            domains.add(#Cybersecurity);
        };
        
        if (Utils.containsAny(lowerPrompt, ["devops", "docker", "kubernetes", "ci/cd", "deployment"])) {
            domains.add(#DevOps);
        };
        
        if (Utils.containsAny(lowerPrompt, ["machine learning", "ml", "ai", "neural", "model"])) {
            domains.add(#MachineLearning);
        };
        
        if (Utils.containsAny(lowerPrompt, ["server", "linux", "admin", "system", "configuration"])) {
            domains.add(#SystemAdmin);
        };
        
        if (Utils.containsAny(lowerPrompt, ["database", "sql", "mongodb", "postgresql", "query"])) {
            domains.add(#Database);
        };
        
        if (Utils.containsAny(lowerPrompt, ["network", "tcp", "udp", "protocol", "routing"])) {
            domains.add(#NetworkingProtocols);
        };
        
        if (Utils.containsAny(lowerPrompt, ["cloud", "aws", "azure", "gcp", "serverless"])) {
            domains.add(#CloudInfrastructure);
        };
        
        if (Utils.containsAny(lowerPrompt, ["api", "rest", "graphql", "integration", "webhook"])) {
            domains.add(#APIIntegration);
        };
        
        Buffer.toArray(domains)
    };
    
    /// Determine technical complexity level
    private func determineTechnicalLevel(prompt: Text, domainCount: Nat): ComplexityLevel {
        let lowerPrompt = Text.toLowercase(prompt);
        let promptLength = prompt.size();
        
        // Expert level indicators
        if (Utils.containsAny(lowerPrompt, [
            "optimization", "performance tuning", "reverse engineering",
            "custom algorithm", "distributed system", "microservices architecture"
        ]) or domainCount > 3) {
            #Expert
        }
        // Complex level indicators
        else if (Utils.containsAny(lowerPrompt, [
            "integration", "multi-step", "comprehensive", "enterprise",
            "scalability", "high availability"
        ]) or domainCount > 2 or promptLength > 500) {
            #Complex
        }
        // Moderate level indicators
        else if (Utils.containsAny(lowerPrompt, [
            "configure", "setup", "implement", "develop"
        ]) or domainCount > 1 or promptLength > 200) {
            #Moderate
        }
        // Simple level
        else {
            #Simple
        }
    };
    
    /// Estimate required processing steps
    private func estimateRequiredSteps(category: Types.PromptCategory, level: ComplexityLevel): Nat {
        let baseSteps = switch (category) {
            case (#Research(_)) { 3 };
            case (#CodeAnalysis(_)) { 4 };
            case (#SecurityAudit(_)) { 5 };
            case (#ReportGeneration(_)) { 3 };
            case (#BrowserAutomation(_)) { 4 };
            case (#GeneralConversation) { 1 };
            case (#SystemCommand) { 2 };
            case (#LearningFeedback) { 1 };
        };
        
        let multiplier = switch (level) {
            case (#Simple) { 1 };
            case (#Moderate) { 2 };
            case (#Complex) { 3 };
            case (#Expert) { 5 };
        };
        
        baseSteps * multiplier
    };
    
    /// Check if task can be parallelized
    private func isParallelizable(category: Types.PromptCategory, domains: [TechnicalDomain]): Bool {
        switch (category) {
            case (#Research(_)) { true }; // Multiple sources can be searched in parallel
            case (#CodeAnalysis(_)) { domains.size() <= 2 }; // Simple analysis can be parallel
            case (#SecurityAudit(_)) { false }; // Sequential analysis usually needed
            case (#ReportGeneration(_)) { true }; // Sections can be generated in parallel
            case (#BrowserAutomation(_)) { false }; // Usually sequential
            case (_) { false };
        }
    };
    
    // ================================
    // USER EXPERIENCE LEVEL DETECTION
    // ================================
    
    /// Detect user experience level from prompt and context
    private func detectUserExperienceLevel(
        prompt: Text,
        userContext: ?Types.UserContext
    ): Types.SkillLevel {
        
        // Check user context first
        switch (userContext) {
            case (?context) {
                switch (context.learningProfile) {
                    case (?profile) { return profile.skillLevel };
                    case null { /* Continue with prompt analysis */ };
                };
            };
            case null { /* Continue with prompt analysis */ };
        };
        
        let lowerPrompt = Text.toLowercase(prompt);
        
        // Expert indicators
        if (Utils.containsAny(lowerPrompt, [
            "optimize", "refactor", "architecture", "performance tuning",
            "best practices", "design patterns", "scalability"
        ])) {
            #Expert
        }
        // Advanced indicators
        else if (Utils.containsAny(lowerPrompt, [
            "implement", "integrate", "configure", "deploy",
            "automated", "custom solution"
        ])) {
            #Advanced
        }
        // Beginner indicators
        else if (Utils.containsAny(lowerPrompt, [
            "how to", "what is", "explain", "basic", "simple",
            "tutorial", "step by step", "beginner"
        ])) {
            #Beginner
        }
        // Intermediate indicators
        else if (Utils.containsAny(lowerPrompt, [
            "improve", "modify", "understand", "learn more"
        ])) {
            #Intermediate
        }
        // Default to adaptive
        else {
            #Adaptive
        }
    };
    
    // ================================
    // AGENT SUGGESTIONS
    // ================================
    
    /// Suggest optimal agents for the task
    private func suggestOptimalAgents(
        category: Types.PromptCategory,
        technicalComplexity: TechnicalComplexity,
        complexity: Float
    ): [Text] {
        
        var agents = Buffer.Buffer<Text>(3);
        
        // Primary agent based on category
        switch (category) {
            case (#Research(_)) { agents.add("research_agent") };
            case (#CodeAnalysis(_)) { agents.add("code_agent") };
            case (#SecurityAudit(_)) { agents.add("security_agent") };
            case (#ReportGeneration(_)) { agents.add("report_agent") };
            case (#BrowserAutomation(_)) { agents.add("browser_agent") };
            case (#GeneralConversation) { agents.add("conversation_agent") };
            case (#SystemCommand) { agents.add("system_agent") };
            case (#LearningFeedback) { agents.add("learning_agent") };
        };
        
        // Secondary agents based on technical domains
        for (domain in technicalComplexity.domains.vals()) {
            switch (domain) {
                case (#WebDevelopment) { agents.add("web_specialist") };
                case (#DataScience) { agents.add("data_specialist") };
                case (#Cybersecurity) { agents.add("security_specialist") };
                case (#DevOps) { agents.add("devops_specialist") };
                case (#MachineLearning) { agents.add("ml_specialist") };
                case (_) { /* No specific specialist needed */ };
            };
        };
        
        // Add generalist for complex tasks
        if (complexity > 0.8 or technicalComplexity.level == #Expert) {
            agents.add("expert_generalist");
        };
        
        Buffer.toArray(agents)
    };
    
    // ================================
    // PROCESSING TIME ESTIMATION
    // ================================
    
    /// Estimate processing time in milliseconds
    private func estimateProcessingTime(
        category: Types.PromptCategory,
        complexity: Float,
        technicalComplexity: TechnicalComplexity
    ): Nat {
        
        let baseTime = switch (category) {
            case (#Research(_)) { 15000 }; // 15 seconds
            case (#CodeAnalysis(_)) { 30000 }; // 30 seconds
            case (#SecurityAudit(_)) { 120000 }; // 2 minutes
            case (#ReportGeneration(_)) { 45000 }; // 45 seconds
            case (#BrowserAutomation(_)) { 60000 }; // 1 minute
            case (#GeneralConversation) { 2000 }; // 2 seconds
            case (#SystemCommand) { 5000 }; // 5 seconds
            case (#LearningFeedback) { 3000 }; // 3 seconds
        };
        
        let complexityMultiplier = 1.0 + complexity;
        
        let levelMultiplier = switch (technicalComplexity.level) {
            case (#Simple) { 1.0 };
            case (#Moderate) { 1.5 };
            case (#Complex) { 2.5 };
            case (#Expert) { 4.0 };
        };
        
        let stepMultiplier = Float.fromInt(technicalComplexity.estimatedSteps) * 0.2 + 1.0;
        
        Float.toInt(Float.fromInt(baseTime) * complexityMultiplier * levelMultiplier * stepMultiplier)
    };
    
    // ================================
    // EXTERNAL DATA DETECTION
    // ================================
    
    /// Check if prompt requires external data access
    private func checkExternalDataNeeds(prompt: Text, category: Types.PromptCategory): Bool {
        let lowerPrompt = Text.toLowercase(prompt);
        
        // Always requires external data
        switch (category) {
            case (#Research(_)) { true };
            case (#BrowserAutomation(_)) { true };
            case (_) {
                // Check for external data indicators
                Utils.containsAny(lowerPrompt, [
                    "current", "latest", "real-time", "live", "fetch",
                    "download", "api", "website", "url", "online"
                ])
            };
        }
    };
    
    // ================================
    // CONFIDENCE CALCULATION
    // ================================
    
    /// Calculate analysis confidence score
    private func calculateAnalysisConfidence(
        category: Types.PromptCategory,
        keywords: [Text],
        context: ContextAnalysis
    ): Float {
        
        var confidence = 0.5; // Base confidence
        
        // Category-specific confidence
        let categoryConfidence = getCategoryConfidence(category);
        confidence := confidence + (categoryConfidence * 0.3);
        
        // Keyword match confidence
        let keywordConfidence = Float.min(1.0, Float.fromInt(keywords.size()) / 10.0);
        confidence := confidence + (keywordConfidence * 0.2);
        
        // Context clarity confidence
        let contextConfidence = getContextConfidence(context);
        confidence := confidence + (contextConfidence * 0.2);
        
        // Pattern match confidence
        let patternConfidence = getPatternMatchConfidence(keywords);
        confidence := confidence + (patternConfidence * 0.3);
        
        Float.max(0.1, Float.min(1.0, confidence))
    };
    
    /// Get confidence based on category clarity
    private func getCategoryConfidence(category: Types.PromptCategory): Float {
        switch (category) {
            case (#GeneralConversation) { 0.3 }; // Ambiguous
            case (#SystemCommand) { 0.9 }; // Usually clear
            case (#SecurityAudit(_)) { 0.8 }; // Well-defined
            case (#CodeAnalysis(_)) { 0.8 };
            case (#Research(_)) { 0.7 };
            case (#ReportGeneration(_)) { 0.7 };
            case (#BrowserAutomation(_)) { 0.6 };
            case (#LearningFeedback) { 0.5 };
        }
    };
    
    /// Get confidence from context analysis
    private func getContextConfidence(context: ContextAnalysis): Float {
        var score = 0.5;
        
        if (context.hasCodeReferences) score += 0.2;
        if (context.hasURLReferences) score += 0.15;
        if (context.hasFileReferences) score += 0.15;
        if (not context.followUpLikely) score += 0.1; // Single task is clearer
        
        Float.min(1.0, score)
    };
    
    /// Get confidence from pattern matching
    private func getPatternMatchConfidence(keywords: [Text]): Float {
        var maxConfidence = 0.0;
        
        for ((_, pattern) in learnedPatterns.entries()) {
            let matches = countPatternMatches(keywords, pattern.pattern);
            if (matches > 0) {
                let confidence = pattern.confidence * (Float.fromInt(matches) / Float.fromInt(keywords.size()));
                maxConfidence := Float.max(maxConfidence, confidence);
            };
        };
        
        maxConfidence
    };
    
    // ================================
    // UTILITY FUNCTIONS
    // ================================
    
    /// Generate cache key for analysis results
    private func generateCacheKey(prompt: Text, userContext: ?Types.UserContext): Text {
        let promptHash = debug_show(Text.hash(prompt));
        let contextHash = switch (userContext) {
            case (?ctx) { debug_show(Text.hash(ctx.sessionId)) };
            case null { "no_context" };
        };
        promptHash # "_" # contextHash
    };
    
    /// Check if text matches a pattern
    private func matchesPattern(text: Text, pattern: Text): Bool {
        let patternKeywords = Text.split(pattern, #char '|');
        for (keyword in patternKeywords) {
            if (Text.contains(Text.toLowercase(text), #text keyword)) {
                return true;
            };
        };
        false
    };
    
    /// Count pattern matches in keywords
    private func countPatternMatches(keywords: [Text], pattern: Text): Nat {
        let patternKeywords = Text.split(pattern, #char '|');
        var matches = 0;
        
        for (keyword in keywords.vals()) {
            for (patternKeyword in patternKeywords) {
                if (Text.contains(keyword, #text patternKeyword)) {
                    matches += 1;
                };
            };
        };
        
        matches
    };
    
    /// Update pattern usage statistics
    private func updatePatternUsage(patternId: Text) {
        switch (learnedPatterns.get(patternId)) {
            case (?pattern) {
                let updatedPattern = {
                    id = pattern.id;
                    pattern = pattern.pattern;
                    frequency = pattern.frequency + 1;
                    successRate = pattern.successRate;
                    lastSeen = Time.now();
                    category = pattern.category;
                    confidence = pattern.confidence;
                };
                learnedPatterns.put(patternId, updatedPattern);
            };
            case null { /* Pattern not found */ };
        };
    };
    
    /// Update learning patterns with new successful analysis
    private func updateLearningPatterns(prompt: Text, result: AnalysisResult) {
        if (result.confidence > CONFIDENCE_THRESHOLDS.high) {
            let keywords = Array.foldLeft<Text, Text>(result.keywords, "", func(acc, keyword) {
                if (acc == "") keyword else acc # "|" # keyword
            });
            
            if (keywords.size() > 0) {
                let patternId = "learned_" # debug_show(Text.hash(keywords));
                learnedPatterns.put(patternId, {
                    id = patternId;
                    pattern = keywords;
                    frequency = 1;
                    successRate = 1.0;
                    lastSeen = Time.now();
                    category = result.category;
                    confidence = result.confidence;
                });
            };
        };
    };
    
    /// Get analysis statistics
    public func getAnalysisStats(): {
        totalPatterns: Nat;
        cacheHitRate: Float;
        avgConfidence: Float;
        analysisCount: Nat;
    } {
        {
            totalPatterns = learnedPatterns.size();
            cacheHitRate = 0.0; // Would track this in production
            avgConfidence = 0.75; // Would calculate from recent analyses
            analysisCount = analysisCache.size();
        }
    };
}
