#!/usr/bin/env python3
"""
Simple Host Automation Script
Monitors Redis for triggers and automatically starts main.py --redis-only
"""

import redis
import subprocess
import time
import json
import os
import sys
import signal
import logging
from datetime import datetime
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('logs/simple_host_automation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SimpleHostAutomation:
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent
        self.pid_file = self.root_dir / "logs" / "avai_worker.pid"
        self.redis_client = None
        self.worker_process = None
        self.running = True
        
        # Ensure logs directory exists
        os.makedirs(self.root_dir / "logs", exist_ok=True)
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def signal_handler(self, signum, frame):
        logger.info("🛑 Received shutdown signal, stopping automation...")
        self.running = False
        self.stop_worker()
        sys.exit(0)
    
    def connect_redis(self):
        """Connect to Redis"""
        try:
            self.redis_client = redis.Redis(
                host='localhost',
                port=6379,
                decode_responses=True,
                socket_connect_timeout=5
            )
            self.redis_client.ping()
            logger.info("✅ Connected to Redis")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
            return False
    
    def is_worker_running(self):
        """Check if worker is currently running"""
        if not self.worker_process:
            return False
        
        # Check if process is still alive
        poll_result = self.worker_process.poll()
        if poll_result is not None:
            # Process has terminated
            logger.warning(f"⚠️ Worker process terminated with code: {poll_result}")
            self.worker_process = None
            self.cleanup_pid_file()
            return False
        
        return True
    
    def start_worker(self):
        """Start the AVAI worker process"""
        if self.is_worker_running():
            logger.info("ℹ️ Worker is already running")
            return True
        
        try:
            logger.info("🚀 Starting AVAI worker...")
            
            # Change to project directory and start worker
            cmd = [sys.executable, "main.py", "--redis-only"]
            
            self.worker_process = subprocess.Popen(
                cmd,
                cwd=self.root_dir,
                stdout=open(self.root_dir / "logs" / "worker_output.log", "w"),
                stderr=open(self.root_dir / "logs" / "worker_error.log", "w"),
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )
            
            # Save PID
            with open(self.pid_file, 'w') as f:
                f.write(str(self.worker_process.pid))
            
            logger.info(f"✅ Worker started successfully (PID: {self.worker_process.pid})")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to start worker: {e}")
            return False
    
    def stop_worker(self):
        """Stop the AVAI worker process"""
        if not self.worker_process:
            logger.info("ℹ️ No worker process to stop")
            return
        
        try:
            logger.info("🛑 Stopping AVAI worker...")
            
            if os.name == 'nt':
                # Windows
                self.worker_process.terminate()
            else:
                # Unix-like
                os.killpg(os.getpgid(self.worker_process.pid), signal.SIGTERM)
            
            # Wait for process to terminate
            try:
                self.worker_process.wait(timeout=10)
                logger.info("✅ Worker stopped successfully")
            except subprocess.TimeoutExpired:
                logger.warning("⚠️ Worker didn't stop gracefully, forcing...")
                self.worker_process.kill()
                self.worker_process.wait()
                logger.info("✅ Worker force stopped")
            
            self.worker_process = None
            self.cleanup_pid_file()
            
        except Exception as e:
            logger.error(f"❌ Error stopping worker: {e}")
    
    def cleanup_pid_file(self):
        """Remove PID file"""
        try:
            if self.pid_file.exists():
                self.pid_file.unlink()
        except Exception as e:
            logger.error(f"❌ Error removing PID file: {e}")
    
    def check_trigger(self):
        """Check for automation triggers in Redis"""
        try:
            trigger_data = self.redis_client.get('avai:automation:trigger')
            if not trigger_data:
                return None
            
            trigger = json.loads(trigger_data)
            return trigger
            
        except Exception as e:
            logger.error(f"❌ Error checking trigger: {e}")
            return None
    
    def run(self):
        """Main automation loop"""
        logger.info("🚀 Simple Host Automation starting...")
        
        if not self.connect_redis():
            logger.error("❌ Cannot connect to Redis, exiting")
            return
        
        last_trigger_check = ""
        
        while self.running:
            try:
                # Check for triggers
                trigger = self.check_trigger()
                
                if trigger:
                    trigger_str = json.dumps(trigger)
                    
                    # Only process new triggers
                    if trigger_str != last_trigger_check:
                        action = trigger.get('action', '').upper()
                        source = trigger.get('source', 'unknown')
                        
                        logger.info(f"🔔 New trigger received: {action} from {source}")
                        
                        if action in ['START_WORKER', 'RESTART_WORKER']:
                            if action == 'RESTART_WORKER':
                                self.stop_worker()
                                time.sleep(2)  # Give it time to stop
                            
                            self.start_worker()
                        
                        elif action == 'STOP_WORKER':
                            self.stop_worker()
                        
                        last_trigger_check = trigger_str
                
                # Check if worker is still running (health check)
                if not self.is_worker_running():
                    # Check if there are pending messages that need processing
                    try:
                        queue_length = self.redis_client.zcard('avai:prompt_queue')
                        if queue_length > 0:
                            logger.info(f"🔄 Found {queue_length} pending messages, restarting worker...")
                            self.start_worker()
                    except Exception as e:
                        logger.error(f"❌ Error checking queue: {e}")
                
                time.sleep(5)  # Check every 5 seconds
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                logger.error(f"❌ Error in automation loop: {e}")
                time.sleep(10)
        
        logger.info("🛑 Automation stopped")
        self.stop_worker()

if __name__ == "__main__":
    automation = SimpleHostAutomation()
    automation.run()
