"""
Redis-Canister Bridge
Connects Redis queue system with Internet Computer canisters
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)

class RedisCanisterBridge:
    """Bridge between Redis and IC canisters for the AVAI system"""
    
    def __init__(self, redis_client=None, canister_manager=None):
        self.redis_client = redis_client
        self.canister_manager = canister_manager
        self.bridge_active = False
        
    async def start_bridge(self):
        """Start the Redis-Canister bridge"""
        try:
            logger.info("🌉 Starting Redis-Canister bridge...")
            self.bridge_active = True
            
            # Start background task for processing canister requests
            asyncio.create_task(self._process_canister_requests())
            
            logger.info("✅ Redis-Canister bridge started successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to start Redis-Canister bridge: {e}")
            return False
    
    async def stop_bridge(self):
        """Stop the Redis-Canister bridge"""
        try:
            logger.info("🛑 Stopping Redis-Canister bridge...")
            self.bridge_active = False
            logger.info("✅ Redis-Canister bridge stopped")
            
        except Exception as e:
            logger.error(f"❌ Error stopping bridge: {e}")
    
    async def _process_canister_requests(self):
        """Process requests from Redis to canisters"""
        while self.bridge_active:
            try:
                # Check for canister requests in Redis
                if self.redis_client:
                    # Check for canister deployment requests
                    deploy_request = await self._check_deploy_queue()
                    if deploy_request:
                        await self._handle_deploy_request(deploy_request)
                    
                    # Check for canister query requests
                    query_request = await self._check_query_queue()
                    if query_request:
                        await self._handle_query_request(query_request)
                
                await asyncio.sleep(1)  # Prevent busy loop
                
            except Exception as e:
                logger.error(f"❌ Error processing canister requests: {e}")
                await asyncio.sleep(5)
    
    async def _check_deploy_queue(self) -> Optional[Dict[str, Any]]:
        """Check Redis for canister deployment requests"""
        try:
            if not self.redis_client:
                return None
                
            # Pop deployment request from queue
            request = await self.redis_client.rpop("avai:canister:deploy_queue")
            if request:
                return json.loads(request)
                
        except Exception as e:
            logger.error(f"❌ Error checking deploy queue: {e}")
        
        return None
    
    async def _check_query_queue(self) -> Optional[Dict[str, Any]]:
        """Check Redis for canister query requests"""
        try:
            if not self.redis_client:
                return None
                
            # Pop query request from queue
            request = await self.redis_client.rpop("avai:canister:query_queue")
            if request:
                return json.loads(request)
                
        except Exception as e:
            logger.error(f"❌ Error checking query queue: {e}")
        
        return None
    
    async def _handle_deploy_request(self, request: Dict[str, Any]):
        """Handle canister deployment request"""
        try:
            logger.info(f"🚀 Processing canister deployment request: {request.get('canister_name')}")
            
            if self.canister_manager:
                result = await self.canister_manager.deploy_canister(request)
                
                # Send result back to Redis
                await self._send_result_to_redis(request.get('request_id'), result)
            
        except Exception as e:
            logger.error(f"❌ Error handling deploy request: {e}")
    
    async def _handle_query_request(self, request: Dict[str, Any]):
        """Handle canister query request"""
        try:
            logger.info(f"🔍 Processing canister query request: {request.get('method')}")
            
            if self.canister_manager:
                result = await self.canister_manager.query_canister(request)
                
                # Send result back to Redis
                await self._send_result_to_redis(request.get('request_id'), result)
            
        except Exception as e:
            logger.error(f"❌ Error handling query request: {e}")
    
    async def _send_result_to_redis(self, request_id: str, result: Dict[str, Any]):
        """Send canister operation result back to Redis"""
        try:
            if not self.redis_client or not request_id:
                return
            
            result_message = {
                "request_id": request_id,
                "result": result,
                "timestamp": datetime.now().isoformat(),
                "source": "canister_bridge"
            }
            
            # Send to results queue
            await self.redis_client.lpush(
                "avai:canister:results", 
                json.dumps(result_message)
            )
            
            logger.info(f"📤 Sent canister result to Redis for request: {request_id}")
            
        except Exception as e:
            logger.error(f"❌ Error sending result to Redis: {e}")

    async def queue_canister_request(self, request_type: str, request_data: Dict[str, Any]) -> str:
        """Queue a canister request via Redis"""
        try:
            request_id = f"canister_req_{int(datetime.now().timestamp() * 1000)}"
            
            request = {
                "request_id": request_id,
                "type": request_type,
                "data": request_data,
                "timestamp": datetime.now().isoformat()
            }
            
            queue_name = f"avai:canister:{request_type}_queue"
            
            if self.redis_client:
                await self.redis_client.lpush(queue_name, json.dumps(request))
                logger.info(f"📤 Queued canister {request_type} request: {request_id}")
            
            return request_id
            
        except Exception as e:
            logger.error(f"❌ Error queueing canister request: {e}")
            return ""
