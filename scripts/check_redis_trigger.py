#!/usr/bin/env python3
"""
Redis Trigger Checker
Checks Redis for automation trigger signals from Docker containers
"""

import redis
import sys
import os
import json
import time
from datetime import datetime, timedelta

def check_redis_trigger():
    """Check Redis for automation trigger signals"""
    try:
        # Connect to Redis
        redis_client = redis.Redis(
            host='localhost',  # Host Redis (not container)
            port=6379,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5
        )
        
        # Test connection
        redis_client.ping()
        
        # Check for automation trigger
        trigger = redis_client.get('avai:automation:trigger')
        
        if trigger:
            # Parse trigger data
            try:
                trigger_data = json.loads(trigger)
                action = trigger_data.get('action', '').upper()
                timestamp = trigger_data.get('timestamp', '')
                source = trigger_data.get('source', 'unknown')
                
                # Check if trigger is recent (within last 5 minutes)
                if timestamp:
                    trigger_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    if datetime.now() - trigger_time.replace(tzinfo=None) > timedelta(minutes=5):
                        # Trigger is too old, ignore it
                        redis_client.delete('avai:automation:trigger')
                        return None
                
                # Clear the trigger after reading
                redis_client.delete('avai:automation:trigger')
                
                # Log the trigger
                log_entry = {
                    'timestamp': datetime.now().isoformat(),
                    'action': action,
                    'source': source,
                    'original_timestamp': timestamp
                }
                
                redis_client.lpush('avai:automation:log', json.dumps(log_entry))
                redis_client.ltrim('avai:automation:log', 0, 99)  # Keep last 100 entries
                
                # Return the action for PowerShell script
                if action in ['START_WORKER', 'STOP_WORKER', 'RESTART_WORKER']:
                    print(action)
                    return action
                    
            except (json.JSONDecodeError, ValueError) as e:
                # Invalid trigger format, delete it
                redis_client.delete('avai:automation:trigger')
                return None
        
        # No trigger found
        return None
        
    except redis.ConnectionError:
        # Redis not available
        return None
    except Exception as e:
        # Other error
        return None

def set_worker_status(status, pid=None):
    """Set worker status in Redis for monitoring"""
    try:
        redis_client = redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5
        )
        
        status_data = {
            'status': status,
            'timestamp': datetime.now().isoformat(),
            'pid': pid,
            'host': 'windows_host'
        }
        
        redis_client.set('avai:worker:status', json.dumps(status_data), ex=300)  # Expire in 5 minutes
        
    except Exception:
        pass  # Fail silently for status updates

if __name__ == '__main__':
    # Check for command line arguments
    if len(sys.argv) > 1:
        action = sys.argv[1].lower()
        if action == 'set-status':
            status = sys.argv[2] if len(sys.argv) > 2 else 'unknown'
            pid = sys.argv[3] if len(sys.argv) > 3 else None
            set_worker_status(status, pid)
            sys.exit(0)
    
    # Default: check for triggers
    result = check_redis_trigger()
    if result:
        sys.exit(0)  # Success with trigger
    else:
        sys.exit(1)  # No trigger or error
