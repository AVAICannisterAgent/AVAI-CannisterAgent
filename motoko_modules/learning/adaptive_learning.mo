/**
 * AVAI Adaptive Learning System - Advanced self-learning and adaptation engine
 * Implements continuous improvement through user feedback and performance analysis
 */

import Types "../core/types";
import Utils "../core/utils";

import Time "mo:base/Time";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Debug "mo:base/Debug";
import Text "mo:base/Text";

module AdaptiveLearning {
    
    // ================================
    // LEARNING SYSTEM CONFIGURATION
    // ================================
    
    /// Learning algorithm parameters
    private let LEARNING_CONFIG = {
        baselearningRate = 0.01;
        momentumFactor = 0.9;
        decayRate = 0.95;
        minLearningRate = 0.001;
        maxLearningRate = 0.1;
        adaptationThreshold = 0.1;
        feedbackWeight = 0.3;
        performanceWeight = 0.4;
        usageWeight = 0.3;
    };
    
    /// Memory retention parameters
    private let MEMORY_CONFIG = {
        shortTermSize = 100;
        mediumTermSize = 500;
        longTermSize = 1000;
        consolidationThreshold = 10;
        forgettingThreshold = 0.1;
        reinforcementCycles = 5;
    };
    
    // ================================
    // LEARNING STATE TYPES
    // ================================
    
    /// Learning model state
    public type LearningState = {
        version: Nat;
        lastUpdated: Int;
        totalExperiences: Nat;
        accuracy: Float;
        confidence: Float;
        adaptationRate: Float;
    };
    
    /// Experience record for learning
    public type Experience = {
        id: Text;
        prompt: Text;
        category: Types.PromptCategory;
        response: Text;
        agentUsed: Text;
        success: Bool;
        userFeedback: ?Types.FeedbackType;
        processingTime: Nat;
        complexity: Float;
        timestamp: Int;
        context: ?Types.UserContext;
    };
    
    /// Learning memory layers
    public type MemoryLayer = {
        #ShortTerm: [Experience];
        #MediumTerm: [ConsolidatedExperience];
        #LongTerm: [Pattern];
    };
    
    /// Consolidated experience with pattern recognition
    public type ConsolidatedExperience = {
        pattern: Text;
        category: Types.PromptCategory;
        successRate: Float;
        averageTime: Nat;
        confidenceLevel: Float;
        occurrences: Nat;
        lastReinforcement: Int;
        associatedAgents: [Text];
    };
    
    /// Learned behavioral patterns
    public type Pattern = {
        id: Text;
        signature: Text;
        category: Types.PromptCategory;
        triggers: [Text];
        effectiveness: Float;
        adaptability: Float;
        stability: Float;
        usage: Nat;
        evolution: [PatternEvolution];
    };
    
    /// Pattern evolution tracking
    public type PatternEvolution = {
        timestamp: Int;
        effectiveness: Float;
        context: Text;
        adaptation: Text;
    };
    
    /// User preference learning
    public type UserPreferences = {
        responseStyle: ResponseStyle;
        complexityPreference: ComplexityPreference;
        speedVsAccuracy: Float; // 0.0 = speed, 1.0 = accuracy
        feedbackPatterns: [(Text, Types.FeedbackType)];
        commonWorkflows: [WorkflowPattern];
        avoidancePatterns: [Text];
    };
    
    /// Response style preferences
    public type ResponseStyle = {
        #Detailed;
        #Concise;
        #Technical;
        #Beginner;
        #Interactive;
        #Documentation;
    };
    
    /// Complexity handling preferences
    public type ComplexityPreference = {
        #SimpleFirst;
        #DirectToComplex;
        #StepByStep;
        #Comprehensive;
        #Adaptive;
    };
    
    /// Workflow pattern recognition
    public type WorkflowPattern = {
        sequence: [Types.PromptCategory];
        frequency: Nat;
        success: Float;
        timeSpacing: [Nat];
        contextSimilarity: Float;
    };
    
    // ================================
    // STATE MANAGEMENT
    // ================================
    
