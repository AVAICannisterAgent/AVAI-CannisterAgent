"""
Canister Integration for AVAI System
Manages Internet Computer canister operations and integration
"""

import asyncio
import json
import logging
import subprocess
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

class CanisterManager:
    """Manages IC canister operations for AVAI"""
    
    def __init__(self, dfx_json_path: Optional[str] = None):
        self.dfx_json_path = dfx_json_path or "dfx.json"
        self.canisters = {}
        self.network = "local"  # Default to local development
        
    async def initialize(self):
        """Initialize canister manager"""
        try:
            logger.info("🔧 Initializing Canister Manager...")
            await self._load_dfx_config()
            logger.info("✅ Canister Manager initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Canister Manager: {e}")
            return False
    
    async def _load_dfx_config(self):
        """Load DFX configuration"""
        try:
            if Path(self.dfx_json_path).exists():
                with open(self.dfx_json_path, 'r') as f:
                    config = json.load(f)
                    self.canisters = config.get('canisters', {})
                    logger.info(f"📋 Loaded {len(self.canisters)} canister configurations")
            else:
                logger.warning(f"⚠️ DFX config file not found: {self.dfx_json_path}")
                
        except Exception as e:
            logger.error(f"❌ Error loading DFX config: {e}")
    
    async def deploy_canister(self, deploy_request: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy a canister to the IC"""
        try:
            canister_name = deploy_request.get('canister_name')
            network = deploy_request.get('network', self.network)
            
            logger.info(f"🚀 Deploying canister: {canister_name} to {network}")
            
            # Build the deployment command
            cmd = ['dfx', 'deploy', canister_name, '--network', network]
            
            # Execute deployment
            result = await self._run_dfx_command(cmd)
            
            if result['success']:
                logger.info(f"✅ Successfully deployed canister: {canister_name}")
                return {
                    'success': True,
                    'canister_name': canister_name,
                    'network': network,
                    'output': result['output']
                }
            else:
                logger.error(f"❌ Failed to deploy canister: {canister_name}")
                return {
                    'success': False,
                    'error': result['error'],
                    'canister_name': canister_name
                }
                
        except Exception as e:
            logger.error(f"❌ Error deploying canister: {e}")
            return {'success': False, 'error': str(e)}
    
    async def query_canister(self, query_request: Dict[str, Any]) -> Dict[str, Any]:
        """Query a canister method"""
        try:
            canister_name = query_request.get('canister_name')
            method = query_request.get('method')
            args = query_request.get('args', [])
            network = query_request.get('network', self.network)
            
            logger.info(f"🔍 Querying canister: {canister_name}.{method}")
            
            # Build the query command
            cmd = ['dfx', 'canister', 'call', canister_name, method, '--network', network]
            
            if args:
                cmd.extend(['--args'] + args)
            
            # Execute query
            result = await self._run_dfx_command(cmd)
            
            if result['success']:
                logger.info(f"✅ Successfully queried canister: {canister_name}.{method}")
                return {
                    'success': True,
                    'canister_name': canister_name,
                    'method': method,
                    'result': result['output']
                }
            else:
                logger.error(f"❌ Failed to query canister: {canister_name}.{method}")
                return {
                    'success': False,
                    'error': result['error'],
                    'canister_name': canister_name,
                    'method': method
                }
                
        except Exception as e:
            logger.error(f"❌ Error querying canister: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _run_dfx_command(self, cmd: List[str]) -> Dict[str, Any]:
        """Run a DFX command and return result"""
        try:
            logger.debug(f"🔧 Running command: {' '.join(cmd)}")
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                return {
                    'success': True,
                    'output': stdout.decode('utf-8').strip(),
                    'error': None
                }
            else:
                return {
                    'success': False,
                    'output': None,
                    'error': stderr.decode('utf-8').strip()
                }
                
        except Exception as e:
            logger.error(f"❌ Error running DFX command: {e}")
            return {
                'success': False,
                'output': None,
                'error': str(e)
            }

class CanisterIntegration:
    """Main integration class for AVAI-Canister operations"""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client
        self.canister_manager = CanisterManager()
        self.bridge = None
        
    async def initialize(self):
        """Initialize canister integration"""
        try:
            logger.info("🔧 Initializing AVAI Canister Integration...")
            
            # Initialize canister manager
            await self.canister_manager.initialize()
            
            # Initialize Redis-Canister bridge if Redis is available
            if self.redis_client:
                from .redis_canister_bridge import RedisCanisterBridge
                self.bridge = RedisCanisterBridge(self.redis_client, self.canister_manager)
                await self.bridge.start_bridge()
            
            logger.info("✅ AVAI Canister Integration initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Canister Integration: {e}")
            return False
    
    async def deploy_avai_canisters(self, network: str = "local") -> Dict[str, Any]:
        """Deploy all AVAI canisters"""
        try:
            logger.info(f"🚀 Deploying AVAI canisters to {network}...")
            
            results = {}
            
            # Deploy main AVAI canister
            main_result = await self.canister_manager.deploy_canister({
                'canister_name': 'avai_main',
                'network': network
            })
            results['avai_main'] = main_result
            
            # Deploy analyzer canister
            analyzer_result = await self.canister_manager.deploy_canister({
                'canister_name': 'avai_analyzer',
                'network': network
            })
            results['avai_analyzer'] = analyzer_result
            
            # Deploy report generator canister
            report_result = await self.canister_manager.deploy_canister({
                'canister_name': 'avai_report_generator',
                'network': network
            })
            results['avai_report_generator'] = report_result
            
            # Deploy audit engine canister
            audit_result = await self.canister_manager.deploy_canister({
                'canister_name': 'avai_audit_engine',
                'network': network
            })
            results['avai_audit_engine'] = audit_result
            
            success_count = sum(1 for r in results.values() if r.get('success'))
            total_count = len(results)
            
            logger.info(f"✅ Deployed {success_count}/{total_count} AVAI canisters successfully")
            
            return {
                'success': success_count == total_count,
                'deployed': success_count,
                'total': total_count,
                'results': results
            }
            
        except Exception as e:
            logger.error(f"❌ Error deploying AVAI canisters: {e}")
            return {'success': False, 'error': str(e)}
    
    async def process_avai_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Process an AVAI request through canisters"""
        try:
            request_type = request.get('type')
            
            if request_type == 'analyze':
                return await self._process_analysis_request(request)
            elif request_type == 'audit':
                return await self._process_audit_request(request)
            elif request_type == 'report':
                return await self._process_report_request(request)
            else:
                return {'success': False, 'error': f'Unknown request type: {request_type}'}
                
        except Exception as e:
            logger.error(f"❌ Error processing AVAI request: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _process_analysis_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Process analysis request through analyzer canister"""
        try:
            data = request.get('data', {})
            
            result = await self.canister_manager.query_canister({
                'canister_name': 'avai_analyzer',
                'method': 'analyze',
                'args': [json.dumps(data)]
            })
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error processing analysis request: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _process_audit_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Process audit request through audit engine canister"""
        try:
            data = request.get('data', {})
            
            result = await self.canister_manager.query_canister({
                'canister_name': 'avai_audit_engine',
                'method': 'audit',
                'args': [json.dumps(data)]
            })
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error processing audit request: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _process_report_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Process report request through report generator canister"""
        try:
            data = request.get('data', {})
            
            result = await self.canister_manager.query_canister({
                'canister_name': 'avai_report_generator',
                'method': 'generate_report',
                'args': [json.dumps(data)]
            })
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error processing report request: {e}")
            return {'success': False, 'error': str(e)}
    
    async def cleanup(self):
        """Cleanup canister integration"""
        try:
            logger.info("🧹 Cleaning up Canister Integration...")
            
            if self.bridge:
                await self.bridge.stop_bridge()
            
            logger.info("✅ Canister Integration cleanup complete")
            
        except Exception as e:
            logger.error(f"❌ Error during cleanup: {e}")
