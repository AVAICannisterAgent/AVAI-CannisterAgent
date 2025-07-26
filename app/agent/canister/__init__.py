"""
Canister Agent Module - Modular Internet Computer canister analysis system.

This module provides specialized agents and utilities for analyzing Internet Computer (IC) 
canister projects, including security auditing, code analysis, and deployment validation.
"""

from .core_agent import CanisterAgent
from .browser_navigator import CanisterBrowserNavigator
from .file_analyzer import CanisterFileAnalyzer
from .todo_framework import CanisterTodoFramework
from .report_generator import CanisterReportGenerator
from .security_analyzer import CanisterSecurityAnalyzer
from .config import CanisterConfig

__all__ = [
    'CanisterAgent',
    'CanisterBrowserNavigator', 
    'CanisterFileAnalyzer',
    'CanisterTodoFramework',
    'CanisterReportGenerator',
    'CanisterSecurityAnalyzer',
    'CanisterConfig'
]

__version__ = "2.0.0"
__author__ = "AVAI Development Team"
__description__ = "Modular Internet Computer canister analysis framework"