    /// Current learning state
    private stable var learningState: LearningState = {
        version = 1;
        lastUpdated = 0;
        totalExperiences = 0;
        accuracy = 0.5;
        confidence = 0.5;
        adaptationRate = LEARNING_CONFIG.baselearningRate;
    };
    
    /// Short-term memory (recent experiences)
    private var shortTermMemory = Buffer.Buffer<Experience>(MEMORY_CONFIG.shortTermSize);
    
    /// Medium-term memory (consolidated patterns)
    private var mediumTermMemory = HashMap.HashMap<Text, ConsolidatedExperience>(
        MEMORY_CONFIG.mediumTermSize, Text.equal, Text.hash
    );
    
    /// Long-term memory (stable patterns)
    private var longTermMemory = HashMap.HashMap<Text, Pattern>(
        MEMORY_CONFIG.longTermSize, Text.equal, Text.hash
    );
    
    /// User preference tracking
    private var userPreferences = HashMap.HashMap<Text, UserPreferences>(50, Text.equal, Text.hash);
    
    /// Performance tracking
    private var performanceMetrics = HashMap.HashMap<Text, PerformanceMetric>(50, Text.equal, Text.hash);
    
    /// Performance metric type
    public type PerformanceMetric = {
        category: Types.PromptCategory;
        successRate: Float;
        averageTime: Nat;
        improvementRate: Float;
        lastUpdate: Int;
        sampleSize: Nat;
    };
    
    // ================================
    // INITIALIZATION
    // ================================
    
    /// Initialize the adaptive learning system
    public func initialize(): async () {
        Utils.debugLog("🧠 Initializing Adaptive Learning System...");
        
        // Load pre-existing learning state if available
        if (learningState.lastUpdated == 0) {
            learningState := {
                version = 1;
                lastUpdated = Time.now();
                totalExperiences = 0;
                accuracy = 0.5;
                confidence = 0.5;
                adaptationRate = LEARNING_CONFIG.baselearningRate;
            };
        };
        
        // Initialize memory systems
        await initializeMemorySystems();
        
        // Load baseline patterns
        await loadBaselinePatterns();
        
        Utils.debugLog("✅ Adaptive Learning System initialized");
    };
    
    /// Initialize memory systems with baseline data
    private func initializeMemorySystems(): async () {
        // Clear existing memory buffers
        shortTermMemory := Buffer.Buffer<Experience>(MEMORY_CONFIG.shortTermSize);
        
        // Initialize baseline performance metrics
        let baselineCategories = [
            #Research(#WebResearch),
            #CodeAnalysis(#CodeReview),
            #SecurityAudit(#VulnerabilityScanning),
            #ReportGeneration(#AnalysisReport)
        ];
        
        for (category in baselineCategories.vals()) {
            performanceMetrics.put(debug_show(category), {
                category = category;
                successRate = 0.7; // Start with moderate expectations
                averageTime = 30000; // 30 seconds baseline
                improvementRate = 0.0;
                lastUpdate = Time.now();
                sampleSize = 0;
            });
        };
    };
    
    /// Load baseline learning patterns
    private func loadBaselinePatterns(): async () {
        // Research patterns
        longTermMemory.put("research_web", {
            id = "research_web";
            signature = "search|find|research|investigate|web";
            category = #Research(#WebResearch);
            triggers = ["search", "find", "research", "investigate"];
            effectiveness = 0.8;
            adaptability = 0.9;
            stability = 0.7;
            usage = 100;
            evolution = [];
        });
        
        // Code analysis patterns
        longTermMemory.put("code_analysis", {
            id = "code_analysis";
            signature = "code|analyze|review|scan|quality";
            category = #CodeAnalysis(#CodeReview);
            triggers = ["code", "analyze", "review", "scan"];
            effectiveness = 0.85;
            adaptability = 0.8;
            stability = 0.8;
            usage = 150;
            evolution = [];
        });
        
        // Security audit patterns
        longTermMemory.put("security_audit", {
            id = "security_audit";
            signature = "security|vulnerability|audit|scan|penetration";
            category = #SecurityAudit(#VulnerabilityScanning);
            triggers = ["security", "vulnerability", "audit"];
            effectiveness = 0.9;
            adaptability = 0.7;
            stability = 0.9;
            usage = 75;
            evolution = [];
        });
    };
    
