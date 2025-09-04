#!/usr/bin/env python3
"""
AVAI Automated Queue Processor - Unicode-Safe Version
Continuously monitors Redis queue and triggers main_enhanced.py processing
"""

import asyncio
import logging
import os
import signal
import subprocess
import sys
import time
import traceback
from datetime import datetime
from pathlib import Path

import redis.asyncio as redis_async
import redis

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class AutomatedQueueProcessor:
    def __init__(self):
        self.redis_host = 'localhost'
        self.redis_port = 6379
        self.redis_client = None
        self.check_interval = 10  # seconds
        self.automation_key = 'avai:automation:trigger'
        self.queue_key = 'avai:prompt_queue'
        self.worker_status_key = 'avai:automation:worker_status'
        self.running = True
        
        # Path to main_enhanced.py
        self.project_root = Path(__file__).parent.parent
        self.main_enhanced_path = self.project_root / 'main_enhanced.py'
        
        logger.info(f"[INIT] Project root: {self.project_root}")
        logger.info(f"[INIT] Main enhanced path: {self.main_enhanced_path}")
        
        # Process tracking
        self.current_process = None
        self.last_processing_time = None
        
    async def connect_redis(self):
        """Connect to Redis"""
        try:
            self.redis_client = redis_async.Redis(
                host=self.redis_host,
                port=self.redis_port,
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Test connection
            ping_result = await self.redis_client.ping()
            logger.info(f"[SUCCESS] Connected to Redis at {self.redis_host}:{self.redis_port}")
            return True
        except Exception as e:
            logger.error(f"[ERROR] Redis connection failed: {e}")
            return False
            
    def check_automation_trigger(self):
        """Check for Docker automation triggers"""
        try:
            client = redis.Redis(host=self.redis_host, port=self.redis_port, decode_responses=True)
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
    
    async def check_queue_size(self):
        """Check the current queue size"""
        try:
            size = await self.redis_client.zcard(self.queue_key)
            return size
        except Exception as e:
            logger.error(f"[ERROR] Failed to check queue size: {e}")
            return 0
    
    def update_worker_status(self, status, metadata=None):
        """Update worker status in Redis"""
        try:
            client = redis.Redis(host=self.redis_host, port=self.redis_port, decode_responses=True)
            status_data = {
                'status': status,
                'timestamp': datetime.now().isoformat(),
                'pid': os.getpid()
            }
            if metadata:
                status_data.update(metadata)
                
            client.hset(self.worker_status_key, mapping=status_data)
            logger.info(f"[STATUS] Worker status updated: {status}")
        except Exception as e:
            logger.error(f"[ERROR] Failed to update worker status: {e}")
    
    async def run_main_enhanced(self):
        """Run main_enhanced.py subprocess"""
        logger.info("[LAUNCH] Starting main_enhanced.py queue processing...")
        
        try:
            # Update status
            self.update_worker_status('processing', {
                'processing_started': datetime.now().isoformat()
            })
            
            # Run main_enhanced.py
            process = await asyncio.create_subprocess_exec(
                sys.executable, str(self.main_enhanced_path),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.project_root)
            )
            
            # Store process reference
            self.current_process = process
            self.last_processing_time = datetime.now()
            
            # Wait for completion with timeout
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(), 
                    timeout=300  # 5 minute timeout
                )
                
                exit_code = process.returncode
                
                # Decode output
                stdout_text = stdout.decode('utf-8', errors='replace') if stdout else ""
                stderr_text = stderr.decode('utf-8', errors='replace') if stderr else ""
                
                if exit_code == 0:
                    logger.info("[SUCCESS] main_enhanced.py completed successfully")
                    self.update_worker_status('ready', {
                        'last_success': datetime.now().isoformat(),
                        'processing_duration': (datetime.now() - self.last_processing_time).total_seconds()
                    })
                    return True
                else:
                    logger.error(f"[ERROR] Process failed with exit code {exit_code}")
                    if stderr_text:
                        logger.error(f"[ERROR] Error output: {stderr_text[:1000]}...")  # Truncate long errors
                    self.update_worker_status('error', {
                        'error': f"Exit code {exit_code}",
                        'last_error': datetime.now().isoformat()
                    })
                    return False
                    
            except asyncio.TimeoutError:
                logger.error("[ERROR] main_enhanced.py timeout after 5 minutes")
                process.kill()
                await process.wait()
                self.update_worker_status('timeout', {
                    'timeout_at': datetime.now().isoformat()
                })
                return False
                
        except Exception as e:
            logger.error(f"[ERROR] Failed to run main_enhanced.py: {e}")
            self.update_worker_status('error', {
                'error': str(e),
                'last_error': datetime.now().isoformat()
            })
            return False
        finally:
            self.current_process = None
    
    async def monitor_and_process(self):
        """Main monitoring loop"""
        logger.info("[MONITOR] Starting automated queue monitoring...")
        consecutive_failures = 0
        max_failures = 5
        
        while self.running:
            try:
                # Check for automation triggers from Docker services
                trigger_received = self.check_automation_trigger()
                
                # Check queue size
                queue_size = await self.check_queue_size()
                
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
                    success = await self.run_main_enhanced()
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
                
                # Regular check interval
                await asyncio.sleep(self.check_interval)
                
            except Exception as e:
                logger.error(f"[ERROR] Error in monitoring loop: {e}")
                consecutive_failures += 1
                await asyncio.sleep(self.check_interval * 2)
    
    async def run(self):
        """Run the automated processor"""
        logger.info("[ROBOT] Starting AVAI Automated Queue Processor...")
        
        # Connect to Redis
        if not await self.connect_redis():
            logger.error("[ERROR] Cannot start without Redis connection")
            return
        
        # Update initial status
        self.update_worker_status('ready', {
            'started_at': datetime.now().isoformat(),
            'check_interval': self.check_interval
        })
        
        # Run the monitoring loop
        try:
            await self.monitor_and_process()
        except KeyboardInterrupt:
            logger.info("[STOP] Shutting down due to keyboard interrupt...")
        except Exception as e:
            logger.error(f"[ERROR] Unexpected error: {e}")
            logger.error(traceback.format_exc())
        finally:
            await self.cleanup()
    
    async def cleanup(self):
        """Cleanup resources"""
        logger.info("[CLEANUP] Cleaning up automated processor...")
        self.running = False
        
        # Kill any running process
        if self.current_process and self.current_process.returncode is None:
            try:
                self.current_process.kill()
                await self.current_process.wait()
                logger.info("[CLEANUP] Terminated running subprocess")
            except Exception as e:
                logger.error(f"[ERROR] Failed to terminate subprocess: {e}")
        
        # Update final status
        self.update_worker_status('stopped', {
            'stopped_at': datetime.now().isoformat()
        })
        
        # Close Redis connection
        if self.redis_client:
            await self.redis_client.close()
            logger.info("[CLEANUP] Redis connection closed")
        
        logger.info("[CLEANUP] Automated processor cleanup complete")

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"[SIGNAL] Received signal {signum}, shutting down...")
    sys.exit(0)

async def main():
    """Main function"""
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and run processor
    processor = AutomatedQueueProcessor()
    await processor.run()

if __name__ == "__main__":
    asyncio.run(main())
