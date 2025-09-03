"""
Cloudflare Tunnel Test Suite for AVAI Redis & WebSocket
======================================================

Tests Redis and WebSocket functionality through Cloudflare tunnel URLs.
"""

import asyncio
import json
import time
import aiohttp
import websockets
import ssl
from typing import Optional, Dict, Any
import argparse


class CloudflareTunnelTester:
    """Test Redis and WebSocket access through Cloudflare tunnel."""
    
    def __init__(self):
        self.base_urls = {
            'dashboard': 'https://avai-redis-dashboard.mrarejimmyz.workers.dev.avai.life',
            'api': 'https://avai-redis-api.mrarejimmyz.workers.dev.avai.life',
            'websocket': 'wss://avai-websocket.mrarejimmyz.workers.dev.avai.life',
            'websocket_http': 'https://avai-websocket.mrarejimmyz.workers.dev.avai.life'
        }
        
        # SSL context for secure connections
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE
    
    async def test_api_health(self) -> bool:
        """Test Redis Analytics API health through tunnel."""
        url = f"{self.base_urls['api']}/health"
        
        print(f"🔗 Testing API health: {url}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, ssl=False) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ API Health: {data}")
                        return True
                    else:
                        print(f"❌ API Health failed: Status {response.status}")
                        return False
        except Exception as e:
            print(f"❌ API Health error: {e}")
            return False
    
    async def test_redis_metrics(self) -> bool:
        """Test Redis metrics through tunnel API."""
        url = f"{self.base_urls['api']}/api/metrics/redis"
        
        print(f"🔗 Testing Redis metrics: {url}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, ssl=False) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ Redis Metrics: {json.dumps(data, indent=2)[:200]}...")
                        return True
                    else:
                        print(f"❌ Redis Metrics failed: Status {response.status}")
                        return False
        except Exception as e:
            print(f"❌ Redis Metrics error: {e}")
            return False
    
    async def test_websocket_health(self) -> bool:
        """Test WebSocket server health through tunnel."""
        url = f"{self.base_urls['websocket_http']}/health"
        
        print(f"🔗 Testing WebSocket health: {url}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, ssl=False) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ WebSocket Health: {data}")
                        return True
                    else:
                        print(f"❌ WebSocket Health failed: Status {response.status}")
                        return False
        except Exception as e:
            print(f"❌ WebSocket Health error: {e}")
            return False
    
    async def test_websocket_connection(self, duration: int = 15) -> bool:
        """Test WebSocket real-time connection through tunnel."""
        ws_url = f"{self.base_urls['websocket']}/ws"
        
        print(f"🔗 Testing WebSocket connection: {ws_url}")
        
        try:
            async with websockets.connect(ws_url, ssl=self.ssl_context) as websocket:
                print("✅ WebSocket connection established through tunnel!")
                
                # Send a test message
                test_message = {
                    "type": "subscribe",
                    "channels": ["redis:metrics", "redis:logs"],
                    "timestamp": time.time()
                }
                
                await websocket.send(json.dumps(test_message))
                print("📤 Subscription message sent")
                
                # Listen for messages
                message_count = 0
                start_time = time.time()
                
                print(f"👂 Listening for messages ({duration}s)...")
                print("-" * 50)
                
                while time.time() - start_time < duration:
                    try:
                        message = await asyncio.wait_for(
                            websocket.recv(), 
                            timeout=3.0
                        )
                        
                        try:
                            data = json.loads(message)
                            message_count += 1
                            
                            msg_type = data.get('type', 'unknown')
                            channel = data.get('channel', 'unknown')
                            timestamp = data.get('timestamp', 'N/A')
                            
                            print(f"📨 [{message_count}] {msg_type} from {channel} at {timestamp}")
                            
                            # Display specific data based on type
                            if msg_type == 'redis_metric':
                                metrics = data.get('data', {})
                                if 'connected_clients' in metrics:
                                    clients = metrics['connected_clients']
                                    ops = metrics.get('instantaneous_ops_per_sec', 0)
                                    print(f"    🔴 Redis: {clients} clients, {ops} ops/sec")
                            
                            elif msg_type == 'system_metric':
                                sys_data = data.get('data', {})
                                cpu = sys_data.get('cpu_percent', 'N/A')
                                memory = sys_data.get('memory_percent', 'N/A')
                                print(f"    💻 System: CPU {cpu}%, Memory {memory}%")
                            
                        except json.JSONDecodeError:
                            print(f"📝 Raw message: {message[:100]}...")
                        
                    except asyncio.TimeoutError:
                        print("⏳ No message (timeout)")
                        continue
                    except websockets.exceptions.ConnectionClosed:
                        print("❌ WebSocket connection closed")
                        break
                
                print("-" * 50)
                print(f"✅ WebSocket test completed! Received {message_count} messages")
                return message_count > 0
                
        except Exception as e:
            print(f"❌ WebSocket connection failed: {e}")
            return False
    
    async def test_redis_publish(self) -> bool:
        """Test publishing to Redis through API."""
        url = f"{self.base_urls['api']}/api/redis/publish"
        
        test_data = {
            "channel": "test:channel",
            "message": {
                "type": "test_message",
                "content": "Hello from Cloudflare tunnel test!",
                "timestamp": time.time()
            }
        }
        
        print(f"🔗 Testing Redis publish: {url}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=test_data, ssl=False) as response:
                    if response.status == 200:
                        result = await response.json()
                        print(f"✅ Redis Publish: {result}")
                        return True
                    else:
                        print(f"❌ Redis Publish failed: Status {response.status}")
                        return False
        except Exception as e:
            print(f"❌ Redis Publish error: {e}")
            return False
    
    async def test_dashboard_access(self) -> bool:
        """Test dashboard access through tunnel."""
        url = self.base_urls['dashboard']
        
        print(f"🔗 Testing Dashboard access: {url}")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, ssl=False) as response:
                    if response.status == 200:
                        content = await response.text()
                        if "AVAI System Dashboard" in content:
                            print("✅ Dashboard accessible and contains expected content")
                            return True
                        else:
                            print("⚠️ Dashboard accessible but content unexpected")
                            return False
                    else:
                        print(f"❌ Dashboard access failed: Status {response.status}")
                        return False
        except Exception as e:
            print(f"❌ Dashboard access error: {e}")
            return False