    // ================================
    // EXPERIENCE RECORDING
    // ================================
    
    /// Record a new experience for learning
    public func recordExperience(
        prompt: Text,
        category: Types.PromptCategory,
        response: Text,
        agentUsed: Text,
        success: Bool,
        processingTime: Nat,
        complexity: Float,
        userContext: ?Types.UserContext
    ): async Text {
        
        let experienceId = "exp_" # Int.toText(Time.now()) # "_" # Nat.toText(learningState.totalExperiences);
        
        let experience: Experience = {
            id = experienceId;
            prompt = prompt;
            category = category;
            response = response;
            agentUsed = agentUsed;
            success = success;
            userFeedback = null; // Will be added later if provided
            processingTime = processingTime;
            complexity = complexity;
            timestamp = Time.now();
            context = userContext;
        };
        
        // Add to short-term memory
        addToShortTermMemory(experience);
        
        // Update performance metrics
        updatePerformanceMetrics(category, success, processingTime);
        
        // Update user preferences if context available
        switch (userContext) {
            case (?context) {
                await updateUserPreferences(context, category, success, complexity);
            };
            case null { /* No user context to learn from */ };
        };
        
        // Update learning state
        learningState := {
            version = learningState.version;
            lastUpdated = Time.now();
            totalExperiences = learningState.totalExperiences + 1;
            accuracy = calculateCurrentAccuracy();
            confidence = calculateCurrentConfidence();
            adaptationRate = adaptLearningRate(success);
        };
        
        // Trigger memory consolidation if needed
        if (shortTermMemory.size() >= MEMORY_CONFIG.consolidationThreshold) {
            await consolidateMemory();
        };
        
        Utils.debugLog("🧠 Experience recorded: " # experienceId);
        experienceId
    };
    
    /// Add user feedback to existing experience
    public func addUserFeedback(
        experienceId: Text,
        feedback: Types.FeedbackType
    ): async Bool {
        
        // Find and update experience in short-term memory
        var found = false;
        let buffer = Buffer.Buffer<Experience>(shortTermMemory.size());
        
        for (i in shortTermMemory.keys()) {
            let exp = shortTermMemory.get(i);
            if (exp.id == experienceId) {
                let updatedExp = {
                    id = exp.id;
                    prompt = exp.prompt;
                    category = exp.category;
                    response = exp.response;
                    agentUsed = exp.agentUsed;
                    success = exp.success;
                    userFeedback = ?feedback;
                    processingTime = exp.processingTime;
                    complexity = exp.complexity;
                    timestamp = exp.timestamp;
                    context = exp.context;
                };
                buffer.add(updatedExp);
                found := true;
            } else {
                buffer.add(exp);
            };
        };
        
        if (found) {
            shortTermMemory := buffer;
            
            // Apply immediate learning from feedback
            await applyFeedbackLearning(feedback);
            
            Utils.debugLog("🔄 User feedback applied: " # debug_show(feedback));
        };
        
        found
    };
    
    // ================================
    // MEMORY MANAGEMENT
    // ================================
    
    /// Add experience to short-term memory with capacity management
    private func addToShortTermMemory(experience: Experience) {
        if (shortTermMemory.size() >= MEMORY_CONFIG.shortTermSize) {
            // Remove oldest experience
            let _ = shortTermMemory.removeLast();
        };
        
        shortTermMemory.insert(0, experience);
    };
    
    /// Consolidate short-term memory into medium and long-term patterns
    private func consolidateMemory(): async () {
        Utils.debugLog("🧠 Consolidating memory...");
        
        let experiences = Buffer.toArray(shortTermMemory);
        
        // Group experiences by category and pattern
        var categoryGroups = HashMap.HashMap<Text, Buffer.Buffer<Experience>>(10, Text.equal, Text.hash);
        
        for (exp in experiences.vals()) {
            let categoryKey = debug_show(exp.category);
            switch (categoryGroups.get(categoryKey)) {
                case (?group) {
                    group.add(exp);
                };
                case null {
                    let newGroup = Buffer.Buffer<Experience>(10);
                    newGroup.add(exp);
                    categoryGroups.put(categoryKey, newGroup);
                };
            };
        };
        
        // Create consolidated experiences
        for ((categoryKey, group) in categoryGroups.entries()) {
            let groupArray = Buffer.toArray(group);
            if (groupArray.size() >= 3) { // Minimum for consolidation
                await createConsolidatedExperience(groupArray);
            };
        };
        
        // Promote stable patterns to long-term memory
        await promoteToLongTermMemory();
        
        // Clear processed experiences from short-term memory
        shortTermMemory := Buffer.Buffer<Experience>(MEMORY_CONFIG.shortTermSize);
        
        Utils.debugLog("✅ Memory consolidation complete");
    };
    
    /// Create consolidated experience from multiple similar experiences
    private func createConsolidatedExperience(experiences: [Experience]): async () {
        if (experiences.size() == 0) return;
        
        let firstExp = experiences[0];
        let categoryKey = debug_show(firstExp.category);
        
        // Calculate aggregated metrics
        var successCount = 0;
        var totalTime = 0;
        var agentUsage = HashMap.HashMap<Text, Nat>(5, Text.equal, Text.hash);
        
        for (exp in experiences.vals()) {
            if (exp.success) successCount += 1;
            totalTime += exp.processingTime;
            
            let currentCount = switch (agentUsage.get(exp.agentUsed)) {
                case (?count) { count };
                case null { 0 };
            };
            agentUsage.put(exp.agentUsed, currentCount + 1);
        };
        
        let successRate = Float.fromInt(successCount) / Float.fromInt(experiences.size());
        let averageTime = totalTime / experiences.size();
        
        // Extract common pattern
        let commonWords = extractCommonPattern(experiences);
        
        let consolidated: ConsolidatedExperience = {
            pattern = commonWords;
            category = firstExp.category;
            successRate = successRate;
            averageTime = averageTime;
            confidenceLevel = calculateConsolidationConfidence(experiences);
            occurrences = experiences.size();
            lastReinforcement = Time.now();
            associatedAgents = agentUsage.keys() |> Iter.toArray(_);
        };
        
        mediumTermMemory.put(categoryKey # "_" # commonWords, consolidated);
    };
    
    /// Extract common pattern from experiences
    private func extractCommonPattern(experiences: [Experience]): Text {
        var wordCounts = HashMap.HashMap<Text, Nat>(50, Text.equal, Text.hash);
        
        for (exp in experiences.vals()) {
            let keywords = Utils.extractKeywords(exp.prompt);
            for (keyword in keywords.vals()) {
                let count = switch (wordCounts.get(keyword)) {
                    case (?c) { c };
                    case null { 0 };
                };
                wordCounts.put(keyword, count + 1);
            };
        };
        
        // Find most common words
        var commonWords = Buffer.Buffer<Text>(5);
        let threshold = experiences.size() / 2; // Word must appear in at least half
        
        for ((word, count) in wordCounts.entries()) {
            if (count >= threshold) {
                commonWords.add(word);
            };
        };
        
        let wordsArray = Buffer.toArray(commonWords);
        Array.foldLeft<Text, Text>(wordsArray, "", func(acc, word) {
            if (acc == "") word else acc # "|" # word
        })
    };
    
    /// Calculate consolidation confidence
    private func calculateConsolidationConfidence(experiences: [Experience]): Float {
        var totalConfidence = 0.0;
        var feedbackCount = 0;
        
        for (exp in experiences.vals()) {
            // Base confidence from success
            totalConfidence += if (exp.success) 0.8 else 0.2;
            
            // Additional confidence from user feedback
            switch (exp.userFeedback) {
                case (?feedback) {
                    feedbackCount += 1;
                    switch (feedback) {
                        case (#Positive(score)) { totalConfidence += score };
                        case (#Negative(score)) { totalConfidence -= score };
                        case (#Neutral) { totalConfidence += 0.5 };
                        case (#Correction(_)) { totalConfidence += 0.3 }; // Correction is learning
                    };
                };
                case null { /* No additional feedback */ };
            };
        };
        
        let baseConfidence = totalConfidence / Float.fromInt(experiences.size());
        let feedbackBonus = Float.fromInt(feedbackCount) / Float.fromInt(experiences.size()) * 0.2;
        
        Float.min(1.0, baseConfidence + feedbackBonus)
    };
    
    /// Promote stable patterns to long-term memory
    private func promoteToLongTermMemory(): async () {
        for ((key, consolidated) in mediumTermMemory.entries()) {
            if (consolidated.confidenceLevel > 0.8 and consolidated.occurrences > MEMORY_CONFIG.reinforcementCycles) {
                
                let pattern: Pattern = {
                    id = key;
                    signature = consolidated.pattern;
                    category = consolidated.category;
                    triggers = Text.split(consolidated.pattern, #char '|') |> Iter.toArray(_);
                    effectiveness = consolidated.successRate;
                    adaptability = calculateAdaptability(consolidated);
                    stability = consolidated.confidenceLevel;
                    usage = consolidated.occurrences;
                    evolution = [{
                        timestamp = Time.now();
                        effectiveness = consolidated.successRate;
                        context = "promotion_from_medium_term";
                        adaptation = "stable_pattern_identified";
                    }];
                };
                
                longTermMemory.put(key, pattern);
                Utils.debugLog("⬆️ Pattern promoted to long-term memory: " # key);
            };
        };
    };
    
    /// Calculate pattern adaptability
    private func calculateAdaptability(consolidated: ConsolidatedExperience): Float {
        // Higher adaptability for patterns that work across different agents
        let agentDiversity = Float.fromInt(consolidated.associatedAgents.size()) / 5.0; // Normalize to max 5 agents
        
        // Higher adaptability for recent patterns
        let recency = Float.fromInt(Time.now() - consolidated.lastReinforcement) / 86400000000000.0; // Days
        let recencyScore = Float.max(0.1, 1.0 - recency / 30.0); // Decay over 30 days
        
        // Combine factors
        Float.min(1.0, (agentDiversity * 0.6) + (recencyScore * 0.4))
    };
    
    // ================================
    // LEARNING APPLICATION
    // ================================
    
    /// Apply learning to improve future responses
    public func applyLearning(
        prompt: Text,
        category: Types.PromptCategory
    ): async {
        suggestedAgent: ?Text;
        confidenceBoost: Float;
        estimatedTime: ?Nat;
        recommendations: [Text];
    } {
        
        let keywords = Utils.extractKeywords(prompt);
        
        // Check long-term patterns first
        var bestMatch: ?Pattern = null;
        var bestScore = 0.0;
        
        for ((_, pattern) in longTermMemory.entries()) {
            let score = calculatePatternMatch(keywords, pattern);
            if (score > bestScore and score > 0.6) {
                bestScore := score;
                bestMatch := ?pattern;
            };
        };
        
        // Check medium-term consolidated experiences
        var suggestedAgent: ?Text = null;
        var confidenceBoost = 0.0;
        var estimatedTime: ?Nat = null;
        var recommendations = Buffer.Buffer<Text>(3);
        
        switch (bestMatch) {
            case (?pattern) {
                // High-confidence pattern match
                confidenceBoost := pattern.effectiveness * 0.3;
                estimatedTime := ?calculateEstimatedTime(pattern);
                
                recommendations.add("Pattern match found: " # pattern.id);
                recommendations.add("Expected success rate: " # Float.toText(pattern.effectiveness));
                
                // Suggest best performing agent for this pattern
                suggestedAgent := findBestAgentForPattern(pattern);
            };
            case null {
                // Check medium-term memory
                let categoryKey = debug_show(category);
                for ((key, consolidated) in mediumTermMemory.entries()) {
                    if (Text.startsWith(key, #text categoryKey) and consolidated.confidenceLevel > 0.7) {
                        confidenceBoost := consolidated.successRate * 0.2;
                        estimatedTime := ?consolidated.averageTime;
                        
                        if (consolidated.associatedAgents.size() > 0) {
                            suggestedAgent := ?consolidated.associatedAgents[0];
                        };
                        
                        recommendations.add("Similar pattern found in recent history");
                        break;
                    };
                };
            };
        };
        
        // Add general learning recommendations
        switch (performanceMetrics.get(debug_show(category))) {
            case (?metrics) {
                if (metrics.improvementRate > 0.1) {
                    recommendations.add("This category shows improving performance");
                };
                if (metrics.successRate > 0.9) {
                    recommendations.add("High success rate for this type of task");
                };
            };
            case null { /* No metrics available */ };
        };
        
        {
            suggestedAgent = suggestedAgent;
            confidenceBoost = confidenceBoost;
            estimatedTime = estimatedTime;
            recommendations = Buffer.toArray(recommendations);
        }
    };
    
    /// Apply immediate learning from user feedback
    private func applyFeedbackLearning(feedback: Types.FeedbackType): async () {
        switch (feedback) {
            case (#Positive(score)) {
                // Reinforce recent successful patterns
                await reinforceRecentPatterns(score);
            };
            case (#Negative(severity)) {
                // Adjust learning to avoid similar failures
                await adjustForNegativeFeedback(severity);
            };
            case (#Correction(correctedResponse)) {
                // Learn from correction
                await learnFromCorrection(correctedResponse);
            };
            case (#Neutral) {
                // Neutral feedback - no immediate adjustment
            };
        };
        
        // Update adaptation rate
        learningState := {
            version = learningState.version;
            lastUpdated = Time.now();
            totalExperiences = learningState.totalExperiences;
            accuracy = learningState.accuracy;
            confidence = learningState.confidence;
            adaptationRate = adaptLearningRate(feedback != #Negative(1.0));
        };
    };
    
    // ================================
    // USER PREFERENCE LEARNING
    // ================================
    
    /// Update user preferences based on interactions
    private func updateUserPreferences(
        context: Types.UserContext,
        category: Types.PromptCategory,
        success: Bool,
        complexity: Float
    ): async () {
        
        let userId = switch (context.userId) {
            case (?id) { id };
            case null { context.sessionId }; // Fall back to session ID
        };
        
        let currentPrefs = switch (userPreferences.get(userId)) {
            case (?prefs) { prefs };
            case null {
                {
                    responseStyle = #Adaptive;
                    complexityPreference = #Adaptive;
                    speedVsAccuracy = 0.7; // Default preference
                    feedbackPatterns = [];
                    commonWorkflows = [];
                    avoidancePatterns = [];
                }
            };
        };
        
        // Update complexity preference based on success
        let newComplexityPref = if (success and complexity > 0.7) {
            #DirectToComplex // User handles complex tasks well
        } else if (not success and complexity > 0.5) {
            #StepByStep // User needs more guidance for complex tasks
        } else {
            currentPrefs.complexityPreference
        };
        
        // Update workflow patterns
        let updatedWorkflows = updateWorkflowPatterns(currentPrefs.commonWorkflows, category);
        
        let updatedPrefs = {
            responseStyle = currentPrefs.responseStyle;
            complexityPreference = newComplexityPref;
            speedVsAccuracy = currentPrefs.speedVsAccuracy;
            feedbackPatterns = currentPrefs.feedbackPatterns;
            commonWorkflows = updatedWorkflows;
            avoidancePatterns = currentPrefs.avoidancePatterns;
        };
        
        userPreferences.put(userId, updatedPrefs);
    };
    
    /// Update workflow patterns for user
    private func updateWorkflowPatterns(
        currentWorkflows: [WorkflowPattern],
        newCategory: Types.PromptCategory
    ): [WorkflowPattern] {
        // This would implement workflow pattern learning
        // For now, return existing workflows
        currentWorkflows
    };
    
    // ================================
    // UTILITY FUNCTIONS
    // ================================
    
    /// Calculate pattern match score
    private func calculatePatternMatch(keywords: [Text], pattern: Pattern): Float {
        var matches = 0;
        
        for (keyword in keywords.vals()) {
            for (trigger in pattern.triggers.vals()) {
                if (Text.contains(keyword, #text trigger) or Text.contains(trigger, #text keyword)) {
                    matches += 1;
                };
            };
        };
        
        if (keywords.size() == 0) return 0.0;
        
        Float.fromInt(matches) / Float.fromInt(keywords.size())
    };
    
    /// Calculate estimated time from pattern
    private func calculateEstimatedTime(pattern: Pattern): Nat {
        // Base time calculation from pattern usage and effectiveness
        let baseTime = 30000; // 30 seconds baseline
        let efficiencyFactor = pattern.effectiveness;
        let usageFactor = Float.min(2.0, Float.fromInt(pattern.usage) / 100.0);
        
        Float.toInt(Float.fromInt(baseTime) / (efficiencyFactor * usageFactor))
    };
    
    /// Find best agent for pattern
    private func findBestAgentForPattern(pattern: Pattern): ?Text {
        // This would analyze which agents perform best for this pattern
        // For now, return pattern-based suggestion
        switch (pattern.category) {
            case (#Research(_)) { ?"research_agent" };
            case (#CodeAnalysis(_)) { ?"code_agent" };
            case (#SecurityAudit(_)) { ?"security_agent" };
            case (#ReportGeneration(_)) { ?"report_agent" };
            case (#BrowserAutomation(_)) { ?"browser_agent" };
            case (_) { null };
        }
    };
    
    /// Update performance metrics
    private func updatePerformanceMetrics(
        category: Types.PromptCategory,
        success: Bool,
        processingTime: Nat
    ) {
        let categoryKey = debug_show(category);
        let currentMetric = switch (performanceMetrics.get(categoryKey)) {
            case (?metric) { metric };
            case null {
                {
                    category = category;
                    successRate = 0.5;
                    averageTime = 30000;
                    improvementRate = 0.0;
                    lastUpdate = Time.now();
                    sampleSize = 0;
                }
            };
        };
        
        let newSampleSize = currentMetric.sampleSize + 1;
        let newSuccessRate = if (success) {
            (currentMetric.successRate * Float.fromInt(currentMetric.sampleSize) + 1.0) / Float.fromInt(newSampleSize)
        } else {
            (currentMetric.successRate * Float.fromInt(currentMetric.sampleSize)) / Float.fromInt(newSampleSize)
        };
        
        let newAverageTime = (currentMetric.averageTime * currentMetric.sampleSize + processingTime) / newSampleSize;
        
        let improvementRate = (newSuccessRate - currentMetric.successRate) / 
            (Float.fromInt(Time.now() - currentMetric.lastUpdate) / 86400000000000.0 + 1.0); // Per day
        
        let updatedMetric = {
            category = category;
            successRate = newSuccessRate;
            averageTime = newAverageTime;
            improvementRate = improvementRate;
            lastUpdate = Time.now();
            sampleSize = newSampleSize;
        };
        
        performanceMetrics.put(categoryKey, updatedMetric);
    };
    
    /// Calculate current accuracy
    private func calculateCurrentAccuracy(): Float {
        var totalAccuracy = 0.0;
        var count = 0;
        
        for ((_, metric) in performanceMetrics.entries()) {
            totalAccuracy += metric.successRate;
            count += 1;
        };
        
        if (count > 0) {
            totalAccuracy / Float.fromInt(count)
        } else {
            learningState.accuracy
        }
    };
    
    /// Calculate current confidence
    private func calculateCurrentConfidence(): Float {
        let experienceCount = Float.fromInt(learningState.totalExperiences);
        let experienceFactor = Float.min(1.0, experienceCount / 1000.0); // Confidence grows with experience
        
        let accuracyFactor = learningState.accuracy;
        
        (experienceFactor * 0.4) + (accuracyFactor * 0.6)
    };
    
    /// Adapt learning rate based on recent performance
    private func adaptLearningRate(success: Bool): Float {
        let currentRate = learningState.adaptationRate;
        
        if (success) {
            // Increase learning rate slightly for successful experiences
            Float.min(LEARNING_CONFIG.maxLearningRate, currentRate * 1.05)
        } else {
            // Decrease learning rate for failures to be more conservative
            Float.max(LEARNING_CONFIG.minLearningRate, currentRate * 0.95)
        }
    };
    
    /// Reinforce recent successful patterns
    private func reinforceRecentPatterns(score: Float): async () {
        // Increase effectiveness of recently used successful patterns
        for ((key, pattern) in longTermMemory.entries()) {
            let timeDiff = Time.now() - (switch (pattern.evolution.get(pattern.evolution.size() - 1)) {
                case (?lastEvolution) { lastEvolution.timestamp };
                case null { 0 };
            });
            
            if (timeDiff < 3600000000000) { // Within last hour
                let updatedPattern = {
                    id = pattern.id;
                    signature = pattern.signature;
                    category = pattern.category;
                    triggers = pattern.triggers;
                    effectiveness = Float.min(1.0, pattern.effectiveness + (score * 0.1));
                    adaptability = pattern.adaptability;
                    stability = pattern.stability;
                    usage = pattern.usage + 1;
                    evolution = Array.append(pattern.evolution, [{
                        timestamp = Time.now();
                        effectiveness = pattern.effectiveness + (score * 0.1);
                        context = "positive_feedback_reinforcement";
                        adaptation = "effectiveness_increased";
                    }]);
                };
                
                longTermMemory.put(key, updatedPattern);
            };
        };
    };
    
    /// Adjust for negative feedback
    private func adjustForNegativeFeedback(severity: Float): async () {
        // Decrease effectiveness of recently used patterns
        for ((key, pattern) in longTermMemory.entries()) {
            let timeDiff = Time.now() - (switch (pattern.evolution.get(pattern.evolution.size() - 1)) {
                case (?lastEvolution) { lastEvolution.timestamp };
                case null { 0 };
            });
            
            if (timeDiff < 3600000000000) { // Within last hour
                let updatedPattern = {
                    id = pattern.id;
                    signature = pattern.signature;
                    category = pattern.category;
                    triggers = pattern.triggers;
                    effectiveness = Float.max(0.1, pattern.effectiveness - (severity * 0.1));
                    adaptability = pattern.adaptability;
                    stability = pattern.stability;
                    usage = pattern.usage;
                    evolution = Array.append(pattern.evolution, [{
                        timestamp = Time.now();
                        effectiveness = pattern.effectiveness - (severity * 0.1);
                        context = "negative_feedback_adjustment";
                        adaptation = "effectiveness_decreased";
                    }]);
                };
                
                longTermMemory.put(key, updatedPattern);
            };
        };
    };
    
    /// Learn from correction
    private func learnFromCorrection(correctedResponse: Text): async () {
        // Analyze correction to learn better response patterns
        let correctionKeywords = Utils.extractKeywords(correctedResponse);
        
        // This would implement learning from corrections
        // For now, just log the correction for analysis
        Utils.debugLog("🔄 Learning from correction: " # Utils.sanitizeForLogging(correctedResponse));
    };
    
    // ================================
    // PUBLIC API
    // ================================
    
    /// Get current learning statistics
    public query func getLearningStats(): async {
        learningState: LearningState;
        memoryStats: {
            shortTermSize: Nat;
            mediumTermSize: Nat;
            longTermSize: Nat;
        };
        performanceStats: {
            categoriesTracked: Nat;
            averageSuccessRate: Float;
            averageResponseTime: Nat;
        };
    } {
        let avgSuccess = calculateCurrentAccuracy();
        
        var totalTime = 0;
        var timeCount = 0;
        for ((_, metric) in performanceMetrics.entries()) {
            totalTime += metric.averageTime;
            timeCount += 1;
        };
        let avgTime = if (timeCount > 0) { totalTime / timeCount } else { 0 };
        
        {
            learningState = learningState;
            memoryStats = {
                shortTermSize = shortTermMemory.size();
                mediumTermSize = mediumTermMemory.size();
                longTermSize = longTermMemory.size();
            };
            performanceStats = {
                categoriesTracked = performanceMetrics.size();
                averageSuccessRate = avgSuccess;
                averageResponseTime = avgTime;
            };
        }
    };
    
    /// Get user preferences
    public query func getUserPreferences(userId: Text): async ?UserPreferences {
        userPreferences.get(userId)
    };
    
    /// Get learned patterns
    public query func getLearnedPatterns(): async [(Text, Pattern)] {
        longTermMemory.entries() |> Iter.toArray(_)
    };
}
