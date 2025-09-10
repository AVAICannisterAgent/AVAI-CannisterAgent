/**
 * AVAI Python Integration Bridge - Seamless Motoko-Python interoperability
 * Provides fallback to Python when Motoko reaches computational or library limitations
 */

import Types "../core/types";
import Utils "../core/utils";

import Time "mo:base/Time";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Float "mo:base/Float";

module PythonBridge {
    
    // ================================
    // BRIDGE CONFIGURATION
    // ================================
    
    /// Python integration configuration
    private let PYTHON_CONFIG = {
        maxConcurrentRequests = 5;
        defaultTimeout = 60000; // 60 seconds
        retryAttempts = 3;
        retryDelay = 1000; // 1 second
        circuitBreakerThreshold = 5; // failures before circuit opens
        circuitBreakerResetTime = 300000; // 5 minutes
    };
    
    /// Python module capabilities mapping
    private let PYTHON_CAPABILITIES = [
        ("requests", ["web_scraping", "api_calls", "http_requests"]),
        ("pandas", ["data_analysis", "csv_processing", "data_manipulation"]),
        ("numpy", ["numerical_computing", "array_operations", "mathematical_analysis"]),
        ("scikit-learn", ["machine_learning", "classification", "clustering", "regression"]),
        ("beautifulsoup4", ["html_parsing", "web_scraping", "content_extraction"]),
        ("selenium", ["browser_automation", "dynamic_content", "form_interaction"]),
        ("cryptography", ["encryption", "hashing", "certificate_validation"]),
        ("matplotlib", ["data_visualization", "chart_generation", "plotting"]),
        ("pillow", ["image_processing", "image_analysis", "format_conversion"]),
        ("nltk", ["natural_language_processing", "text_analysis", "sentiment_analysis"])
    ];
    
    // ================================
    // BRIDGE STATE TYPES
    // ================================
    
    /// Python bridge status
    public type BridgeStatus = {
        #Active;
        #Degraded;
        #CircuitOpen;
        #Maintenance;
        #Error: Text;
    };
    
    /// Python request priority
    public type RequestPriority = {
        #Critical;    // Immediate execution
        #High;        // < 5 second wait
        #Normal;      // < 30 second wait  
        #Low;         // < 5 minute wait
        #Batch;       // Best effort execution
    };
    
    /// Python execution context
    public type ExecutionContext = {
        timeout: Nat;
        priority: RequestPriority;
        requiresGPU: Bool;
        memoryLimit: ?Nat; // MB
        allowNetworking: Bool;
        sandboxed: Bool;
        environmentVariables: [(Text, Text)];
    };
    
    /// Python response metadata
    public type ResponseMetadata = {
        executionTime: Nat;
        memoryUsed: Nat;
        cpuTime: Nat;
        pythonVersion: Text;
        moduleVersions: [(Text, Text)];
        warningsCount: Nat;
        cacheUsed: Bool;
    };
    
    /// Fallback reason classification
    public type FallbackReason = {
        #ComplexComputation;     // Heavy mathematical operations
        #ExternalLibraries;      // Need for specific Python libraries
        #FileSystemAccess;       // File operations not supported in Motoko
        #NetworkOperations;      // Advanced networking capabilities
        #ImageProcessing;        // Image analysis and manipulation
        #DataScience;           // Pandas, NumPy operations
        #MachineLearning;       // ML model execution
        #WebScraping;           // Complex web scraping
        #Cryptography;          // Advanced crypto operations
        #SystemOperations;      // OS-level operations
    };
    
    /// Circuit breaker state
    public type CircuitBreakerState = {
        isOpen: Bool;
        failureCount: Nat;
        lastFailureTime: Int;
        successCount: Nat;
        totalRequests: Nat;
    };
    
    // ================================
    // STATE MANAGEMENT
    // ================================
    
    /// Current bridge status
    private stable var bridgeStatus: BridgeStatus = #Active;
    
    /// Request queue for managing load
    private var requestQueue = Buffer.Buffer<QueuedRequest>(50);
    
    /// Active requests tracking
    private var activeRequests = HashMap.HashMap<Text, ActiveRequest>(10, Text.equal, Text.hash);
    
    /// Circuit breaker state
    private stable var circuitBreaker: CircuitBreakerState = {
        isOpen = false;
        failureCount = 0;
        lastFailureTime = 0;
        successCount = 0;
        totalRequests = 0;
    };
    
    /// Python capability cache
    private var capabilityCache = HashMap.HashMap<Text, [Text]>(20, Text.equal, Text.hash);
    
