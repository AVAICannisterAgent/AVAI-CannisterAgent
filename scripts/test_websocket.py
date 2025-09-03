"""
WebSocket Test Client for AVAI Redis Infrastructure
==================================================

Tests WebSocket connections for real-time metrics streaming.
"""

import asyncio
import json
import time
import websockets
import ssl
from typing import Optional
import argparse


class WebSocketTester:
    """WebSocket connection tester for AVAI infrastructure."""
    
    def __init__(self, base_url: str, use_ssl: bool = False):
        self.base_url = base_url
        self.use_ssl = use_ssl
        self.protocol = "wss" if use_ssl else "ws"
        
    async def test_metrics_stream(self, duration: int = 30):
        """Test real-time metrics WebSocket stream."""
        url = f"{self.protocol}://{self.base_url}/ws/metrics"
        
        print(f"🔌 Connecting to metrics stream: {url}")
        
        try:
            # Configure SSL context for secure connections
            ssl_context = None
            if self.use_ssl:
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
            
            async with websockets.connect(url, ssl=ssl_context) as websocket:
                print("✅ WebSocket connection established!")
                print(f"📊 Listening for metrics (duration: {duration}s)...")
                print("-" * 50)
                
                start_time = time.time()
                message_count = 0
                
                while time.time() - start_time < duration:
                    try:
                        # Wait for message with timeout
                        message = await asyncio.wait_for(
                            websocket.recv(), 
                            timeout=5.0
                        )
                        
                        # Parse and display message
                        try:
                            data = json.loads(message)
                            message_count += 1
                            
                            timestamp = data.get('timestamp', 'N/A')
                            metric_type = data.get('type', 'unknown')
                            
                            print(f"📈 [{message_count}] {timestamp} - {metric_type}")
                            
                            # Display key metrics
                            if 'metrics' in data:
                                metrics = data['metrics']
                                if 'system' in metrics:
                                    sys_metrics = metrics['system']
                                    cpu = sys_metrics.get('cpu_percent', 'N/A')
                                    memory = sys_metrics.get('memory_percent', 'N/A')
                                    print(f"    💻 CPU: {cpu}% | 🧠 Memory: {memory}%")
                                
                                if 'redis' in metrics:
                                    redis_metrics = metrics['redis']
                                    connections = redis_metrics.get('connected_clients', 'N/A')
                                    ops = redis_metrics.get('instantaneous_ops_per_sec', 'N/A')
                                    print(f"    🔴 Redis - Connections: {connections} | Ops/sec: {ops}")
                            
                        except json.JSONDecodeError:
                            print(f"📝 Raw message: {message[:100]}...")
                        
                    except asyncio.TimeoutError:
                        print("⏳ No message received (timeout)")
                        continue
                    except websockets.exceptions.ConnectionClosed:
                        print("❌ WebSocket connection closed")
                        break
                
                print("-" * 50)
                print(f"✅ Test completed! Received {message_count} messages")
                
        except Exception as e:
            print(f"❌ WebSocket connection failed: {e}")
            return False
        
        return True
    
    async def test_logs_stream(self, duration: int = 20):
        """Test real-time logs WebSocket stream."""
        url = f"{self.protocol}://{self.base_url}/ws/logs"
        
        print(f"🔌 Connecting to logs stream: {url}")
        
        try:
            ssl_context = None
            if self.use_ssl:
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
            
            async with websockets.connect(url, ssl=ssl_context) as websocket:
                print("✅ WebSocket connection established!")
                print(f"📜 Listening for logs (duration: {duration}s)...")
                print("-" * 50)
                
                start_time = time.time()
                log_count = 0
                
                while time.time() - start_time < duration:
                    try:
                        message = await asyncio.wait_for(
                            websocket.recv(), 
                            timeout=3.0
                        )
                        
                        try:
                            data = json.loads(message)
                            log_count += 1
                            
                            level = data.get('level', 'INFO')
                            component = data.get('component', 'unknown')
                            msg = data.get('message', '')[:80]
                            timestamp = data.get('timestamp', 'N/A')
                            
                            level_emoji = {
                                'ERROR': '🔴',
                                'WARN': '🟡', 
                                'WARNING': '🟡',
                                'INFO': '🔵',
                                'DEBUG': '⚪'
                            }.get(level, '📝')
                            
                            print(f"{level_emoji} [{log_count}] {component}: {msg}")
                            
                        except json.JSONDecodeError:
                            print(f"📝 Raw log: {message[:100]}...")
                        
                    except asyncio.TimeoutError:
                        print("⏳ No logs received (timeout)")
                        continue
                    except websockets.exceptions.ConnectionClosed:
                        print("❌ WebSocket connection closed")
                        break
                
                print("-" * 50)
                print(f"✅ Test completed! Received {log_count} log entries")
                
        except Exception as e:
            print(f"❌ WebSocket connection failed: {e}")
            return False
        
        return True
    
    async def send_test_ping(self):
        """Send a test ping to WebSocket."""
        url = f"{self.protocol}://{self.base_url}/ws/metrics"
        
        try:
            ssl_context = None
            if self.use_ssl:
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
            
            async with websockets.connect(url, ssl=ssl_context) as websocket:
                # Send ping
                await websocket.send(json.dumps({"type": "ping", "timestamp": time.time()}))
                print("📤 Ping sent")
                
                # Wait for response
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📥 Response received: {response}")
                
                return True
                
        except Exception as e:
            print(f"❌ Ping test failed: {e}")
            return False


async def main():
    """Main test function."""
    parser = argparse.ArgumentParser(description="WebSocket Test Client for AVAI Infrastructure")
    parser.add_argument("--url", default="localhost:8003", help="Base URL for WebSocket connection")
    parser.add_argument("--ssl", action="store_true", help="Use SSL/WSS connection")
    parser.add_argument("--tunnel", action="store_true", help="Test tunnel URL")
    parser.add_argument("--duration", type=int, default=30, help="Test duration in seconds")
    parser.add_argument("--test", choices=["metrics", "logs", "ping", "all"], default="all", help="Test type")
    
    args = parser.parse_args()
    
    # Set URL based on options
    if args.tunnel:
        base_url = "avai-redis-dashboard.mrarejimmyz.workers.dev.avai.life"
        use_ssl = True
    else:
        base_url = args.url
        use_ssl = args.ssl
    
    print("🧪 AVAI WebSocket Test Suite")
    print("=" * 40)
    print(f"🌐 Target: {base_url}")
    print(f"🔒 SSL: {'Yes' if use_ssl else 'No'}")
    print(f"⏱️ Duration: {args.duration}s")
    print("=" * 40)
    print("")
    
    tester = WebSocketTester(base_url, use_ssl)
    
    success_count = 0
    total_tests = 0
    
    if args.test in ["ping", "all"]:
        print("🏓 Testing WebSocket Ping...")
        total_tests += 1
        if await tester.send_test_ping():
            success_count += 1
        print("")
    
    if args.test in ["metrics", "all"]:
        print("📊 Testing Metrics Stream...")
        total_tests += 1
        if await tester.test_metrics_stream(args.duration):
            success_count += 1
        print("")
    
    if args.test in ["logs", "all"]:
        print("📜 Testing Logs Stream...")
        total_tests += 1
        if await tester.test_logs_stream(args.duration // 2):
            success_count += 1
        print("")
    
    print("=" * 40)
    print(f"🏁 Test Results: {success_count}/{total_tests} passed")
    
    if success_count == total_tests:
        print("✅ All WebSocket tests passed!")
    else:
        print("❌ Some WebSocket tests failed")
    
    return success_count == total_tests


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
