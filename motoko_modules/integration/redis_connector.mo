/**
 * AVAI Redis Connector - High-performance data sharing and caching
 * Provides seamless integration with Redis for state management and inter-system communication
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
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";

module RedisConnector {
    
    // ================================
    // REDIS CONFIGURATION
    // ================================
    
    /// Redis connection configuration
    private let REDIS_CONFIG = {
        defaultPort = 6379;
        connectionTimeout = 5000; // 5 seconds
        commandTimeout = 30000;   // 30 seconds
        maxRetries = 3;
        retryDelay = 1000;        // 1 second
        poolSize = 10;
        healthCheckInterval = 60000; // 1 minute
        keyPrefix = "avai:";
    };
    
    /// Redis key namespaces
    private let NAMESPACES = {
        agents = "agents:";
        sessions = "sessions:";
        cache = "cache:";
        metrics = "metrics:";
        learning = "learning:";
        reports = "reports:";
        tasks = "tasks:";
        events = "events:";
    };
    
    // ================================
    // DATA TYPES
    // ================================
    
    /// Redis connection status
    public type ConnectionStatus = {
        #Connected;
        #Connecting;
        #Disconnected;
        #Error: Text;
        #Reconnecting;
    };
    
    /// Redis operation type
    public type RedisOperation = {
        #Get: Text;                    // GET key
        #Set: (Text, Text, ?Nat);     // SET key value [expiration]
        #Delete: Text;                // DEL key
        #Exists: Text;                // EXISTS key
        #Increment: Text;             // INCR key
        #Decrement: Text;             // DECR key
        #ListPush: (Text, Text);      // LPUSH key value
        #ListPop: Text;               // LPOP key
        #ListGet: (Text, Int, Int);   // LRANGE key start stop
        #HashSet: (Text, Text, Text); // HSET hash field value
        #HashGet: (Text, Text);       // HGET hash field
        #HashGetAll: Text;            // HGETALL hash
        #SetAdd: (Text, Text);        // SADD set member
        #SetMembers: Text;            // SMEMBERS set
        #Publish: (Text, Text);       // PUBLISH channel message
        #SetExpire: (Text, Nat);      // EXPIRE key seconds
    };
    
    /// Redis response type
    public type RedisResponse = {
        #StringValue: Text;
        #IntegerValue: Int;
        #BooleanValue: Bool;
        #ArrayValue: [Text];
        #HashValue: [(Text, Text)];
        #NullValue;
        #ErrorValue: Text;
    };
    
    /// Redis connection info
    public type ConnectionInfo = {
        host: Text;
        port: Nat;
        database: Nat;
        password: ?Text;
        ssl: Bool;
        connectionPoolSize: Nat;
    };
    
    /// Redis performance metrics
    public type RedisMetrics = {
        totalOperations: Nat;
        successfulOperations: Nat;
        failedOperations: Nat;
        averageLatency: Nat;
        lastOperationTime: Int;
        connectionUptime: Int;
        hitRate: Float;
        missRate: Float;
    };
    
    /// Cache entry with metadata
    public type CacheEntry = {
        key: Text;
        value: Text;
        createdAt: Int;
        expiresAt: ?Int;
        accessCount: Nat;
        lastAccessed: Int;
        tags: [Text];
    };
    
    /// Event subscription
    public type EventSubscription = {
        channel: Text;
        pattern: ?Text;
        callback: (Text, Text) -> ();
        subscriptionTime: Int;
        messageCount: Nat;
    };
    
    // ================================
    // STATE MANAGEMENT
    // ================================
    
    /// Current connection status
    private stable var connectionStatus: ConnectionStatus = #Disconnected;
    
    /// Connection information
    private stable var connectionInfo: ?ConnectionInfo = null;
    
    /// Operation metrics
    private stable var metrics: RedisMetrics = {
        totalOperations = 0;
        successfulOperations = 0;
        failedOperations = 0;
        averageLatency = 0;
        lastOperationTime = 0;
        connectionUptime = 0;
        hitRate = 0.0;
        missRate = 0.0;
    };
    
    /// Cache metadata for performance tracking
    private var cacheMetadata = HashMap.HashMap<Text, CacheEntry>(100, Text.equal, Text.hash);
    
    /// Active subscriptions
    private var subscriptions = HashMap.HashMap<Text, EventSubscription>(10, Text.equal, Text.hash);
    
    /// Operation history for debugging
    private var operationHistory = Buffer.Buffer<OperationRecord>(50);
    
    /// Connection start time
    private stable var connectionStartTime: Int = 0;
    
    /// Operation record type
    public type OperationRecord = {
        operation: Text;
        key: Text;
        timestamp: Int;
        latency: Nat;
        success: Bool;
        error: ?Text;
    };
    
    // ================================
    // CONNECTION MANAGEMENT
    // ================================
    
    /// Initialize Redis connection
    public func initialize(connInfo: ConnectionInfo): async Types.AVAIResult<Text> {
        Utils.debugLog("🔄 Connecting to Redis: " # connInfo.host # ":" # Nat.toText(connInfo.port));
        
        connectionStatus := #Connecting;
        connectionInfo := ?connInfo;
        
        // Attempt connection (simulated for now)
        let connectResult = await attemptConnection(connInfo);
        switch (connectResult) {
            case (#ok(_)) {
                connectionStatus := #Connected;
                connectionStartTime := Time.now();
                Utils.debugLog("✅ Redis connected successfully");
                
                // Start health check timer
                let _ = startHealthCheck();
                
                Types.success("Redis connection established")
            };
            case (#err(error)) {
                connectionStatus := #Error(debug_show(error));
                Types.error(error)
            };
        }
    };
    
    /// Attempt Redis connection with retries
    private func attemptConnection(connInfo: ConnectionInfo): async Types.AVAIResult<Text> {
        var attempts = 0;
        var lastError: ?Types.AVAIError = null;
        
        while (attempts < REDIS_CONFIG.maxRetries) {
            attempts += 1;
            
            let result = await connectToRedis(connInfo);
            switch (result) {
                case (#ok(msg)) {
                    return Types.success(msg);
                };
                case (#err(error)) {
                    lastError := ?error;
                    if (attempts < REDIS_CONFIG.maxRetries) {
                        Utils.debugLog("🔄 Redis connection failed, retrying... (" # Nat.toText(attempts) # ")");
                        await asyncDelay(REDIS_CONFIG.retryDelay * attempts);
                    };
                };
            };
        };
        
        switch (lastError) {
            case (?error) { Types.error(error) };
            case null { Types.error(#SystemError("Redis connection failed")) };
        }
    };
    
    /// Direct Redis connection (to be implemented with actual Redis client)
    private func connectToRedis(connInfo: ConnectionInfo): async Types.AVAIResult<Text> {
        // This would implement actual Redis connection in production
        // For now, simulate successful connection
        
        if (connInfo.port == 0 or Text.size(connInfo.host) == 0) {
            return Types.error(#InvalidInput("Invalid Redis connection parameters"));
        };
        
        // Simulate connection delay
        await asyncDelay(1000);
        
        Types.success("Connected to Redis at " # connInfo.host # ":" # Nat.toText(connInfo.port))
    };
    
    /// Health check for connection monitoring
    private func startHealthCheck(): async () {
        // This would run periodically to check Redis health
        let _ = async {
            while (connectionStatus == #Connected) {
                await asyncDelay(REDIS_CONFIG.healthCheckInterval);
                let _ = await pingRedis();
            };
        };
    };
    
    /// Ping Redis to check health
    private func pingRedis(): async Types.AVAIResult<Text> {
        let startTime = Time.now();
        
        // Simulate ping operation
        await asyncDelay(10); // 10ms latency simulation
        
        let endTime = Time.now();
        let latency = Int.abs(endTime - startTime) / 1000000; // milliseconds
        
        updateOperationMetrics("PING", "health", latency, true, null);
        
        Types.success("PONG")
    };
    
    // ================================
    // CORE REDIS OPERATIONS
    // ================================
    
    /// Execute Redis operation with error handling and metrics
    public func execute(operation: RedisOperation): async Types.AVAIResult<RedisResponse> {
        if (connectionStatus != #Connected) {
            return Types.error(#SystemError("Redis not connected"));
        };
        
        let startTime = Time.now();
        let operationName = getOperationName(operation);
        let key = getOperationKey(operation);
        
        Utils.debugLog("📡 Redis " # operationName # ": " # key);
        
        let result = await executeRedisOperation(operation);
        
        let endTime = Time.now();
        let latency = Int.abs(endTime - startTime) / 1000000; // milliseconds
        
        switch (result) {
            case (#ok(response)) {
                updateOperationMetrics(operationName, key, latency, true, null);
                updateCacheMetadata(operation, response);
            };
            case (#err(error)) {
                updateOperationMetrics(operationName, key, latency, false, ?debug_show(error));
            };
        };
        
        result
    };
    
    /// Execute specific Redis operation
    private func executeRedisOperation(operation: RedisOperation): async Types.AVAIResult<RedisResponse> {
        // This would implement actual Redis operations in production
        // For now, simulate operations based on type
        
        switch (operation) {
            case (#Get(key)) {
                await simulateGetOperation(key)
            };
            case (#Set(key, value, expiration)) {
                await simulateSetOperation(key, value, expiration)
            };
            case (#Delete(key)) {
                await simulateDeleteOperation(key)
            };
            case (#Exists(key)) {
                await simulateExistsOperation(key)
            };
            case (#Increment(key)) {
                await simulateIncrementOperation(key)
            };
            case (#Decrement(key)) {
                await simulateDecrementOperation(key)
            };
            case (#ListPush(key, value)) {
                await simulateListPushOperation(key, value)
            };
            case (#ListPop(key)) {
                await simulateListPopOperation(key)
            };
            case (#ListGet(key, start, stop)) {
                await simulateListGetOperation(key, start, stop)
            };
            case (#HashSet(hash, field, value)) {
                await simulateHashSetOperation(hash, field, value)
            };
            case (#HashGet(hash, field)) {
                await simulateHashGetOperation(hash, field)
            };
            case (#HashGetAll(hash)) {
                await simulateHashGetAllOperation(hash)
            };
            case (#SetAdd(set, member)) {
                await simulateSetAddOperation(set, member)
            };
            case (#SetMembers(set)) {
                await simulateSetMembersOperation(set)
            };
            case (#Publish(channel, message)) {
                await simulatePublishOperation(channel, message)
            };
            case (#SetExpire(key, seconds)) {
                await simulateExpireOperation(key, seconds)
            };
        }
    };
    
    // ================================
    // SIMULATED OPERATIONS (Production would use actual Redis client)
    // ================================
    
    private func simulateGetOperation(key: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(5); // Simulate network latency
        
        // Check if key exists in our cache metadata
        switch (cacheMetadata.get(key)) {
            case (?entry) {
                // Check expiration
                switch (entry.expiresAt) {
                    case (?expiry) {
                        if (Time.now() > expiry) {
                            cacheMetadata.delete(key);
                            return Types.success(#NullValue);
                        };
                    };
                    case null { /* No expiration */ };
                };
                
                // Update access info
                let updatedEntry = {
                    key = entry.key;
                    value = entry.value;
                    createdAt = entry.createdAt;
                    expiresAt = entry.expiresAt;
                    accessCount = entry.accessCount + 1;
                    lastAccessed = Time.now();
                    tags = entry.tags;
                };
                cacheMetadata.put(key, updatedEntry);
                
                Types.success(#StringValue(entry.value))
            };
            case null {
                Types.success(#NullValue)
            };
        }
    };
    
    private func simulateSetOperation(key: Text, value: Text, expiration: ?Nat): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(8); // Simulate network latency
        
        let expiresAt = switch (expiration) {
            case (?seconds) { ?(Time.now() + Int.fromNat(seconds * 1000000000)) }; // Convert to nanoseconds
            case null { null };
        };
        
        let entry: CacheEntry = {
            key = key;
            value = value;
            createdAt = Time.now();
            expiresAt = expiresAt;
            accessCount = 0;
            lastAccessed = Time.now();
            tags = [];
        };
        
        cacheMetadata.put(key, entry);
        Types.success(#StringValue("OK"))
    };
    
    private func simulateDeleteOperation(key: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(6);
        
        let existed = switch (cacheMetadata.get(key)) {
            case (?_) { 
                cacheMetadata.delete(key);
                1 
            };
            case null { 0 };
        };
        
        Types.success(#IntegerValue(existed))
    };
    
    private func simulateExistsOperation(key: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(3);
        
        let exists = switch (cacheMetadata.get(key)) {
            case (?entry) {
                // Check expiration
                switch (entry.expiresAt) {
                    case (?expiry) {
                        if (Time.now() > expiry) {
                            cacheMetadata.delete(key);
                            false
                        } else { true }
                    };
                    case null { true };
                }
            };
            case null { false };
        };
        
        Types.success(#BooleanValue(exists))
    };
    
    private func simulateIncrementOperation(key: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(7);
        
        let currentValue = switch (cacheMetadata.get(key)) {
            case (?entry) {
                switch (Int.fromText(entry.value)) {
                    case (?val) { val };
                    case null { 0 }; // Default to 0 if not a number
                }
            };
            case null { 0 };
        };
        
        let newValue = currentValue + 1;
        let _ = await simulateSetOperation(key, Int.toText(newValue), null);
        
        Types.success(#IntegerValue(newValue))
    };
    
    private func simulateDecrementOperation(key: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(7);
        
        let currentValue = switch (cacheMetadata.get(key)) {
            case (?entry) {
                switch (Int.fromText(entry.value)) {
                    case (?val) { val };
                    case null { 0 };
                }
            };
            case null { 0 };
        };
        
        let newValue = currentValue - 1;
        let _ = await simulateSetOperation(key, Int.toText(newValue), null);
        
        Types.success(#IntegerValue(newValue))
    };
    
    private func simulateListPushOperation(key: Text, value: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(10);
        
        // For simulation, we'll store lists as comma-separated values
        let currentList = switch (cacheMetadata.get(key)) {
            case (?entry) { entry.value };
            case null { "" };
        };
        
        let newList = if (Text.size(currentList) == 0) {
            value
        } else {
            value # "," # currentList
        };
        
        let _ = await simulateSetOperation(key, newList, null);
        
        // Return new length (simplified)
        let length = Array.size(Text.split(newList, #char ','));
        Types.success(#IntegerValue(length))
    };
    
    private func simulateListPopOperation(key: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(9);
        
        switch (cacheMetadata.get(key)) {
            case (?entry) {
                let items = Text.split(entry.value, #char ',');
                let itemArray = Iter.toArray(items);
                
                if (itemArray.size() == 0) {
                    return Types.success(#NullValue);
                };
                
                let poppedValue = itemArray[0];
                let remainingItems = Array.tabulate<Text>(itemArray.size() - 1, func(i) = itemArray[i + 1]);
                let newList = Text.join(",", remainingItems.vals());
                
                if (Text.size(newList) == 0) {
                    cacheMetadata.delete(key);
                } else {
                    let _ = await simulateSetOperation(key, newList, null);
                };
                
                Types.success(#StringValue(poppedValue))
            };
            case null {
                Types.success(#NullValue)
            };
        }
    };
    
    private func simulateListGetOperation(key: Text, start: Int, stop: Int): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(8);
        
        switch (cacheMetadata.get(key)) {
            case (?entry) {
                let items = Text.split(entry.value, #char ',');
                let itemArray = Iter.toArray(items);
                
                if (itemArray.size() == 0) {
                    return Types.success(#ArrayValue([]));
                };
                
                // Handle negative indices (Redis-style)
                let length = Int.fromNat(itemArray.size());
                let actualStart = if (start < 0) { Int.max(0, length + start) } else { Int.min(start, length - 1) };
                let actualStop = if (stop < 0) { Int.max(0, length + stop) } else { Int.min(stop, length - 1) };
                
                if (actualStart > actualStop or actualStart >= length) {
                    return Types.success(#ArrayValue([]));
                };
                
                let startNat = Int.abs(actualStart);
                let stopNat = Int.abs(actualStop);
                let sliceSize = stopNat - startNat + 1;
                
                let slice = Array.tabulate<Text>(sliceSize, func(i) {
                    let index = startNat + i;
                    if (index < itemArray.size()) { itemArray[index] } else { "" }
                });
                
                Types.success(#ArrayValue(slice))
            };
            case null {
                Types.success(#ArrayValue([]))
            };
        }
    };
    
    private func simulateHashSetOperation(hash: Text, field: Text, value: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(12);
        
        // For simulation, store hash as JSON-like string
        let currentHash = switch (cacheMetadata.get(hash)) {
            case (?entry) { entry.value };
            case null { "{}" };
        };
        
        // Simplified hash update (in production, use proper JSON parsing)
        let newHash = "{\"" # field # "\":\"" # value # "\"}"; // Simplified
        let _ = await simulateSetOperation(hash, newHash, null);
        
        Types.success(#IntegerValue(1)) // Field was set
    };
    
    private func simulateHashGetOperation(hash: Text, field: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(8);
        
        // Simplified hash retrieval
        switch (cacheMetadata.get(hash)) {
            case (?entry) {
                // In production, properly parse JSON/hash structure
                if (Text.contains(entry.value, #text field)) {
                    Types.success(#StringValue("simulated_hash_value_" # field))
                } else {
                    Types.success(#NullValue)
                }
            };
            case null {
                Types.success(#NullValue)
            };
        }
    };
    
    private func simulateHashGetAllOperation(hash: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(15);
        
        switch (cacheMetadata.get(hash)) {
            case (?entry) {
                // Simplified - return mock hash data
                let mockHash = [
                    ("field1", "value1"),
                    ("field2", "value2"),
                    ("timestamp", Int.toText(Time.now()))
                ];
                Types.success(#HashValue(mockHash))
            };
            case null {
                Types.success(#HashValue([]))
            };
        }
    };
    
    private func simulateSetAddOperation(set: Text, member: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(10);
        
        let currentSet = switch (cacheMetadata.get(set)) {
            case (?entry) { entry.value };
            case null { "" };
        };
        
        // Check if member already exists
        let members = Text.split(currentSet, #char ',');
        let memberExists = Array.find<Text>(Iter.toArray(members), func(m) = m == member) != null;
        
        if (memberExists) {
            Types.success(#IntegerValue(0)) // Member already existed
        } else {
            let newSet = if (Text.size(currentSet) == 0) {
                member
            } else {
                currentSet # "," # member
            };
            
            let _ = await simulateSetOperation(set, newSet, null);
            Types.success(#IntegerValue(1)) // Member was added
        }
    };
    
    private func simulateSetMembersOperation(set: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(12);
        
        switch (cacheMetadata.get(set)) {
            case (?entry) {
                if (Text.size(entry.value) == 0) {
                    Types.success(#ArrayValue([]))
                } else {
                    let members = Text.split(entry.value, #char ',');
                    Types.success(#ArrayValue(Iter.toArray(members)))
                }
            };
            case null {
                Types.success(#ArrayValue([]))
            };
        }
    };
    
    private func simulatePublishOperation(channel: Text, message: Text): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(15);
        
        // Notify subscribers (if any)
        switch (subscriptions.get(channel)) {
            case (?subscription) {
                subscription.callback(channel, message);
                
                // Update subscription stats
                let updatedSubscription = {
                    channel = subscription.channel;
                    pattern = subscription.pattern;
                    callback = subscription.callback;
                    subscriptionTime = subscription.subscriptionTime;
                    messageCount = subscription.messageCount + 1;
                };
                subscriptions.put(channel, updatedSubscription);
            };
            case null { /* No subscribers */ };
        };
        
        Types.success(#IntegerValue(1)) // Number of subscribers that received the message
    };
    
    private func simulateExpireOperation(key: Text, seconds: Nat): async Types.AVAIResult<RedisResponse> {
        await asyncDelay(5);
        
        switch (cacheMetadata.get(key)) {
            case (?entry) {
                let expiresAt = Time.now() + Int.fromNat(seconds * 1000000000); // Convert to nanoseconds
                let updatedEntry = {
                    key = entry.key;
                    value = entry.value;
                    createdAt = entry.createdAt;
                    expiresAt = ?expiresAt;
                    accessCount = entry.accessCount;
                    lastAccessed = entry.lastAccessed;
                    tags = entry.tags;
                };
                cacheMetadata.put(key, updatedEntry);
                Types.success(#BooleanValue(true))
            };
            case null {
                Types.success(#BooleanValue(false))
            };
        }
    };
    
    // ================================
    // HIGH-LEVEL OPERATIONS
    // ================================
    
    /// Store agent state with automatic namespacing
    public func storeAgentState(agentId: Text, state: Text, ttl: ?Nat): async Types.AVAIResult<RedisResponse> {
        let key = REDIS_CONFIG.keyPrefix # NAMESPACES.agents # agentId;
        await execute(#Set(key, state, ttl))
    };
    
    /// Retrieve agent state
    public func getAgentState(agentId: Text): async Types.AVAIResult<RedisResponse> {
        let key = REDIS_CONFIG.keyPrefix # NAMESPACES.agents # agentId;
        await execute(#Get(key))
    };
    
    /// Store session data
    public func storeSessionData(sessionId: Text, data: Text, ttl: ?Nat): async Types.AVAIResult<RedisResponse> {
        let key = REDIS_CONFIG.keyPrefix # NAMESPACES.sessions # sessionId;
        await execute(#Set(key, data, ttl))
    };
    
    /// Cache report data with tags
    public func cacheReport(reportId: Text, content: Text, tags: [Text], ttl: ?Nat): async Types.AVAIResult<RedisResponse> {
        let key = REDIS_CONFIG.keyPrefix # NAMESPACES.reports # reportId;
        
        // Store main content
        let storeResult = await execute(#Set(key, content, ttl));
        
        // Update cache metadata with tags
        switch (storeResult) {
            case (#ok(_)) {
                switch (cacheMetadata.get(key)) {
                    case (?entry) {
                        let updatedEntry = {
                            key = entry.key;
                            value = entry.value;
                            createdAt = entry.createdAt;
                            expiresAt = entry.expiresAt;
                            accessCount = entry.accessCount;
                            lastAccessed = entry.lastAccessed;
                            tags = tags;
                        };
                        cacheMetadata.put(key, updatedEntry);
                    };
                    case null { /* Entry not found */ };
                };
            };
            case (#err(_)) { /* Store failed */ };
        };
        
        storeResult
    };
    
    /// Store learning data
    public func storeLearningData(dataId: Text, data: Text, ttl: ?Nat): async Types.AVAIResult<RedisResponse> {
        let key = REDIS_CONFIG.keyPrefix # NAMESPACES.learning # dataId;
        await execute(#Set(key, data, ttl))
    };
    
    /// Store metrics data
    public func storeMetrics(metricName: Text, value: Text, ttl: ?Nat): async Types.AVAIResult<RedisResponse> {
        let key = REDIS_CONFIG.keyPrefix # NAMESPACES.metrics # metricName;
        await execute(#Set(key, value, ttl))
    };
    
    /// Increment counter metric
    public func incrementMetric(metricName: Text): async Types.AVAIResult<RedisResponse> {
        let key = REDIS_CONFIG.keyPrefix # NAMESPACES.metrics # metricName;
        await execute(#Increment(key))
    };
    
    /// Add task to queue
    public func enqueueTask(queueName: Text, taskData: Text): async Types.AVAIResult<RedisResponse> {
        let key = REDIS_CONFIG.keyPrefix # NAMESPACES.tasks # queueName;
        await execute(#ListPush(key, taskData))
    };
    
    /// Get next task from queue
    public func dequeueTask(queueName: Text): async Types.AVAIResult<RedisResponse> {
        let key = REDIS_CONFIG.keyPrefix # NAMESPACES.tasks # queueName;
        await execute(#ListPop(key))
    };
    
    /// Publish event to channel
    public func publishEvent(eventType: Text, eventData: Text): async Types.AVAIResult<RedisResponse> {
        let channel = REDIS_CONFIG.keyPrefix # NAMESPACES.events # eventType;
        await execute(#Publish(channel, eventData))
    };
    
    /// Subscribe to event channel
    public func subscribeToEvents(
        eventType: Text, 
        callback: (Text, Text) -> ()
    ): async Types.AVAIResult<Text> {
        let channel = REDIS_CONFIG.keyPrefix # NAMESPACES.events # eventType;
        
        let subscription: EventSubscription = {
            channel = channel;
            pattern = null;
            callback = callback;
            subscriptionTime = Time.now();
            messageCount = 0;
        };
        
        subscriptions.put(channel, subscription);
        Utils.debugLog("📡 Subscribed to Redis channel: " # channel);
        
        Types.success("Subscribed to " # eventType # " events")
    };
    
    // ================================
    // UTILITY FUNCTIONS
    // ================================
    
    /// Get operation name from RedisOperation
    private func getOperationName(operation: RedisOperation): Text {
        switch (operation) {
            case (#Get(_)) { "GET" };
            case (#Set(_, _, _)) { "SET" };
            case (#Delete(_)) { "DEL" };
            case (#Exists(_)) { "EXISTS" };
            case (#Increment(_)) { "INCR" };
            case (#Decrement(_)) { "DECR" };
            case (#ListPush(_, _)) { "LPUSH" };
            case (#ListPop(_)) { "LPOP" };
            case (#ListGet(_, _, _)) { "LRANGE" };
            case (#HashSet(_, _, _)) { "HSET" };
            case (#HashGet(_, _)) { "HGET" };
            case (#HashGetAll(_)) { "HGETALL" };
            case (#SetAdd(_, _)) { "SADD" };
            case (#SetMembers(_)) { "SMEMBERS" };
            case (#Publish(_, _)) { "PUBLISH" };
            case (#SetExpire(_, _)) { "EXPIRE" };
        }
    };
    
    /// Get key from RedisOperation
    private func getOperationKey(operation: RedisOperation): Text {
        switch (operation) {
            case (#Get(key)) { key };
            case (#Set(key, _, _)) { key };
            case (#Delete(key)) { key };
            case (#Exists(key)) { key };
            case (#Increment(key)) { key };
            case (#Decrement(key)) { key };
            case (#ListPush(key, _)) { key };
            case (#ListPop(key)) { key };
            case (#ListGet(key, _, _)) { key };
            case (#HashSet(hash, _, _)) { hash };
            case (#HashGet(hash, _)) { hash };
            case (#HashGetAll(hash)) { hash };
            case (#SetAdd(set, _)) { set };
            case (#SetMembers(set)) { set };
            case (#Publish(channel, _)) { channel };
            case (#SetExpire(key, _)) { key };
        }
    };
    
    /// Update operation metrics
    private func updateOperationMetrics(
        operation: Text, 
        key: Text, 
        latency: Nat, 
        success: Bool,
        error: ?Text
    ) {
        // Update global metrics
        let newTotal = metrics.totalOperations + 1;
        let newSuccessful = if (success) { metrics.successfulOperations + 1 } else { metrics.successfulOperations };
        let newFailed = if (success) { metrics.failedOperations } else { metrics.failedOperations + 1 };
        let newAvgLatency = (metrics.averageLatency * metrics.totalOperations + latency) / newTotal;
        
        let newHitRate = Float.fromInt(newSuccessful) / Float.fromInt(newTotal);
        let newMissRate = 1.0 - newHitRate;
        
        metrics := {
            totalOperations = newTotal;
            successfulOperations = newSuccessful;
            failedOperations = newFailed;
            averageLatency = newAvgLatency;
            lastOperationTime = Time.now();
            connectionUptime = Time.now() - connectionStartTime;
            hitRate = newHitRate;
            missRate = newMissRate;
        };
        
        // Add to operation history
        let record: OperationRecord = {
            operation = operation;
            key = key;
            timestamp = Time.now();
            latency = latency;
            success = success;
            error = error;
        };
        
        operationHistory.add(record);
        
        // Keep history size manageable
        if (operationHistory.size() > 100) {
            let _ = operationHistory.removeLast();
        };
    };
    
    /// Update cache metadata after operations
    private func updateCacheMetadata(operation: RedisOperation, response: RedisResponse) {
        // This function would update cache metadata based on the operation
        // For now, it's a placeholder for production implementation
    };
    
    /// Async delay function
    private func asyncDelay(milliseconds: Nat): async () {
        // This would implement actual async delay in production
        // For now, it's a placeholder
    };
    
    // ================================
    // MONITORING AND DIAGNOSTICS
    // ================================
    
    /// Get connection status and metrics
    public query func getStatus(): async {
        status: ConnectionStatus;
        metrics: RedisMetrics;
        activeSubscriptions: Nat;
        cacheSize: Nat;
        operationHistory: [OperationRecord];
    } {
        {
            status = connectionStatus;
            metrics = metrics;
            activeSubscriptions = subscriptions.size();
            cacheSize = cacheMetadata.size();
            operationHistory = Buffer.toArray(operationHistory);
        }
    };
    
    /// Get cache statistics
    public query func getCacheStats(): async {
        totalEntries: Nat;
        expiredEntries: Nat;
        averageAccessCount: Float;
        mostAccessedKeys: [(Text, Nat)];
        oldestEntries: [(Text, Int)];
    } {
        var totalEntries = 0;
        var expiredEntries = 0;
        var totalAccess = 0;
        var accessCounts = Buffer.Buffer<(Text, Nat)>(10);
        var oldestEntries = Buffer.Buffer<(Text, Int)>(10);
        
        let now = Time.now();
        
        for ((key, entry) in cacheMetadata.entries()) {
            totalEntries += 1;
            totalAccess += entry.accessCount;
            
            // Check if expired
            switch (entry.expiresAt) {
                case (?expiry) {
                    if (now > expiry) {
                        expiredEntries += 1;
                    };
                };
                case null { /* No expiration */ };
            };
            
            accessCounts.add((key, entry.accessCount));
            oldestEntries.add((key, entry.createdAt));
        };
        
        let averageAccess = if (totalEntries > 0) {
            Float.fromInt(totalAccess) / Float.fromInt(totalEntries)
        } else { 0.0 };
        
        // Sort by access count (simplified - in production, use proper sorting)
        let accessArray = Buffer.toArray(accessCounts);
        let oldestArray = Buffer.toArray(oldestEntries);
        
        {
            totalEntries = totalEntries;
            expiredEntries = expiredEntries;
            averageAccessCount = averageAccess;
            mostAccessedKeys = Array.subArray(accessArray, 0, Nat.min(10, accessArray.size()));
            oldestEntries = Array.subArray(oldestArray, 0, Nat.min(10, oldestArray.size()));
        }
    };
    
    /// Clean up expired entries
    public func cleanupExpiredEntries(): async Nat {
        var cleanedCount = 0;
        let now = Time.now();
        let keysToRemove = Buffer.Buffer<Text>(10);
        
        for ((key, entry) in cacheMetadata.entries()) {
            switch (entry.expiresAt) {
                case (?expiry) {
                    if (now > expiry) {
                        keysToRemove.add(key);
                    };
                };
                case null { /* No expiration */ };
            };
        };
        
        for (key in keysToRemove.vals()) {
            cacheMetadata.delete(key);
            cleanedCount += 1;
        };
        
        if (cleanedCount > 0) {
            Utils.debugLog("🧹 Cleaned up " # Nat.toText(cleanedCount) # " expired Redis entries");
        };
        
        cleanedCount
    };
    
    /// Get subscription information
    public query func getSubscriptions(): async [(Text, EventSubscription)] {
        subscriptions.entries() |> Iter.toArray(_)
    };
}
