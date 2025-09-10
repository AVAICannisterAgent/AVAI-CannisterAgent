#!/usr/bin/env python3
"""
AVAI Service Manager - Ensures Automated Processing
Monitors and maintains automated queue processing
"""

import subprocess
import time
import json
import redis
import signal
import sys
import threading
from datetime import datetime

class AVAIServiceManager:
    def __init__(self):
        self.redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)
        self.automation_process = None
        self.running = True
        self.check_interval = 30  # Check every 30 seconds
        
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print(f"🛑 Service manager shutting down (signal {signum})")
        self.running = False
        if self.automation_process:
            self.automation_process.terminate()
        sys.exit(0)
        
    def start_automation(self):
        """Start the automated queue processor"""
        try:
            if self.automation_process and self.automation_process.poll() is None:
                print("✅ Automation already running")
                return True
                
            print("🚀 Starting automated queue processor...")
            self.automation_process = subprocess.Popen(
                ['python', '/app/automated_queue_processor.py'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd='/app'
            )
            
            # Give it a moment to start
            time.sleep(2)
            
            if self.automation_process.poll() is None:
                print("✅ Automated processor started successfully")
                return True
            else:
                print("❌ Automated processor failed to start")
                return False
                
        except Exception as e:
            print(f"❌ Error starting automation: {e}")
            return False
            
    def check_automation_health(self):
        """Check if automation is running and processing messages"""
        try:
            # Check if process is still running
            if not self.automation_process or self.automation_process.poll() is not None:
                print("⚠️ Automation process not running, restarting...")
                return self.start_automation()
                
            # Check if queue is being processed
            queue_size = self.redis_client.zcard('avai:prompt_queue')
            
            if queue_size > 0:
                print(f"📋 Queue has {queue_size} items - automation should be processing")
                
                # Check worker status
                worker_status = self.redis_client.get('avai:worker:status')
                if worker_status:
                    status_data = json.loads(worker_status)
                    last_processed = status_data.get('last_processed', '')
                    processor = status_data.get('processor', '')
                    
                    if processor == 'automated':
                        print(f"✅ Automated processor active (last: {last_processed})")
                        return True
                    else:
                        print(f"⚠️ Different processor active: {processor}")
                        
            return True
            
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
            
    def monitor_queue(self):
        """Monitor queue and ensure processing happens"""
        print("👁️ Starting queue monitoring...")
        
        while self.running:
            try:
                # Ensure automation is healthy
                self.check_automation_health()
                
                # Check for stuck messages
                queue_size = self.redis_client.zcard('avai:prompt_queue')
                if queue_size > 0:
                    print(f"📋 Queue status: {queue_size} items pending")
                    
                    # If queue has been stuck for too long, restart automation
                    worker_status = self.redis_client.get('avai:worker:status')
                    if worker_status:
                        status_data = json.loads(worker_status)
                        last_processed = status_data.get('last_processed', '')
                        
                        if last_processed:
                            from datetime import datetime
                            try:
                                last_time = datetime.fromisoformat(last_processed.replace('Z', '+00:00'))
                                now = datetime.now().astimezone()
                                
                                if (now - last_time).total_seconds() > 300:  # 5 minutes
                                    print("⚠️ Queue stuck for >5 minutes, restarting automation...")
                                    self.restart_automation()
                            except:
                                pass
                
                time.sleep(self.check_interval)
                
            except Exception as e:
                print(f"❌ Monitor error: {e}")
                time.sleep(self.check_interval)
                
    def restart_automation(self):
        """Restart the automated processor"""
        try:
            if self.automation_process:
                print("🔄 Stopping existing automation...")
                self.automation_process.terminate()
                self.automation_process.wait(timeout=10)
        except:
            pass
            
        return self.start_automation()
        
    def run(self):
        """Run the service manager"""
        print("🤖 AVAI Service Manager starting...")
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Start automation
        if not self.start_automation():
            print("❌ Failed to start automation")
            return
            
        # Update status
        status_data = {
            'service_manager': 'active',
            'started': datetime.now().isoformat(),
            'automation_pid': self.automation_process.pid if self.automation_process else None
        }
        self.redis_client.set('avai:service_manager:status', json.dumps(status_data), ex=300)
        
        # Start monitoring
        try:
            self.monitor_queue()
        except KeyboardInterrupt:
            print("🛑 Keyboard interrupt received")
        except Exception as e:
            print(f"❌ Service manager error: {e}")
        finally:
            self.signal_handler(signal.SIGTERM, None)

if __name__ == '__main__':
    manager = AVAIServiceManager()
    manager.run()