async def main():
    """Main test function."""
    parser = argparse.ArgumentParser(description="Cloudflare Tunnel Test Suite")
    parser.add_argument("--duration", type=int, default=15, help="WebSocket test duration")
    parser.add_argument("--test", choices=["health", "redis", "websocket", "dashboard", "all"], 
                       default="all", help="Test type")
    
    args = parser.parse_args()
    
    print("🌐 AVAI Cloudflare Tunnel Test Suite")
    print("=" * 50)
    print("🔗 Testing Redis & WebSocket through tunnel URLs")
    print("=" * 50)
    print("")
    
    tester = CloudflareTunnelTester()
    
    tests = []
    
    if args.test in ["health", "all"]:
        tests.extend([
            ("API Health", tester.test_api_health()),
            ("WebSocket Health", tester.test_websocket_health())
        ])
    
    if args.test in ["dashboard", "all"]:
        tests.append(("Dashboard Access", tester.test_dashboard_access()))
    
    if args.test in ["redis", "all"]:
        tests.extend([
            ("Redis Metrics", tester.test_redis_metrics()),
            ("Redis Publish", tester.test_redis_publish())
        ])
    
    if args.test in ["websocket", "all"]:
        tests.append(("WebSocket Connection", tester.test_websocket_connection(args.duration)))
    
    # Run tests
    results = []
    for test_name, test_coro in tests:
        print(f"🧪 Running: {test_name}")
        try:
            result = await test_coro
            results.append((test_name, result))
            print(f"{'✅' if result else '❌'} {test_name}: {'PASS' if result else 'FAIL'}")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
            results.append((test_name, False))
        print("")
    
    # Summary
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print("=" * 50)
    print(f"🏁 Test Results: {passed}/{total} passed")
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} {test_name}")
    
    if passed == total:
        print("\n🎉 All tunnel tests passed! Redis and WebSocket are accessible through Cloudflare.")
    else:
        print(f"\n⚠️ {total - passed} tests failed. Check tunnel configuration and service health.")
    
    return passed == total


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
