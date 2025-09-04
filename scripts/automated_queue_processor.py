#!/usr/bin/env python3
"""
Automated Queue Processor for AVAI
Continuously monitors Redis queue and automatically processes prompts
"""

import asyncio
import json
import os
import sys
import time
import signal
import subprocess
from datetime import datetime
from pathlib import Path
import redis
import logging

# Add the project root to Python path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(PROJECT_ROOT / 'logs' / 'automated_processor.log')
    ]
)
logger = logging.getLogger(__name__)

class AutomatedQueueProcessor:
    """Automated processor that monitors Redis queue and runs main_enhanced.py"""
    
    def __init__(self):
        self.redis_client = None
        self.redis_host = os.getenv('REDIS_HOST', 'localhost')
        self.redis_port = int(os.getenv('REDIS_PORT', '6379'))
        self.check_interval = int(os.getenv('CHECK_INTERVAL', '10'))  # Check every 10 seconds
        self.processing_timeout = int(os.getenv('PROCESSING_TIMEOUT', '300'))  # 5 minutes
        self.running = True
        self.current_process = None
        self.last_process_time = 0
        self.min_process_interval = 5  # Minimum 5 seconds between processes
        
        # Ensure logs directory exists
        (PROJECT_ROOT / 'logs').mkdir(exist_ok=True)
    
    async def connect_redis(self):
        """Connect to Redis"""
        try:
            self.redis_client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            
            # Test connection
            self.redis_client.ping()
            logger.info(f"✅ Connected to Redis at {self.redis_host}:{self.redis_port}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
            return False
    
    def check_queue_status(self):
        """Check Redis queue for pending prompts"""
        try:
            queue_length = self.redis_client.zcard('avai:prompt_queue')
            processing_keys = self.redis_client.keys('avai:processing_prompts:*')
            processing_count = len(processing_keys)
            
            return {
                'queue_length': queue_length,
                'processing_count': processing_count,
                'total_pending': queue_length + processing_count,
                'has_work': queue_length > 0
            }
            
        except Exception as e:
            logger.error(f"❌ Error checking queue status: {e}")
            return None
    
    def check_automation_trigger(self):
        """Check for automation triggers from Docker"""
        try:
            trigger_data = self.redis_client.get('avai:automation:trigger')
            if trigger_data:
                trigger = json.loads(trigger_data)
                action = trigger.get('action', '')
                
                if action in ['START_WORKER', 'RESTART_WORKER']:
                    logger.info(f"🔔 Received automation trigger: {action}")
                    # Clear the trigger
                    self.redis_client.delete('avai:automation:trigger')
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ Error checking automation trigger: {e}")
            return False
    
    def update_worker_status(self, status: str, metadata: dict = None):
        """Update worker status in Redis"""
        try:
            status_data = {
                'status': status,
                'timestamp': datetime.now().isoformat(),
                'pid': os.getpid(),
                'metadata': metadata or {}
            }
            
            self.redis_client.setex(
                'avai:worker:status',
                300,  # 5 minute expiration
                json.dumps(status_data)
            )
            
        except Exception as e:
            logger.error(f"❌ Error updating worker status: {e}")
    
    async def run_main_enhanced(self):
        """Run main_enhanced.py as a subprocess"""
        try:
            # Check rate limiting
            current_time = time.time()
            if current_time - self.last_process_time < self.min_process_interval:
                logger.info(f"⏳ Rate limiting: waiting {self.min_process_interval} seconds between processes")
                return False
            
            if self.current_process and self.current_process.poll() is None:
                logger.warning("⚠️ Process already running, skipping")
                return False
            
            logger.info("🚀 Starting main_enhanced.py queue processing...")
            self.update_worker_status('starting', {'action': 'queue_processing'})
            
            # Prepare the command
            python_executable = sys.executable
            script_path = PROJECT_ROOT / 'main_enhanced.py'
            
            # Start the process
            self.current_process = subprocess.Popen(
                [python_executable, str(script_path), '--queue-only'],
                cwd=PROJECT_ROOT,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            self.update_worker_status('running', {
                'pid': self.current_process.pid,
                'started_at': datetime.now().isoformat()
            })
            
            # Wait for process to complete with timeout
            try:
                stdout, stderr = await asyncio.wait_for(
                    asyncio.to_thread(self.current_process.communicate),
                    timeout=self.processing_timeout
                )
                
                exit_code = self.current_process.returncode
                self.last_process_time = time.time()
                
                if exit_code == 0:
                    logger.info("✅ Queue processing completed successfully")
                    # Log any important output
                    if "Successfully processed" in stdout:
                        success_line = [line for line in stdout.split('\n') if "Successfully processed" in line]
                        if success_line:
                            logger.info(f"📊 {success_line[-1]}")
                    
                    self.update_worker_status('completed', {
                        'exit_code': exit_code,
                        'completed_at': datetime.now().isoformat()
                    })
                    return True
                else:
                    logger.error(f"❌ Process failed with exit code {exit_code}")
                    if stderr:
                        logger.error(f"❌ Error output: {stderr}")
                    
                    self.update_worker_status('failed', {
                        'exit_code': exit_code,
                        'error': stderr,
                        'failed_at': datetime.now().isoformat()
                    })
                    return False
                    
            except asyncio.TimeoutError:
                logger.warning(f"⏰ Process timeout after {self.processing_timeout} seconds, terminating...")
                self.current_process.terminate()
                
                try:
                    await asyncio.wait_for(
                        asyncio.to_thread(self.current_process.wait),
                        timeout=10
                    )
                except asyncio.TimeoutError:
                    logger.warning("🔪 Force killing unresponsive process...")
                    self.current_process.kill()
                
                self.update_worker_status('timeout', {
                    'timeout_after': self.processing_timeout,
                    'terminated_at': datetime.now().isoformat()
                })
                return False
                
        except Exception as e:
            logger.error(f"❌ Error running main_enhanced.py: {e}")
            self.update_worker_status('error', {
                'error': str(e),
                'error_at': datetime.now().isoformat()
            })
            return False
        finally:
            self.current_process = None
    
    async def monitor_and_process(self):
        """Main monitoring loop"""
        logger.info("👁️ Starting automated queue monitoring...")
        
        consecutive_failures = 0
        max_failures = 5
        backoff_time = 10
        
        while self.running:
            try:
                # Check for automation triggers from Docker
                trigger_received = self.check_automation_trigger()
                
                # Check queue status
                status = self.check_queue_status()
                
                if status:
                    should_process = False
                    
                    # Process if triggered or if there's work
                    if trigger_received:
                        logger.info("🔔 Processing due to automation trigger")
                        should_process = True
                    elif status['has_work']:
                        logger.info(f"📋 Found {status['queue_length']} items in queue, processing...")
                        should_process = True
                    
                    if should_process:
                        success = await self.run_main_enhanced()
                        
                        if success:
                            consecutive_failures = 0
                            # After successful processing, check if more work remains
                            new_status = self.check_queue_status()
                            if new_status and new_status['has_work']:
                                logger.info("🔄 More work detected, continuing processing...")
                                continue
                        else:
                            consecutive_failures += 1
                            if consecutive_failures >= max_failures:
                                logger.error(f"❌ {max_failures} consecutive failures, backing off...")
                                await asyncio.sleep(backoff_time * consecutive_failures)
                
                # Regular check interval
                await asyncio.sleep(self.check_interval)
                
            except Exception as e:
                logger.error(f"❌ Error in monitoring loop: {e}")
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
        finally:
            self.running = False
            self.update_worker_status('stopped', {
                'stopped_at': datetime.now().isoformat()
            })
            if self.current_process and self.current_process.poll() is None:
                logger.info("🛑 Terminating active process...")
                self.current_process.terminate()

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info(f"🛑 Received signal {signum}, shutting down...")
    sys.exit(0)

async def main():
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Create and run the automated processor
    processor = AutomatedQueueProcessor()
    await processor.run()

if __name__ == '__main__':
    asyncio.run(main())
