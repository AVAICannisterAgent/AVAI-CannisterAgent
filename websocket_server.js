const WebSocket = require('ws');
const redis = require('redis');
const express = require('express');
const cors = require('cors');

class OptimizedWebSocketServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 8080;
        this.redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
        
        // Initialize Redis clients
        this.redisClient = redis.createClient({ url: this.redisUrl });
        this.subscriber = redis.createClient({ url: this.redisUrl });
        
        // WebSocket server
        this.wss = null;
        
        // Metrics
        this.stats = {
            connections: 0,
            messagesReceived: 0,
            messagesSent: 0,
            startTime: Date.now()
        };
        
        this.setupExpress();
    }
    
    setupExpress() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                uptime: Date.now() - this.stats.startTime,
                connections: this.stats.connections,
                ...this.stats
            });
        });
        
        // Metrics endpoint
        this.app.get('/metrics', (req, res) => {
            res.json(this.stats);
        });
    }
    
    async start() {
        try {
            // Connect to Redis
            await this.redisClient.connect();
            await this.subscriber.connect();
            
            console.log('✅ Connected to Redis');
            
            // Start Express server
            const server = this.app.listen(this.port, () => {
                console.log(`🚀 HTTP server running on port ${this.port}`);
            });
            
            // Create WebSocket server
            this.wss = new WebSocket.Server({ server });
            
            // Handle WebSocket connections
            this.wss.on('connection', (ws, req) => {
                this.stats.connections++;
                console.log(`📱 New WebSocket connection. Total: ${this.stats.connections}`);
                
                // Send welcome message
                ws.send(JSON.stringify({
                    type: 'connection',
                    message: 'Connected to AVAI WebSocket server',
                    timestamp: Date.now()
                }));
                
                // Handle messages from client
                ws.on('message', async (message) => {
                    try {
                        this.stats.messagesReceived++;
                        console.log(`📥 Raw message received: ${message}`);
                        
                        let data;
                        let promptContent = null;
                        
                        // Try to parse as JSON first
                        try {
                            data = JSON.parse(message);
                            console.log(`📄 Parsed JSON data:`, data);
                            
                            // Handle different message formats
                            if (data.type === 'prompt' && data.content) {
                                promptContent = data.content;
                            } else if (data.type === 'message' && data.content) {
                                promptContent = data.content;
                            } else if (data.type === 'chat_message' && data.message) {
                                promptContent = data.message;
                            } else if (data.prompt) {
                                promptContent = data.prompt;
                            } else if (data.message) {
                                promptContent = data.message;
                            } else if (data.type === 'ping') {
                                // Handle ping messages
                                ws.send(JSON.stringify({
                                    type: 'pong',
                                    timestamp: Date.now()
                                }));
                                return;
                            }
                        } catch (parseError) {
                            // If not JSON, treat as plain text prompt
                            promptContent = message.toString();
                            console.log(`📝 Treating as plain text prompt: ${promptContent}`);
                        }
                        
                        if (promptContent && promptContent.trim() && promptContent !== 'ping') {
                            // Store prompt in Redis queue using ZSET for consistency with Python code
                            const promptData = {
                                id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                prompt: promptContent,
                                priority: Date.now(), // Use timestamp as priority for FIFO
                                created_at: new Date().toISOString(),
                                metadata: {
                                    client_id: clientId,
                                    source: connectionType
                                },
                                status: 'pending'
                            };
                            
                            // Use ZADD for sorted set (consistent with Python ZCARD operations)
                            await this.redisClient.zAdd('avai:prompt_queue', [{
                                score: promptData.priority,
                                value: JSON.stringify(promptData)
                            }]);
                            console.log(`✅ Prompt queued: ${promptContent.substring(0, 50)}...`);
                            
                            // Send acknowledgment
                            ws.send(JSON.stringify({
                                type: 'prompt_received',
                                message: 'Prompt received and queued for processing',
                                prompt: promptContent,
                                timestamp: Date.now()
                            }));
                        } else {
                            console.log(`⚠️ No valid prompt found in message:`, data || message);
                        }
                        
                    } catch (error) {
                        console.error('❌ Error handling message:', error);
                        console.error('❌ Error details:', error.stack);
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Failed to process message',
                            error: error.message,
                            timestamp: Date.now()
                        }));
                    }
                });
                
                // Handle disconnection
                ws.on('close', () => {
                    this.stats.connections--;
                    console.log(`📱 WebSocket disconnected. Total: ${this.stats.connections}`);
                });
                
                // Handle errors
                ws.on('error', (error) => {
                    console.error('❌ WebSocket error:', error);
                });
            });
            
            // Subscribe to Redis for AI responses
            await this.subscriber.subscribe('avai:ai_response', (message) => {
                try {
                    const responseData = JSON.parse(message);
                    console.log(`📥 AI response received:`, responseData);
                    
                    // Format response for frontend compatibility
                    const formattedResponse = {
                        type: 'ai_response',
                        payload: {
                            response: responseData.response,
                            timestamp: responseData.timestamp,
                            original_prompt: responseData.original_prompt,
                            status: responseData.status
                        },
                        data: responseData,  // Include original data as well
                        timestamp: Date.now()
                    };
                    
                    console.log(`📤 Broadcasting formatted response to ${this.wss.clients.size} clients`);
                    
                    // Broadcast to all connected clients
                    this.wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(formattedResponse));
                            this.stats.messagesSent++;
                        }
                    });
                    
                    console.log(`✅ Response broadcasted successfully`);
                    
                } catch (error) {
                    console.error('❌ Error broadcasting response:', error);
                    console.error('❌ Error details:', error.stack);
                }
            });
            
            console.log('🌐 WebSocket server started successfully');
            console.log(`📊 Listening on port ${this.port}`);
            
        } catch (error) {
            console.error('❌ Failed to start WebSocket server:', error);
            process.exit(1);
        }
    }
}

// Start server
const server = new OptimizedWebSocketServer();
server.start();
