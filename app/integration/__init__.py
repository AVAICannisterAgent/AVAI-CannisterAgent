"""
AVAI Canister Integration Module
Provides integration between AVAI agents and Internet Computer canisters
"""

from .canister_integration import CanisterIntegration, CanisterManager
from .redis_canister_bridge import RedisCanisterBridge

__all__ = ['CanisterIntegration', 'CanisterManager', 'RedisCanisterBridge']
