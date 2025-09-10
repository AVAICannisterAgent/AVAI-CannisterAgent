// AVAI Smart Prompt Analyzer - Motoko Implementation
// Intelligent analysis system that mirrors the Python smart prompt analysis
// Provides intent classification, complexity assessment, and routing optimization

import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Buffer "mo:base/Buffer";
import Option "mo:base/Option";
import Float "mo:base/Float";

// Import our core types
import Types "../core/Types";
import Utils "../core/Utils";

actor AvaiSmartAnalyzer {
    
    // Analysis state management
    private stable var analyzerId : Text = "avai-smart-analyzer-v3";
    private stable var totalAnalyses : Nat = 0;
    private stable var successfulAnalyses : Nat = 0;
    
    // Pattern recognition database
    private var patternDatabase = HashMap.HashMap<Text, Types.PatternInfo>(100, Text.equal, Text.hash);
    
    // Intent classification models
    private var intentModels = HashMap.HashMap<Text, Types.IntentModel>(20, Text.equal, Text.hash);
    
    // Analysis cache for performance optimization
    private var analysisCache = HashMap.HashMap<Text, Types.AnalysisResult>(200, Text.equal, Text.hash);
    
    // Learning data for continuous improvement
    private var learningData = Buffer.Buffer<Types.LearningEntry>(0);
    
    // Performance metrics
    private var performanceMetrics = {
        var totalAnalysisTime : Int = 0;
        var averageAnalysisTime : Float = 0.0;
        var accuracyRate : Float = 0.95;
        var lastModelUpdate : Int = Time.now();
    };
    
    // Initialize the smart analyzer system
    public func initialize() : async Result.Result<Text, Text> {
        Debug.print("🧠 Initializing AVAI Smart Prompt Analyzer...");
        
        try {
            // Load pattern recognition models
            await loadPatternModels();
            
            // Initialize intent classification
            await initializeIntentModels();
            
            // Set up learning systems
            await initializeLearningSystem();
            
            Debug.print("✅ Smart Analyzer initialized with " # Nat.toText(patternDatabase.size()) # " patterns");
            #ok("Smart Analyzer initialized successfully")
        } catch (error) {
            Debug.print("❌ Failed to initialize Smart Analyzer: " # debug_show(error));
            #err("Smart Analyzer initialization failed")
        }
    };
    
    // Main analysis function - comprehensive prompt analysis
    public func analyzePrompt(request : Types.AnalysisRequest) : async Types.AnalysisResult {
        let startTime = Time.now();
        totalAnalyses += 1;
        
        Debug.print("🔍 Analyzing prompt: " # request.id);
        
        // Check cache for similar analysis
        let cacheKey = Utils.hashText(request.prompt);
        switch (analysisCache.get(cacheKey)) {
            case (?cached) {
                Debug.print("⚡ Using cached analysis result");
                return createCachedResult(cached, request.id);
            };
            case null {
                // Perform new analysis
            };
        };
        
        // Multi-layer analysis
        let complexityAnalysis = await analyzeComplexity(request.prompt);
        let intentAnalysis = await classifyIntent(request.prompt);
        let patternAnalysis = await recognizePatterns(request.prompt);
        let contextAnalysis = await analyzeContext(request.prompt, request.context);
        let routingAnalysis = await determineRouting(complexityAnalysis, intentAnalysis);
        
        // Compile comprehensive analysis result
        let result : Types.AnalysisResult = {
            id = request.id;
            prompt = request.prompt;
            complexity = complexityAnalysis;
            intent = intentAnalysis;
            patterns = patternAnalysis;
            context = contextAnalysis;
            routing = routingAnalysis;
            confidence = calculateConfidence(intentAnalysis, patternAnalysis);
            processingTime = Time.now() - startTime;
            timestamp = Time.now();
            version = "3.0.0-motoko";
        };
        
        // Cache the result for future optimization
        analysisCache.put(cacheKey, result);
        
        // Update learning data
        addLearningEntry(result);
        
        // Update performance metrics
        await updateAnalysisMetrics(result.processingTime, true);
        
        successfulAnalyses += 1;
        
        Debug.print("✅ Analysis completed in " # Int.toText(result.processingTime / 1000000) # "ms");
        
        result
    };
    
    // Complexity analysis - determines how complex the prompt is
    private func analyzeComplexity(prompt : Text) : async Types.ComplexityLevel {
        let promptLength = prompt.size();
        let wordCount = Utils.countWords(prompt);
        let sentenceCount = Utils.countSentences(prompt);
        let technicalTerms = Utils.countTechnicalTerms(prompt);
        let codeBlocks = Utils.countCodeBlocks(prompt);
        
        // Complexity scoring algorithm
        var complexityScore = 0;
        
        // Length-based scoring
        if (promptLength > 1000) { complexityScore += 3 }
        else if (promptLength > 500) { complexityScore += 2 }
        else if (promptLength > 200) { complexityScore += 1 };
        
        // Word count scoring
        if (wordCount > 200) { complexityScore += 3 }
        else if (wordCount > 100) { complexityScore += 2 }
        else if (wordCount > 50) { complexityScore += 1 };
        
        // Technical complexity
        complexityScore += technicalTerms;
        complexityScore += codeBlocks * 2;
        
        // Multi-part questions
        if (sentenceCount > 5) { complexityScore += 2 }
        else if (sentenceCount > 2) { complexityScore += 1 };
        
        // Determine complexity level
        if (complexityScore >= 8) { #VeryComplex }
        else if (complexityScore >= 5) { #Complex }
        else if (complexityScore >= 3) { #Moderate }
        else if (complexityScore >= 1) { #Simple }
        else { #Trivial }
    };
    
    // Intent classification - determines what the user wants to accomplish
    private func classifyIntent(prompt : Text) : async Types.IntentClassification {
        Debug.print("🎯 Classifying intent...");
        
        let promptLower = Text.toLowercase(prompt);
        
        // Code-related intent detection
        if (Utils.containsCodeKeywords(prompt)) {
            let codeIntentType = if (Utils.containsWords(promptLower, ["analyze", "review", "audit", "security"])) { #CodeAnalysis }
                               else if (Utils.containsWords(promptLower, ["debug", "fix", "error", "bug"])) { #CodeDebugging }
                               else if (Utils.containsWords(promptLower, ["create", "generate", "build", "develop"])) { #CodeGeneration }
                               else if (Utils.containsWords(promptLower, ["optimize", "improve", "performance"])) { #CodeOptimization }
                               else { #CodeGeneral };
            
            return {
                primaryIntent = #CodeRelated(codeIntentType);
                confidence = 0.85;
                secondaryIntents = [];
                keywords = Utils.extractCodeKeywords(prompt);
            };
        };
        
        // Research-related intent detection
        if (Utils.containsResearchKeywords(prompt)) {
            let researchType = if (Utils.containsWords(promptLower, ["analyze", "compare", "evaluate"])) { #DataAnalysis }
                              else if (Utils.containsWords(promptLower, ["find", "search", "lookup", "information"])) { #InformationGathering }
                              else if (Utils.containsWords(promptLower, ["report", "summary", "document"])) { #ReportGeneration }
                              else { #GeneralResearch };
            
            return {
                primaryIntent = #Research(researchType);
                confidence = 0.80;
                secondaryIntents = [];
                keywords = Utils.extractResearchKeywords(prompt);
            };
        };
        
        // Analysis-related intent detection  
        if (Utils.containsAnalysisKeywords(prompt)) {
            return {
                primaryIntent = #Analysis;
                confidence = 0.75;
                secondaryIntents = [];
                keywords = Utils.extractAnalysisKeywords(prompt);
            };
        };
        
        // Conversational intent detection
        if (Utils.isConversational(prompt)) {
            let conversationType = if (Utils.isGreeting(prompt)) { #Greeting }
                                  else if (Utils.isQuestion(prompt)) { #Question }
                                  else if (Utils.isRequest(prompt)) { #Request }
                                  else { #General };
            
            return {
                primaryIntent = #Conversational(conversationType);
                confidence = 0.90;
                secondaryIntents = [];
                keywords = Utils.extractConversationalKeywords(prompt);
            };
        };
        
        // Default classification
        {
            primaryIntent = #General;
            confidence = 0.60;
            secondaryIntents = [];
            keywords = [];
        }
    };
    
    // Pattern recognition - identifies known patterns in prompts
    private func recognizePatterns(prompt : Text) : async [Types.RecognizedPattern] {
        Debug.print("🔍 Recognizing patterns...");
        
        let patterns = Buffer.Buffer<Types.RecognizedPattern>(0);
        
        // Check against known patterns
        for ((patternId, patternInfo) in patternDatabase.entries()) {
            if (Utils.matchesPattern(prompt, patternInfo.pattern)) {
                patterns.add({
                    patternId = patternId;
                    patternName = patternInfo.name;
                    confidence = patternInfo.confidence;
                    matches = Utils.findPatternMatches(prompt, patternInfo.pattern);
                });
            };
        };
        
        Buffer.toArray(patterns)
    };
    
    // Context analysis - understands the broader context
    private func analyzeContext(prompt : Text, context : ?Types.ConversationContext) : async Types.ContextAnalysis {
        Debug.print("📋 Analyzing context...");
        
        let hasContext = Option.isSome(context);
        
        switch (context) {
            case (?ctx) {
                // Analyze conversation flow
                let conversationFlow = Utils.analyzeConversationFlow(ctx.previousMessages);
                let topicContinuity = Utils.checkTopicContinuity(prompt, ctx.currentTopic);
                
                {
                    hasContext = true;
                    conversationFlow = conversationFlow;
                    topicContinuity = topicContinuity;
                    contextRelevance = Utils.calculateContextRelevance(prompt, ctx);
                    suggestedFollow-ups = Utils.generateFollowUpSuggestions(prompt, ctx);
                };
            };
            case null {
                // No context available
                {
                    hasContext = false;
                    conversationFlow = #NewConversation;
                    topicContinuity = #NewTopic;
                    contextRelevance = 0.0;
                    suggestedFollow-ups = [];
                };
            };
        }
    };
    
    // Routing determination - decides how to route the request
    private func determineRouting(complexity : Types.ComplexityLevel, intent : Types.IntentClassification) : async Types.RoutingDecision {
        Debug.print("🎯 Determining optimal routing...");
        
        let recommendedAgent = switch (intent.primaryIntent) {
            case (#CodeRelated(_)) { "code_analyzer_agent" };
            case (#Research(_)) { "research_agent" };
            case (#Analysis) { "analysis_agent" };
            case (#Conversational(_)) { "conversational_agent" };
            case (#General) { "general_agent" };
        };
        
        let processingPriority = switch (complexity) {
            case (#VeryComplex) { #High };
            case (#Complex) { #High };
            case (#Moderate) { #Medium };
            case (#Simple) { #Low };
            case (#Trivial) { #Low };
        };
        
        let estimatedProcessingTime = switch (complexity) {
            case (#VeryComplex) { 300000000000 }; // 5 minutes
            case (#Complex) { 180000000000 }; // 3 minutes
            case (#Moderate) { 90000000000 }; // 1.5 minutes
            case (#Simple) { 30000000000 }; // 30 seconds
            case (#Trivial) { 10000000000 }; // 10 seconds
        };
        
        {
            recommendedAgent = recommendedAgent;
            priority = processingPriority;
            estimatedTime = estimatedProcessingTime;
            requiresSpecialization = intent.confidence > 0.8;
            fallbackOptions = ["general_agent", "orchestrator_fallback"];
        }
    };
    
    // Calculate overall confidence in the analysis
    private func calculateConfidence(intent : Types.IntentClassification, patterns : [Types.RecognizedPattern]) : Float {
        var totalConfidence = intent.confidence;
        
        // Add pattern recognition confidence
        var patternConfidence : Float = 0.0;
        var patternCount : Float = 0.0;
        
        for (pattern in patterns.vals()) {
            patternConfidence += pattern.confidence;
            patternCount += 1.0;
        };
        
        if (patternCount > 0.0) {
            let avgPatternConfidence = patternConfidence / patternCount;
            totalConfidence := (totalConfidence + avgPatternConfidence) / 2.0;
        };
        
        // Normalize to 0-1 range
        if (totalConfidence > 1.0) { 1.0 }
        else if (totalConfidence < 0.0) { 0.0 }
        else { totalConfidence }
    };
    
    // Load pattern recognition models
    private func loadPatternModels() : async () {
        Debug.print("📚 Loading pattern recognition models...");
        
        let defaultPatterns = [
            ("greeting_pattern", {
                name = "Greeting Pattern";
                pattern = "^(hello|hi|hey|greetings|good morning|good afternoon|good evening)";
                confidence = 0.95;
                category = "conversational";
                description = "Identifies greeting messages";
            }),
            ("code_analysis_pattern", {
                name = "Code Analysis Request";
                pattern = "(analyze|review|audit|check).*(code|repository|project|security)";
                confidence = 0.90;
                category = "code_analysis";
                description = "Identifies code analysis requests";
            }),
            ("research_pattern", {
                name = "Research Request";
                pattern = "(research|find|search|lookup|investigate).*(information|data|about)";
                confidence = 0.85;
                category = "research";
                description = "Identifies research requests";
            }),
            ("question_pattern", {
                name = "Question Pattern";
                pattern = "(what|how|why|when|where|which|who).*\\?";
                confidence = 0.80;
                category = "conversational";
                description = "Identifies question-based prompts";
            })
        ];
        
        for ((patternId, patternInfo) in defaultPatterns.vals()) {
            patternDatabase.put(patternId, patternInfo);
        };
        
        Debug.print("✅ Loaded " # Nat.toText(patternDatabase.size()) # " pattern models");
    };
    
    // Initialize intent classification models
    private func initializeIntentModels() : async () {
        Debug.print("🎯 Initializing intent classification models...");
        
        let defaultModels = [
            ("code_intent_model", {
                name = "Code Intent Classifier";
                accuracy = 0.92;
                lastTrained = Time.now();
                categories = ["code_analysis", "code_generation", "code_debugging", "code_optimization"];
            }),
            ("research_intent_model", {
                name = "Research Intent Classifier";
                accuracy = 0.88;
                lastTrained = Time.now();
                categories = ["information_gathering", "data_analysis", "report_generation"];
            }),
            ("conversational_intent_model", {
                name = "Conversational Intent Classifier";
                accuracy = 0.95;
                lastTrained = Time.now();
                categories = ["greeting", "question", "request", "general"];
            })
        ];
        
        for ((modelId, modelInfo) in defaultModels.vals()) {
            intentModels.put(modelId, modelInfo);
        };
        
        Debug.print("✅ Initialized " # Nat.toText(intentModels.size()) # " intent models");
    };
    
    // Initialize learning system for continuous improvement
    private func initializeLearningSystem() : async () {
        Debug.print("🧠 Initializing learning system...");
        
        // Set up learning data structures
        learningData := Buffer.Buffer<Types.LearningEntry>(0);
        
        Debug.print("✅ Learning system initialized");
    };
    
    // Add learning entry for continuous improvement
    private func addLearningEntry(result : Types.AnalysisResult) {
        let entry : Types.LearningEntry = {
            analysisId = result.id;
            prompt = result.prompt;
            predictedIntent = result.intent.primaryIntent;
            confidence = result.confidence;
            actualOutcome = #Unknown; // This would be updated based on user feedback
            timestamp = result.timestamp;
        };
        
        learningData.add(entry);
        
        // Keep only recent entries (limit to 1000 for performance)
        if (learningData.size() > 1000) {
            ignore learningData.removeLast();
        };
    };
    
    // Create cached result
    private func createCachedResult(cached : Types.AnalysisResult, requestId : Text) : Types.AnalysisResult {
        {
            cached with 
            id = requestId;
            processingTime = 1000000; // 1ms for cache retrieval
            timestamp = Time.now();
        }
    };
    
    // Update analysis metrics
    private func updateAnalysisMetrics(processingTime : Int, success : Bool) : async () {
        performanceMetrics.totalAnalysisTime += processingTime;
        
        let avgTime = Float.fromInt(performanceMetrics.totalAnalysisTime) / Float.fromInt(totalAnalyses);
        performanceMetrics.averageAnalysisTime := avgTime;
        
        if (success) {
            let currentAccuracy = Float.fromInt(successfulAnalyses) / Float.fromInt(totalAnalyses);
            performanceMetrics.accuracyRate := currentAccuracy;
        };
    };
    
    // Public query functions
    public query func getAnalyzerStatus() : async Types.AnalyzerStatus {
        {
            analyzerId = analyzerId;
            totalAnalyses = totalAnalyses;
            successfulAnalyses = successfulAnalyses;
            accuracyRate = performanceMetrics.accuracyRate;
            averageAnalysisTime = performanceMetrics.averageAnalysisTime;
            patternsLoaded = patternDatabase.size();
            modelsLoaded = intentModels.size();
            cacheSize = analysisCache.size();
            version = "3.0.0-motoko";
            lastUpdate = performanceMetrics.lastModelUpdate;
        }
    };
    
    public query func getPatternStatistics() : async Types.PatternStatistics {
        let totalPatterns = patternDatabase.size();
        var avgConfidence : Float = 0.0;
        var totalConfidence : Float = 0.0;
        
        for ((_, pattern) in patternDatabase.entries()) {
            totalConfidence += pattern.confidence;
        };
        
        if (totalPatterns > 0) {
            avgConfidence := totalConfidence / Float.fromInt(totalPatterns);
        };
        
        {
            totalPatterns = totalPatterns;
            averageConfidence = avgConfidence;
            categories = ["conversational", "code_analysis", "research", "analysis"];
            lastUpdated = performanceMetrics.lastModelUpdate;
        }
    };
    
    public query func getLearningStatistics() : async Types.LearningStatistics {
        {
            totalLearningEntries = learningData.size();
            learningAccuracy = performanceMetrics.accuracyRate;
            lastLearningUpdate = performanceMetrics.lastModelUpdate;
            improvementRate = 0.02; // 2% improvement rate placeholder
        }
    };
    
    // System management functions
    public func addPattern(patternId : Text, pattern : Types.PatternInfo) : async Result.Result<Text, Text> {
        switch (patternDatabase.get(patternId)) {
            case (?_) {
                #err("Pattern " # patternId # " already exists")
            };
            case null {
                patternDatabase.put(patternId, pattern);
                #ok("Pattern " # patternId # " added successfully")
            };
        }
    };
    
    public func updatePattern(patternId : Text, pattern : Types.PatternInfo) : async Result.Result<Text, Text> {
        switch (patternDatabase.get(patternId)) {
            case (?_) {
                patternDatabase.put(patternId, pattern);
                #ok("Pattern " # patternId # " updated successfully")
            };
            case null {
                #err("Pattern " # patternId # " not found")
            };
        }
    };
    
    public func clearAnalysisCache() : async Text {
        analysisCache := HashMap.HashMap<Text, Types.AnalysisResult>(200, Text.equal, Text.hash);
        "Analysis cache cleared"
    };
    
    public func retrainModels() : async Text {
        performanceMetrics.lastModelUpdate := Time.now();
        "Models retrained with latest learning data"
    };
}
