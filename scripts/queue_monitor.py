#!/usr/bin/env python3
"""
Queue Monitor - Monitors Redis queue health and provides metrics
"""

import redis
import json
import time
import os
import sys
from datetime import datetime

class QueueMonitor:
    def __init__(self):
        self.redis_host = os.getenv('REDIS_HOST', 'redis')
        self.redis_port = int(os.getenv('REDIS_PORT', 6379))
        self.monitor_interval = int(os.getenv('MONITOR_INTERVAL', 60))
        
        try:
            self.redis_client = redis.Redis(
                host=self.redis_host, 
                port=self.redis_port, 
                decode_responses=True
            )
            self.redis_client.ping()
            print(f"✅ Connected to Redis at {self.redis_host}:{self.redis_port}")
        except Exception as e:
            print(f"❌ Failed to connect to Redis: {e}")
            sys.exit(1)
    
    def get_queue_metrics(self):
        """Get comprehensive queue metrics"""
        try:
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'queue_length': self.redis_client.llen('avai:prompt_queue'),
                'latest_response_exists': self.redis_client.exists('avai:latest_response'),
                'processor_stats': self.redis_client.hgetall('avai:processor_stats'),
                'redis_info': {
                    'used_memory_human': self.redis_client.info('memory')['used_memory_human'],
                    'connected_clients': self.redis_client.info('clients')['connected_clients'],
                    'total_commands_processed': self.redis_client.info('stats')['total_commands_processed']
                }
            }
            return metrics
        except Exception as e:
            print(f"❌ Error getting metrics: {e}")
            return None
    
    def monitor_loop(self):
        """Main monitoring loop"""
        print(f"🔍 Starting queue monitor (interval: {self.monitor_interval}s)")
        
        while True:
            try:
                metrics = self.get_queue_metrics()
                if metrics:
                    # Store metrics in Redis
                    self.redis_client.lpush('avai:monitor_metrics', json.dumps(metrics))
                    # Keep only last 100 metrics
                    self.redis_client.ltrim('avai:monitor_metrics', 0, 99)
                    
                    # Log summary
                    queue_len = metrics['queue_length']
                    memory_usage = metrics['redis_info']['used_memory_human']
                    clients = metrics['redis_info']['connected_clients']
                    
                    print(f"📊 Queue: {queue_len} items | Memory: {memory_usage} | Clients: {clients}")
                    
                    # Alert on high queue length
                    if queue_len > 10:
                        print(f"⚠️ High queue length detected: {queue_len} items")
                
                time.sleep(self.monitor_interval)
                
            except KeyboardInterrupt:
                print("\n⏹️ Stopping monitor...")
                break
            except Exception as e:
                print(f"❌ Monitor error: {e}")
                time.sleep(30)

if __name__ == "__main__":
    monitor = QueueMonitor()
    monitor.monitor_loop()
