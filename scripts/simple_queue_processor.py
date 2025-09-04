#!/usr/bin/env python3
"""
Simple Automated Queue Processor - Works with existing setup
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

import redis

# Configure logging without Unicode
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

class SimpleQueueProcessor:
    def __init__(self):
        self.redis_host = 'localhost'
        self.redis_port = 6379
        self.check_interval = 10
        self.automation_key = 'avai:automation:trigger'
        self.queue_key = 'avai:prompt_queue'
        self.running = True
        
        # Path to main_enhanced.py
        self.project_root = Path(__file__).parent.parent
        self.main_enhanced_path = self.project_root / 'main_enhanced.py'
        
        logger.info(f"[INIT] Project root: {self.project_root}")
        logger.info(f"[INIT] Main enhanced path: {self.main_enhanced_path}")
        
    def connect_redis(self):
        """Connect to Redis"""
        try:
            client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                decode_responses=True,
                socket_connect_timeout=5
            )
            client.ping()
            logger.info(f"[SUCCESS] Connected to Redis at {self.redis_host}:{self.redis_port}")
            return client
        except Exception as e:
            logger.error(f"[ERROR] Redis connection failed: {e}")
            return None
            
    def check_automation_trigger(self, client):
        """Check for Docker automation triggers"""
        try:
            action = client.get(self.automation_key)
            if action:
                logger.info(f"[TRIGGER] Received automation trigger: {action}")
                # Clear the trigger after reading
                client.delete(self.automation_key)
                return True
            return False
        except Exception as e:
            logger.error(f"[ERROR] Failed to check automation trigger: {e}")
            return False
    
    def check_queue_size(self, client):
        """Check the current queue size"""
        try:
            size = client.zcard(self.queue_key)
            return size
        except Exception as e:
            logger.error(f"[ERROR] Failed to check queue size: {e}")
            return 0
    
    def run_main_enhanced(self):
        """Run main_enhanced.py subprocess"""
        logger.info("[LAUNCH] Starting main_enhanced.py queue processing...")
        
        try:
            # Set environment to handle Unicode properly in Windows
            env = os.environ.copy()
            env['PYTHONIOENCODING'] = 'utf-8'
            
            # Run main_enhanced.py with correct arguments and environment
            result = subprocess.run(
                [sys.executable, str(self.main_enhanced_path), '--queue-only'],
                cwd=str(self.project_root),
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout
                encoding='utf-8',
                errors='replace',
                env=env
            )
            
            if result.returncode == 0:
                logger.info("[SUCCESS] main_enhanced.py completed successfully")
                return True
            else:
                logger.error(f"[ERROR] Process failed with exit code {result.returncode}")
                if result.stderr:
                    # Log only first 500 chars to avoid spam
                    error_preview = result.stderr[:500]
                    logger.error(f"[ERROR] Error preview: {error_preview}...")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error("[ERROR] main_enhanced.py timeout after 5 minutes")
            return False
        except Exception as e:
            logger.error(f"[ERROR] Failed to run main_enhanced.py: {e}")
            return False
    
    def run_monitor_loop(self):
        """Main monitoring loop"""
        logger.info("[MONITOR] Starting automated queue monitoring...")
        
        # Connect to Redis
        redis_client = self.connect_redis()
        if not redis_client:
            logger.error("[ERROR] Cannot start without Redis connection")
            return
            
        consecutive_failures = 0
        max_failures = 5
        
        while self.running:
            try:
                # Check for automation triggers from Docker services
                trigger_received = self.check_automation_trigger(redis_client)
                
                # Check queue size
                queue_size = self.check_queue_size(redis_client)
                
                # Decide whether to process
                should_process = False
                
                if trigger_received:
                    logger.info("[TRIGGER] Processing due to automation trigger")
                    should_process = True
                elif queue_size > 0:
                    logger.info(f"[QUEUE] Found {queue_size} items in queue")
                    should_process = True
                
                # Process if needed
                if should_process:
                    success = self.run_main_enhanced()
                    if success:
                        consecutive_failures = 0
                        logger.info("[SUCCESS] Processing cycle completed successfully")
                    else:
                        consecutive_failures += 1
                        logger.error(f"[ERROR] Processing failed ({consecutive_failures}/{max_failures})")
                        
                        if consecutive_failures >= max_failures:
                            logger.error("[CRITICAL] Too many consecutive failures, stopping")
                            break
                else:
                    # Reset failure count on successful checks
                    consecutive_failures = 0
                    logger.info(f"[CHECK] Queue empty ({queue_size} items), waiting...")
                
                # Regular check interval
                time.sleep(self.check_interval)
                
            except KeyboardInterrupt:
                logger.info("[STOP] Shutting down due to keyboard interrupt...")
                break
            except Exception as e:
                logger.error(f"[ERROR] Error in monitoring loop: {e}")
                consecutive_failures += 1
                time.sleep(self.check_interval * 2)
        
        # Cleanup
        try:
            redis_client.close()
            logger.info("[CLEANUP] Redis connection closed")
        except:
            pass
            
        logger.info("[CLEANUP] Automated processor stopped")

def main():
    """Main function"""
    logger.info("[START] AVAI Simple Automated Queue Processor")
    
    processor = SimpleQueueProcessor()
    processor.run_monitor_loop()

if __name__ == "__main__":
    main()
