"""
AVAI Canister Test Suite
Tests the integration between AVAI agents and Internet Computer canisters
"""

import asyncio
import pytest
import json
from datetime import datetime
from pathlib import Path

# Import the canister integration modules
try:
    from app.integration.canister_integration import CanisterIntegration, CanisterManager
    from app.integration.redis_canister_bridge import RedisCanisterBridge
except ImportError:
    print("⚠️ Canister integration modules not available")
    CanisterIntegration = None
    CanisterManager = None
    RedisCanisterBridge = None

class TestCanisterIntegration:
    """Test suite for canister integration"""
    
    @pytest.fixture
    async def canister_manager(self):
        """Create a canister manager for testing"""
        if CanisterManager is None:
            pytest.skip("CanisterManager not available")
            
        manager = CanisterManager()
        await manager.initialize()
        return manager
    
    @pytest.fixture
    async def canister_integration(self):
        """Create a canister integration for testing"""
        if CanisterIntegration is None:
            pytest.skip("CanisterIntegration not available")
            
        integration = CanisterIntegration()
        await integration.initialize()
        return integration
    
    @pytest.mark.asyncio
    async def test_canister_manager_initialization(self, canister_manager):
        """Test canister manager initialization"""
        assert canister_manager is not None
        assert hasattr(canister_manager, 'canisters')
        assert hasattr(canister_manager, 'network')
    
    @pytest.mark.asyncio
    async def test_canister_integration_initialization(self, canister_integration):
        """Test canister integration initialization"""
        assert canister_integration is not None
        assert hasattr(canister_integration, 'canister_manager')
    
    @pytest.mark.asyncio
    async def test_dfx_config_loading(self, canister_manager):
        """Test DFX configuration loading"""
        # This test checks if dfx.json can be loaded
        dfx_path = Path("dfx.json")
        if dfx_path.exists():
            await canister_manager._load_dfx_config()
            # Should not raise an exception
            assert True
        else:
            pytest.skip("dfx.json not found")
    
    @pytest.mark.asyncio
    async def test_canister_request_processing(self, canister_integration):
        """Test processing different types of canister requests"""
        
        # Test analysis request
        analysis_request = {
            'type': 'analyze',
            'data': {
                'content': 'Test content for analysis',
                'options': {'detailed': True}
            }
        }
        
        result = await canister_integration.process_avai_request(analysis_request)
        assert isinstance(result, dict)
        assert 'success' in result
        
        # Test audit request
        audit_request = {
            'type': 'audit',
            'data': {
                'target': 'test_system',
                'scope': 'security'
            }
        }
        
        result = await canister_integration.process_avai_request(audit_request)
        assert isinstance(result, dict)
        assert 'success' in result
        
        # Test report request
        report_request = {
            'type': 'report',
            'data': {
                'template': 'standard',
                'data': {'key': 'value'}
            }
        }
        
        result = await canister_integration.process_avai_request(report_request)
        assert isinstance(result, dict)
        assert 'success' in result

def test_canister_files_exist():
    """Test that required canister files exist"""
    
    # Check dfx.json
    assert Path("dfx.json").exists(), "dfx.json file is missing"
    
    # Check canister source files
    canister_src = Path("app/agent/canister/src")
    if canister_src.exists():
        assert (canister_src / "main.mo").exists(), "main.mo is missing"
        assert (canister_src / "analyzer.mo").exists(), "analyzer.mo is missing"
        assert (canister_src / "report_generator.mo").exists(), "report_generator.mo is missing"
        assert (canister_src / "audit_engine.mo").exists(), "audit_engine.mo is missing"
    
    # Check build scripts
    scripts_dir = Path("scripts")
    if scripts_dir.exists():
        assert (scripts_dir / "build_canisters.sh").exists(), "build_canisters.sh is missing"
        assert (scripts_dir / "build_canisters.bat").exists(), "build_canisters.bat is missing"
        assert (scripts_dir / "deploy_canisters.sh").exists(), "deploy_canisters.sh is missing"

def test_dfx_json_structure():
    """Test dfx.json has the correct structure"""
    dfx_path = Path("dfx.json")
    if not dfx_path.exists():
        pytest.skip("dfx.json not found")
    
    with open(dfx_path, 'r') as f:
        config = json.load(f)
    
    # Check required sections
    assert 'canisters' in config, "canisters section missing in dfx.json"
    assert 'version' in config, "version missing in dfx.json"
    
    # Check canister configurations
    canisters = config['canisters']
    required_canisters = ['avai_main', 'avai_analyzer', 'avai_report_generator', 'avai_audit_engine']
    
    for canister_name in required_canisters:
        assert canister_name in canisters, f"{canister_name} not found in canisters"
        canister_config = canisters[canister_name]
        assert 'type' in canister_config, f"type missing for {canister_name}"
        assert 'main' in canister_config, f"main missing for {canister_name}"

if __name__ == "__main__":
    print("🧪 Running AVAI Canister Integration Tests...")
    
    # Run basic file existence tests
    try:
        test_canister_files_exist()
        print("✅ Canister files exist")
    except AssertionError as e:
        print(f"❌ File test failed: {e}")
    
    try:
        test_dfx_json_structure()
        print("✅ dfx.json structure is valid")
    except Exception as e:
        print(f"❌ dfx.json test failed: {e}")
    
    # Run async tests if modules are available
    if CanisterIntegration and CanisterManager:
        async def run_async_tests():
            try:
                # Test canister manager
                manager = CanisterManager()
                await manager.initialize()
                print("✅ Canister manager initialization test passed")
                
                # Test canister integration
                integration = CanisterIntegration()
                await integration.initialize()
                print("✅ Canister integration initialization test passed")
                
                # Test request processing
                test_request = {
                    'type': 'analyze',
                    'data': {'test': 'data'}
                }
                result = await integration.process_avai_request(test_request)
                print(f"✅ Request processing test completed: {result.get('success', 'unknown')}")
                
            except Exception as e:
                print(f"❌ Async test failed: {e}")
        
        # Run async tests
        asyncio.run(run_async_tests())
    else:
        print("⚠️ Skipping async tests - modules not available")
    
    print("🎉 Canister integration tests completed!")