    /// Performance metrics
    private var performanceMetrics = HashMap.HashMap<Text, BridgeMetrics>(10, Text.equal, Text.hash);
    
    /// Queued request type
    public type QueuedRequest = {
        id: Text;
        request: Types.PythonRequest;
        context: ExecutionContext;
        queuedAt: Int;
        callback: (Types.AVAIResult<Types.PythonResponse>) -> ();
    };
    
    /// Active request tracking
    public type ActiveRequest = {
        id: Text;
        startedAt: Int;
        timeout: Nat;
        priority: RequestPriority;
        moduleUsed: Text;
    };
    
    /// Bridge performance metrics
    public type BridgeMetrics = {
        module: Text;
        totalRequests: Nat;
        successfulRequests: Nat;
        averageExecutionTime: Nat;
        lastUsed: Int;
        errorRate: Float;
    };
    
    // ================================
    // INITIALIZATION
    // ================================
    
    /// Initialize Python bridge
    public func initialize(): async Types.AVAIResult<Text> {
        Utils.debugLog("🐍 Initializing Python Bridge...");
        
        // Initialize capability cache
        for ((module, capabilities) in PYTHON_CAPABILITIES.vals()) {
            capabilityCache.put(module, capabilities);
        };
        
        // Test Python connectivity
        let connectivityTest = await testPythonConnectivity();
        switch (connectivityTest) {
            case (#err(error)) {
                bridgeStatus := #Error(debug_show(error));
                return Types.error(error);
            };
            case (#ok(_)) {
                bridgeStatus := #Active;
            };
        };
        
        // Initialize performance tracking
        for ((module, _) in PYTHON_CAPABILITIES.vals()) {
            performanceMetrics.put(module, {
                module = module;
                totalRequests = 0;
                successfulRequests = 0;
                averageExecutionTime = 0;
                lastUsed = 0;
                errorRate = 0.0;
            });
        };
        
        Utils.debugLog("✅ Python Bridge initialized");
        Types.success("Python Bridge initialized successfully")
    };
    
    /// Test Python connectivity
    private func testPythonConnectivity(): async Types.AVAIResult<Text> {
        let testRequest: Types.PythonRequest = {
            id = "connectivity_test";
            module = "sys";
            function = "version_info";
            arguments = [];
            timeout = 5000;
            priority = #High;
        };
        
        let testContext: ExecutionContext = {
            timeout = 5000;
            priority = #High;
            requiresGPU = false;
            memoryLimit = ?100; // 100MB
            allowNetworking = false;
            sandboxed = true;
            environmentVariables = [];
        };
        
        // This would actually test the Python connection
        // For now, simulate successful connection
        Types.success("Python 3.11+ detected")
    };
    
    // ================================
    // FALLBACK DECISION LOGIC
    // ================================
    
