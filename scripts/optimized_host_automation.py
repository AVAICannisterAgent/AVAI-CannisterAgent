#!/usr/bin/env python3
"""
Optimized Host Automation for AVAI
Monitors Redis queue and triggers host processes efficiently
"""

import asyncio
import json
import logging
import redis
import time
import os
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class OptimizedHostAutomation:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.redis_host = os.getenv('REDIS_HOST', 'redis')
        self.redis_port = int(os.getenv('REDIS_PORT', '6379'))
        self.check_interval = int(os.getenv('CHECK_INTERVAL', '30'))
        self.running = False
        self.last_queue_check = 0
        
    def init_redis(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            self.redis_client.ping()
            logger.info("✅ Redis connected")
            return True
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {e}")
            return False
    
    async def monitor_queue(self):
        """Monitor the prompt queue for new items"""
        if not self.redis_client:
            return
        
        while self.running:
            try:
                # Check queue size
                queue_size = self.redis_client.zcard('avai:prompt_queue')
                
                if queue_size > 0:
                    # Get the latest prompt
                    latest_prompts = self.redis_client.zrevrange('avai:prompt_queue', 0, 0, withscores=True)
                    
                    if latest_prompts:
                        prompt_data, score = latest_prompts[0]
                        try:
                            prompt_info = json.loads(prompt_data)
                            logger.info(f"📋 Queue has {queue_size} items, latest: {prompt_info.get('id', 'unknown')}")
                            
                            # Send trigger to host (could be HTTP request, file, etc.)
                            await self.trigger_host_processing(prompt_info)
                            
                        except json.JSONDecodeError:
                            logger.warning("Invalid JSON in queue item")
                
                # Update last check time
                self.last_queue_check = time.time()
                
                # Set trigger signal for host scripts
                self.redis_client.set('avai:host:trigger', str(int(time.time())), ex=60)
                
                await asyncio.sleep(self.check_interval)
                
            except redis.ConnectionError:
                logger.warning("Redis connection lost, attempting reconnect...")
                await asyncio.sleep(5)
                self.init_redis()
            except Exception as e:
                logger.error(f"Error in queue monitor: {e}")
                await asyncio.sleep(10)
    
    async def trigger_host_processing(self, prompt_info):
        """Trigger host processing for a prompt"""
        try:
            # Set specific trigger for this prompt
            trigger_data = {
                'prompt_id': prompt_info.get('id'),
                'timestamp': time.time(),
                'action': 'process_prompt',
                'priority': prompt_info.get('priority', 5)
            }
            
            self.redis_client.set(
                'avai:host:active_trigger',
                json.dumps(trigger_data),
                ex=300  # 5 minute expiry
            )
            
            logger.info(f"🎯 Host trigger set for prompt: {prompt_info.get('id')}")
            
        except Exception as e:
            logger.error(f"Failed to set host trigger: {e}")
    
    async def health_monitor(self):
        """Periodic health reporting"""
        while self.running:
            try:
                health_data = {
                    'status': 'healthy',
                    'last_queue_check': self.last_queue_check,
                    'timestamp': time.time(),
                    'service': 'host_automation'
                }
                
                self.redis_client.set(
                    'avai:automation:health',
                    json.dumps(health_data),
                    ex=120  # 2 minute expiry
                )
                
                await asyncio.sleep(60)  # Health update every minute
                
            except Exception as e:
                logger.error(f"Health monitor error: {e}")
                await asyncio.sleep(60)
    
    async def run(self):
        """Main entry point"""
        logger.info("🚀 Starting Optimized Host Automation")
        
        if not self.init_redis():
            return
        
        self.running = True
        
        try:
            # Run both monitors concurrently
            await asyncio.gather(
                self.monitor_queue(),
                self.health_monitor()
            )
        except KeyboardInterrupt:
            logger.info("👋 Shutting down gracefully")
        finally:
            self.running = False
            if self.redis_client:
                self.redis_client.close()

if __name__ == "__main__":
    automation = OptimizedHostAutomation()
    asyncio.run(automation.run())
