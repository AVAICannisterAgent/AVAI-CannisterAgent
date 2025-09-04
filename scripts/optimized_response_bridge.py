#!/usr/bin/env python3
"""
Optimized Response Bridge for AVAI WebSocket System
Handles Redis queue to WebSocket forwarding with minimal overhead
"""

import asyncio
import json
import logging
import redis
import websockets
import os
import time
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.WARNING,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class OptimizedResponseBridge:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.websocket_url = os.getenv('WEBSOCKET_URL', 'ws://websocket-server:8080/ws')
        self.redis_host = os.getenv('REDIS_HOST', 'redis')
        self.redis_port = int(os.getenv('REDIS_PORT', '6379'))
        self.client_id = f"response_bridge_{int(time.time())}"
        self.running = False
        
    def init_redis(self):
        """Initialize Redis connection with retries"""
        max_retries = 5
        for attempt in range(max_retries):
            try:
                self.redis_client = redis.Redis(
                    host=self.redis_host,
                    port=self.redis_port,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True
                )
                self.redis_client.ping()
                logger.info("✅ Redis connected")
                return True
            except Exception as e:
                logger.warning(f"Redis connection attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
        
        logger.error("❌ Failed to connect to Redis after all retries")
        return False
    
    async def consume_responses(self):
        """Main loop to consume responses from Redis and forward via WebSocket"""
        if not self.redis_client:
            logger.error("Redis client not initialized")
            return
        
        logger.info("🔄 Starting response consumer")
        
        while self.running:
            try:
                # Non-blocking check for responses
                response = self.redis_client.brpop(['avai:queue:responses'], timeout=5)
                
                if response:
                    _, message_data = response
                    try:
                        response_data = json.loads(message_data)
                        await self.forward_response(response_data)
                    except json.JSONDecodeError as e:
                        logger.warning(f"Invalid JSON in response queue: {e}")
                    except Exception as e:
                        logger.error(f"Error processing response: {e}")
                        
            except redis.TimeoutError:
                continue  # Normal timeout, keep listening
            except redis.ConnectionError as e:
                logger.warning(f"Redis connection lost: {e}")
                await asyncio.sleep(2)
                if not self.init_redis():
                    break
            except Exception as e:
                logger.error(f"Unexpected error in consumer: {e}")
                await asyncio.sleep(1)
    
    async def forward_response(self, response_data):
        """Forward response to WebSocket server"""
        try:
            ws_url = f"{self.websocket_url}?type=logger&client_id={self.client_id}"
            
            async with websockets.connect(ws_url, timeout=10) as websocket:
                message = {
                    "type": "ai_response",
                    "payload": response_data.get("payload", response_data),
                    "timestamp": response_data.get("timestamp", time.time()),
                    "source": "response_bridge",
                    "client_id": response_data.get("client_id")
                }
                
                await websocket.send(json.dumps(message))
                logger.info(f"📤 Response forwarded: {response_data.get('id', 'unknown')}")
                
        except websockets.exceptions.ConnectionClosed:
            logger.warning("WebSocket connection closed during forward")
        except Exception as e:
            logger.error(f"Failed to forward response: {e}")
    
    async def run(self):
        """Main entry point"""
        logger.info("🚀 Starting Optimized Response Bridge")
        
        if not self.init_redis():
            return
        
        self.running = True
        
        try:
            await self.consume_responses()
        except KeyboardInterrupt:
            logger.info("👋 Shutting down gracefully")
        finally:
            self.running = False
            if self.redis_client:
                self.redis_client.close()

if __name__ == "__main__":
    bridge = OptimizedResponseBridge()
    asyncio.run(bridge.run())