    /// Determine if Python fallback is recommended
    public func shouldFallbackToPython(
        prompt: Text,
        category: Types.PromptCategory,
        complexity: Float,
        requiredCapabilities: [Text]
    ): async {
        shouldFallback: Bool;
        reason: FallbackReason;
        recommendedModules: [Text];
        estimatedTime: Nat;
        confidence: Float;
    } {
        
        let lowerPrompt = Text.toLowercase(prompt);
        
        // Check for explicit Python capability needs
        var needsPython = false;
        var fallbackReason: FallbackReason = #ComplexComputation;
        var recommendedModules = Buffer.Buffer<Text>(3);
        
        // Machine Learning indicators
        if (Utils.containsAny(lowerPrompt, [
            "machine learning", "ml model", "neural network", "classification",
            "regression", "clustering", "scikit-learn", "tensorflow", "pytorch"
        ])) {
            needsPython := true;
            fallbackReason := #MachineLearning;
            recommendedModules.add("scikit-learn");
            recommendedModules.add("pandas");
            recommendedModules.add("numpy");
        }
        
        // Data Science indicators
        else if (Utils.containsAny(lowerPrompt, [
            "data analysis", "pandas", "numpy", "csv", "dataframe",
            "statistical analysis", "data visualization", "matplotlib"
        ])) {
            needsPython := true;
            fallbackReason := #DataScience;
            recommendedModules.add("pandas");
            recommendedModules.add("numpy");
            recommendedModules.add("matplotlib");
        }
        
        // Web Scraping indicators
        else if (Utils.containsAny(lowerPrompt, [
            "web scraping", "beautifulsoup", "selenium", "scrape website",
            "extract data", "parse html", "dynamic content"
        ])) {
            needsPython := true;
            fallbackReason := #WebScraping;
            recommendedModules.add("requests");
            recommendedModules.add("beautifulsoup4");
            if (Utils.containsAny(lowerPrompt, ["dynamic", "javascript", "spa"])) {
                recommendedModules.add("selenium");
            };
        }
        
        // Image Processing indicators
        else if (Utils.containsAny(lowerPrompt, [
            "image processing", "pillow", "opencv", "image analysis",
            "computer vision", "image manipulation", "format conversion"
        ])) {
            needsPython := true;
            fallbackReason := #ImageProcessing;
            recommendedModules.add("pillow");
            recommendedModules.add("opencv-python");
        }
        
        // Cryptography indicators
        else if (Utils.containsAny(lowerPrompt, [
            "encryption", "decryption", "hashing", "cryptography",
            "certificate", "ssl", "tls", "signing"
        ])) {
            needsPython := true;
            fallbackReason := #Cryptography;
            recommendedModules.add("cryptography");
        }
        
        // Complex computation indicators
        else if (complexity > 0.8 or Utils.containsAny(lowerPrompt, [
            "complex calculation", "numerical analysis", "optimization",
            "scientific computing", "simulation"
        ])) {
            needsPython := true;
            fallbackReason := #ComplexComputation;
            recommendedModules.add("numpy");
            recommendedModules.add("scipy");
        }
        
        // Check required capabilities against Python modules
        for (capability in requiredCapabilities.vals()) {
            for ((module, capabilities) in capabilityCache.entries()) {
                if (Array.find<Text>(capabilities, func(cap) = cap == capability) != null) {
                    needsPython := true;
                    recommendedModules.add(module);
                };
            };
        };
        
        // Calculate estimated execution time
        let baseTime = switch (fallbackReason) {
            case (#MachineLearning) { 120000 }; // 2 minutes
            case (#DataScience) { 30000 };      // 30 seconds
            case (#WebScraping) { 60000 };      // 1 minute
            case (#ImageProcessing) { 45000 };  // 45 seconds
            case (#ComplexComputation) { 90000 }; // 1.5 minutes
            case (_) { 30000 }; // Default 30 seconds
        };
        
        let complexityMultiplier = 1.0 + complexity;
        let estimatedTime = Float.toInt(Float.fromInt(baseTime) * complexityMultiplier);
        
        // Calculate confidence based on pattern matching
        let confidence = calculateFallbackConfidence(lowerPrompt, fallbackReason);
        
        {
            shouldFallback = needsPython;
            reason = fallbackReason;
            recommendedModules = Buffer.toArray(recommendedModules);
            estimatedTime = estimatedTime;
            confidence = confidence;
        }
    };
    
    /// Calculate confidence in fallback recommendation
    private func calculateFallbackConfidence(prompt: Text, reason: FallbackReason): Float {
        let strongIndicators = switch (reason) {
            case (#MachineLearning) {
                ["scikit-learn", "tensorflow", "pytorch", "model", "training", "prediction"]
            };
            case (#DataScience) {
                ["pandas", "dataframe", "csv", "analysis", "visualization", "statistics"]
            };
            case (#WebScraping) {
                ["scraping", "beautifulsoup", "selenium", "extract", "parse", "crawl"]
            };
            case (#ImageProcessing) {
                ["pillow", "opencv", "image", "processing", "vision", "filter"]
            };
            case (#Cryptography) {
                ["encryption", "hash", "certificate", "cryptography", "ssl", "signature"]
            };
            case (_) {
                ["complex", "advanced", "specialized", "library", "package"]
            };
        };
        
        var matches = 0;
        for (indicator in strongIndicators.vals()) {
            if (Text.contains(prompt, #text indicator)) {
                matches += 1;
            };
        };
        
        Float.min(1.0, Float.fromInt(matches) / Float.fromInt(strongIndicators.size()) + 0.3)
    };
    
    // ================================
    // PYTHON EXECUTION
    // ================================
    
    /// Execute Python code with full context and monitoring
    public func executePython(
        request: Types.PythonRequest,
        context: ?ExecutionContext
    ): async Types.AVAIResult<Types.PythonResponse> {
        
        // Check circuit breaker
        if (circuitBreaker.isOpen) {
            if (Time.now() - circuitBreaker.lastFailureTime > PYTHON_CONFIG.circuitBreakerResetTime) {
                // Reset circuit breaker
                circuitBreaker := {
                    isOpen = false;
                    failureCount = 0;
                    lastFailureTime = circuitBreaker.lastFailureTime;
                    successCount = 0;
                    totalRequests = circuitBreaker.totalRequests;
                };
                bridgeStatus := #Active;
            } else {
                return Types.error(#PythonFallbackRequired("Circuit breaker is open"));
            }
        };
        
        // Check bridge status
        switch (bridgeStatus) {
            case (#Error(msg)) {
                return Types.error(#SystemError("Python bridge error: " # msg));
            };
            case (#Maintenance) {
                return Types.error(#SystemError("Python bridge under maintenance"));
            };
            case (_) { /* Continue */ };
        };
        
        let execContext = switch (context) {
            case (?ctx) { ctx };
            case null { getDefaultExecutionContext(request.priority) };
        };
        
        Utils.debugLog("🐍 Executing Python: " # request.module # "." # request.function);
        
        let startTime = Time.now();
        
        // Add to active requests
        activeRequests.put(request.id, {
            id = request.id;
            startedAt = startTime;
            timeout = execContext.timeout;
            priority = execContext.priority;
            moduleUsed = request.module;
        });
        
        // Execute with retry logic
        let result = await executeWithRetry(request, execContext);
        
        // Remove from active requests
        activeRequests.delete(request.id);
        
        let endTime = Time.now();
        let executionTime = Int.abs(endTime - startTime) / 1000000; // milliseconds
        
        // Update metrics and circuit breaker
        switch (result) {
            case (#ok(response)) {
                updateSuccessMetrics(request.module, executionTime);
                updateCircuitBreakerSuccess();
            };
            case (#err(error)) {
                updateErrorMetrics(request.module);
                updateCircuitBreakerFailure();
            };
        };
        
        result
    };
    
    /// Execute with retry logic
    private func executeWithRetry(
        request: Types.PythonRequest,
        context: ExecutionContext
    ): async Types.AVAIResult<Types.PythonResponse> {
        
        var attempts = 0;
        var lastError: ?Types.AVAIError = null;
        
        while (attempts < PYTHON_CONFIG.retryAttempts) {
            attempts += 1;
            
            let result = await executePythonDirect(request, context);
            switch (result) {
                case (#ok(response)) {
                    return Types.success(response);
                };
                case (#err(error)) {
                    lastError := ?error;
                    
                    // Don't retry for certain error types
                    switch (error) {
                        case (#InvalidInput(_)) { return result }; // Don't retry invalid input
                        case (#PermissionDenied(_)) { return result }; // Don't retry permissions
                        case (_) { /* Retry other errors */ };
                    };
                    
                    if (attempts < PYTHON_CONFIG.retryAttempts) {
                        Utils.debugLog("🔄 Python execution failed, retrying... (" # Nat.toText(attempts) # ")");
                        // Add delay between retries
                        await asyncDelay(PYTHON_CONFIG.retryDelay * attempts);
                    };
                };
            };
        };
        
        // All retries exhausted
        switch (lastError) {
            case (?error) { Types.error(error) };
            case null { Types.error(#SystemError("Python execution failed after retries")) };
        }
    };
    
    /// Direct Python execution (to be implemented with actual Python bridge)
    private func executePythonDirect(
        request: Types.PythonRequest,
        context: ExecutionContext
    ): async Types.AVAIResult<Types.PythonResponse> {
        
        // This would integrate with actual Python execution environment
        // For now, simulate execution based on request parameters
        
        let simulatedExecutionTime = switch (request.module) {
            case ("pandas") { 2000 + request.arguments.size() * 100 };
            case ("numpy") { 1500 + request.arguments.size() * 50 };
            case ("requests") { 3000 + request.arguments.size() * 200 };
            case ("scikit-learn") { 5000 + request.arguments.size() * 300 };
            case ("selenium") { 8000 + request.arguments.size() * 500 };
            case (_) { 1000 + request.arguments.size() * 100 };
        };
        
        // Simulate processing delay
        await asyncDelay(simulatedExecutionTime);
        
        // Generate simulated response
        let response: Types.PythonResponse = {
            id = request.id;
            success = true;
            result = ?("Executed " # request.module # "." # request.function # " with " # 
                     Nat.toText(request.arguments.size()) # " arguments");
            error = null;
            executionTime = simulatedExecutionTime;
            metadata = [
                ("python_version", "3.11.5"),
                ("module_version", request.module # "_2.1.0"),
                ("memory_used", "45MB"),
                ("cpu_time", Nat.toText(simulatedExecutionTime / 2) # "ms")
            ];
        };
        
        Types.success(response)
    };
    
    // ================================
    // QUEUE MANAGEMENT
    // ================================
    
    /// Add request to queue for batch processing
    public func queuePythonRequest(
        request: Types.PythonRequest,
        context: ExecutionContext,
        callback: (Types.AVAIResult<Types.PythonResponse>) -> ()
    ): Text {
        
        let queuedRequest: QueuedRequest = {
            id = request.id;
            request = request;
            context = context;
            queuedAt = Time.now();
            callback = callback;
        };
        
        // Insert based on priority
        let insertPosition = findInsertPosition(context.priority);
        requestQueue.insert(insertPosition, queuedRequest);
        
        Utils.debugLog("📝 Python request queued: " # request.id # " (position: " # Nat.toText(insertPosition) # ")");
        
        request.id
    };
    
    /// Find appropriate insert position for priority
    private func findInsertPosition(priority: RequestPriority): Nat {
        let priorityValue = switch (priority) {
            case (#Critical) { 4 };
            case (#High) { 3 };
            case (#Normal) { 2 };
            case (#Low) { 1 };
            case (#Batch) { 0 };
        };
        
        var position = 0;
        for (i in requestQueue.keys()) {
            let existingPriority = switch (requestQueue.get(i).context.priority) {
                case (#Critical) { 4 };
                case (#High) { 3 };
                case (#Normal) { 2 };
                case (#Low) { 1 };
                case (#Batch) { 0 };
            };
            
            if (priorityValue <= existingPriority) {
                position := i + 1;
            } else {
                break;
            };
        };
        
        position
    };
    
    /// Process queued requests
    public func processQueue(): async Nat {
        var processedCount = 0;
        let maxConcurrent = PYTHON_CONFIG.maxConcurrentRequests;
        let currentActive = activeRequests.size();
        
        if (currentActive >= maxConcurrent) {
            return 0; // Already at capacity
        };
        
        let availableSlots = maxConcurrent - currentActive;
        let processCount = Nat.min(availableSlots, requestQueue.size());
        
        for (i in Iter.range(0, processCount - 1)) {
            switch (requestQueue.removeLast()) {
                case (?queuedRequest) {
                    // Execute asynchronously
                    let _ = async {
                        let result = await executePython(queuedRequest.request, ?queuedRequest.context);
                        queuedRequest.callback(result);
                    };
                    processedCount += 1;
                };
                case null { break };
            };
        };
        
        if (processedCount > 0) {
            Utils.debugLog("⚡ Processed " # Nat.toText(processedCount) # " queued Python requests");
        };
        
        processedCount
    };
    
    // ================================
    // MONITORING AND METRICS
    // ================================
    
    /// Update success metrics
    private func updateSuccessMetrics(module: Text, executionTime: Nat) {
        let currentMetrics = switch (performanceMetrics.get(module)) {
            case (?metrics) { metrics };
            case null {
                {
                    module = module;
                    totalRequests = 0;
                    successfulRequests = 0;
                    averageExecutionTime = 0;
                    lastUsed = Time.now();
                    errorRate = 0.0;
                }
            };
        };
        
        let newTotal = currentMetrics.totalRequests + 1;
        let newSuccessful = currentMetrics.successfulRequests + 1;
        let newAvgTime = (currentMetrics.averageExecutionTime * currentMetrics.totalRequests + executionTime) / newTotal;
        let newErrorRate = Float.fromInt(newTotal - newSuccessful) / Float.fromInt(newTotal);
        
        performanceMetrics.put(module, {
            module = module;
            totalRequests = newTotal;
            successfulRequests = newSuccessful;
            averageExecutionTime = newAvgTime;
            lastUsed = Time.now();
            errorRate = newErrorRate;
        });
    };
    
    /// Update error metrics
    private func updateErrorMetrics(module: Text) {
        let currentMetrics = switch (performanceMetrics.get(module)) {
            case (?metrics) { metrics };
            case null {
                {
                    module = module;
                    totalRequests = 0;
                    successfulRequests = 0;
                    averageExecutionTime = 30000;
                    lastUsed = Time.now();
                    errorRate = 0.0;
                }
            };
        };
        
        let newTotal = currentMetrics.totalRequests + 1;
        let newErrorRate = Float.fromInt(newTotal - currentMetrics.successfulRequests) / Float.fromInt(newTotal);
        
        performanceMetrics.put(module, {
            module = currentMetrics.module;
            totalRequests = newTotal;
            successfulRequests = currentMetrics.successfulRequests;
            averageExecutionTime = currentMetrics.averageExecutionTime;
            lastUsed = Time.now();
            errorRate = newErrorRate;
        });
    };
    
    /// Update circuit breaker on success
    private func updateCircuitBreakerSuccess() {
        circuitBreaker := {
            isOpen = false;
            failureCount = 0; // Reset failure count on success
            lastFailureTime = circuitBreaker.lastFailureTime;
            successCount = circuitBreaker.successCount + 1;
            totalRequests = circuitBreaker.totalRequests + 1;
        };
        
        if (bridgeStatus == #CircuitOpen) {
            bridgeStatus := #Active;
        };
    };
    
    /// Update circuit breaker on failure
    private func updateCircuitBreakerFailure() {
        let newFailureCount = circuitBreaker.failureCount + 1;
        let shouldOpen = newFailureCount >= PYTHON_CONFIG.circuitBreakerThreshold;
        
        circuitBreaker := {
            isOpen = shouldOpen;
            failureCount = newFailureCount;
            lastFailureTime = Time.now();
            successCount = circuitBreaker.successCount;
            totalRequests = circuitBreaker.totalRequests + 1;
        };
        
        if (shouldOpen) {
            bridgeStatus := #CircuitOpen;
            Utils.debugLog("⚠️ Python bridge circuit breaker opened due to failures");
        };
    };
    
    // ================================
    // UTILITY FUNCTIONS
    // ================================
    
    /// Get default execution context
    private func getDefaultExecutionContext(priority: Types.Priority): ExecutionContext {
        let requestPriority = switch (priority) {
            case (#Critical) { #Critical };
            case (#High) { #High };
            case (#Medium) { #Normal };
            case (#Low) { #Low };
            case (#Background) { #Batch };
        };
        
        {
            timeout = PYTHON_CONFIG.defaultTimeout;
            priority = requestPriority;
            requiresGPU = false;
            memoryLimit = ?500; // 500MB default
            allowNetworking = true;
            sandboxed = true;
            environmentVariables = [];
        }
    };
    
    /// Async delay function
    private func asyncDelay(milliseconds: Nat): async () {
        // This would implement actual async delay in production
        // For now, it's a placeholder
    };
    
    /// Get bridge status and metrics
    public query func getBridgeStatus(): async {
        status: BridgeStatus;
        circuitBreaker: CircuitBreakerState;
        activeRequests: Nat;
        queueSize: Nat;
        metrics: [(Text, BridgeMetrics)];
    } {
        {
            status = bridgeStatus;
            circuitBreaker = circuitBreaker;
            activeRequests = activeRequests.size();
            queueSize = requestQueue.size();
            metrics = performanceMetrics.entries() |> Iter.toArray(_);
        }
    };
    
    /// Get available Python capabilities
    public query func getAvailableCapabilities(): async [(Text, [Text])] {
        capabilityCache.entries() |> Iter.toArray(_)
    };
    
    /// Check if specific capability is available
    public query func hasCapability(capability: Text): async Bool {
        for ((_, capabilities) in capabilityCache.entries()) {
            if (Array.find<Text>(capabilities, func(cap) = cap == capability) != null) {
                return true;
            };
        };
        false
    };
    
    /// Get performance statistics
    public query func getPerformanceStats(): async {
        totalRequests: Nat;
        successRate: Float;
        averageExecutionTime: Nat;
        errorRate: Float;
        circuitBreakerTrips: Nat;
    } {
        var totalRequests = 0;
        var totalSuccessful = 0;
        var totalTime = 0;
        var moduleCount = 0;
        
        for ((_, metrics) in performanceMetrics.entries()) {
            totalRequests += metrics.totalRequests;
            totalSuccessful += metrics.successfulRequests;
            totalTime += metrics.averageExecutionTime;
            moduleCount += 1;
        };
        
        let successRate = if (totalRequests > 0) {
            Float.fromInt(totalSuccessful) / Float.fromInt(totalRequests)
        } else { 0.0 };
        
        let avgTime = if (moduleCount > 0) { totalTime / moduleCount } else { 0 };
        
        let errorRate = 1.0 - successRate;
        
        {
            totalRequests = circuitBreaker.totalRequests;
            successRate = successRate;
            averageExecutionTime = avgTime;
            errorRate = errorRate;
            circuitBreakerTrips = if (circuitBreaker.failureCount >= PYTHON_CONFIG.circuitBreakerThreshold) { 1 } else { 0 };
        }
    };
}
