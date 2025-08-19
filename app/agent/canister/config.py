"""
Configuration and constants for Internet Computer canister analysis.

Contains all IC-specific patterns, file types, keywords, and analysis configuration.
"""

from typing import Dict, List, Any
from dataclasses import dataclass


@dataclass
class CanisterConfig:
    """Configuration class for canister analysis patterns and settings."""
    
    # File extensions related to IC development
    FILE_EXTENSIONS = [
        ".mo",      # Motoko source files
        ".rs",      # Rust source files  
        ".did",     # Candid interface files
        ".toml",    # Cargo.toml, vessel.dhall
        ".dhall",   # Vessel package manager
        ".json",    # dfx.json, canister_ids.json
        ".wasm",    # WebAssembly files
        ".js",      # JavaScript for frontend
        ".ts",      # TypeScript for frontend
    ]
    
    # Key files that indicate IC projects
    KEY_FILES = [
        "dfx.json",
        "vessel.dhall", 
        "Cargo.toml",
        "canister_ids.json",
        ".vessel",
        "src/main.mo",
        "src/lib.rs", 
        "src/main.rs",
        ".ic-commit",
        "candid/",
        "declarations/",
        ".dfx/",
        "package-set.dhall"
    ]
    
    # Directories that indicate IC project structure
    DIRECTORIES = [
        "src/",
        "canisters/", 
        ".vessel/",
        ".dfx/",
        "frontend/",
        "backend/",
        "motoko/",
        "rust/",
        "candid/",
        "declarations/",
        "assets/",
        "dist/",
        "node_modules/",
        "target/"
    ]
    
    # IC-related keywords to search for
    IC_KEYWORDS = [
        "dfinity",
        "internet computer", 
        "canister",
        "motoko",
        "principal",
        "cycles",
        "IC",
        "icp",
        "dfx",
        "candid",
        "agent-js",
        "ic-cdk",
        "actor",
        "query",
        "update",
        "stable",
        "heartbeat",
        "timer",
        "init",
        "pre_upgrade",
        "post_upgrade"
    ]
    
    # Directory names that suggest IC development
    IC_DIRECTORY_NAMES = [
        "motoko",
        "rust", 
        "canister",
        "canisters",
        "ic",
        "dfx",
        "backend",
        "frontend", 
        "wasm",
        "assets",
        "declarations",
        "candid"
    ]
    
    # Security patterns to check for in IC code
    SECURITY_PATTERNS = [
        "caller()",              # Authentication patterns
        "is_controller",         # Controller checks
        "assert!",              # Rust assertions
        "trap",                 # Motoko error handling
        "Principal.isAnonymous", # Anonymous caller checks
        "cycles.available",      # Cycles management
        "stable var",           # Stable storage
        "upgrade",              # Upgrade hooks
        "init",                 # Initialization hooks
        "heartbeat",            # Timer functions
        "ic.time()",            # Time functions
        "caller_validation",     # Custom validation
        "access_control"        # Access control patterns
    ]
    
    # Common vulnerabilities to check for
    VULNERABILITY_PATTERNS = [
        "unwrap()",             # Unsafe unwrapping
        "expect(",             # Unsafe error handling
        "panic!",              # Unsafe panics
        "unreachable!",        # Unreachable code
        "unsafe",              # Unsafe Rust blocks
        "transmute",           # Unsafe transmutation
        "clone()",             # Inefficient cloning
        "String::from",        # Inefficient string ops
        "Vec::new",            # Inefficient allocations
        "HashMap::new"         # Inefficient collections
    ]
    
    # DFX configuration validation patterns
    DFX_CONFIG_PATTERNS = [
        "canisters",           # Canister definitions
        "networks",            # Network configurations
        "version",             # DFX version
        "type",               # Canister type
        "main",               # Main file path
        "dependencies",        # Canister dependencies
        "build",              # Build commands
        "post_install",       # Post-install hooks
        "wasm",               # WASM configuration
        "candid"              # Candid interface
    ]
    
    # Performance optimization patterns
    PERFORMANCE_PATTERNS = [
        "stable memory",       # Stable memory usage
        "memory.grow",         # Memory management
        "cycles.accept",       # Cycles handling
        "instruction_counter", # Instruction counting
        "performance_counter", # Performance monitoring
        "heap_size",          # Memory optimization
        "batch_processing",    # Batch operations
        "async/await",        # Asynchronous patterns
        "inter_canister",     # Inter-canister calls
        "heartbeat_interval"   # Timer optimization
    ]
    
    # Testing patterns to identify
    TESTING_PATTERNS = [
        "test",               # Test functions
        "spec",              # Spec files
        "_test.mo",          # Motoko test files
        "_test.rs",          # Rust test files
        "test_",             # Test prefixes
        "assert_eq!",        # Rust assertions
        "assert",            # General assertions
        "debug_print",       # Debug statements
        "pocket-ic",         # Pocket IC testing
        "replica",           # Local replica testing
        "dfx start",         # Local development
        "dfx deploy"         # Deployment testing
    ]
    
    # Analysis timeout and limits
    ANALYSIS_LIMITS = {
        "max_files_to_analyze": 50,
        "max_directory_depth": 5,
        "analysis_timeout_seconds": 120,
        "file_size_limit_mb": 10,
        "max_security_findings": 20,
        "min_todo_compliance_score": 70
    }
    
    # Professional audit requirements
    AUDIT_REQUIREMENTS = {
        "min_analysis_duration": 45,  # seconds
        "min_report_length": 3000,    # characters
        "required_phases": 6,         # TODO phases
        "min_compliance_score": 70,   # out of 100
        "min_security_findings": 3,   # minimum findings
        "min_files_analyzed": 3       # minimum file count
    }
    
    @classmethod
    def get_pattern_dict(cls) -> Dict[str, List[str]]:
        """Get all patterns as a dictionary for easy access."""
        return {
            "file_extensions": cls.FILE_EXTENSIONS,
            "key_files": cls.KEY_FILES,
            "directories": cls.DIRECTORIES,
            "ic_keywords": cls.IC_KEYWORDS,
            "ic_directory_names": cls.IC_DIRECTORY_NAMES,
            "security_patterns": cls.SECURITY_PATTERNS,
            "vulnerability_patterns": cls.VULNERABILITY_PATTERNS,
            "dfx_config_patterns": cls.DFX_CONFIG_PATTERNS,
            "performance_patterns": cls.PERFORMANCE_PATTERNS,
            "testing_patterns": cls.TESTING_PATTERNS
        }
    
    @classmethod
    def is_ic_file(cls, filename: str) -> bool:
        """Check if a filename indicates an IC-related file."""
        filename_lower = filename.lower()
        
        # Check extensions
        for ext in cls.FILE_EXTENSIONS:
            if filename_lower.endswith(ext):
                return True
                
        # Check specific filenames
        for key_file in cls.KEY_FILES:
            if key_file.lower() in filename_lower:
                return True
                
        return False
    
    @classmethod  
    def is_ic_directory(cls, dirname: str) -> bool:
        """Check if a directory name indicates IC-related content."""
        dirname_lower = dirname.lower()
        
        for ic_dir in cls.IC_DIRECTORY_NAMES:
            if ic_dir in dirname_lower:
                return True
                
        return False
    
    @classmethod
    def get_file_type(cls, filename: str) -> str:
        """Determine the type of an IC file."""
        filename_lower = filename.lower()
        
        if filename_lower == "dfx.json":
            return "dfx_config"
        elif filename_lower == "cargo.toml":
            return "rust_config"
        elif filename_lower == "vessel.dhall":
            return "vessel_config" 
        elif filename_lower == "canister_ids.json":
            return "canister_ids"
        elif filename_lower.endswith(".mo"):
            return "motoko_source"
        elif filename_lower.endswith(".rs"):
            return "rust_source"
        elif filename_lower.endswith(".did"):
            return "candid_interface"
        elif filename_lower.endswith(".wasm"):
            return "wasm_binary"
        elif filename_lower.endswith((".js", ".ts")):
            return "frontend_source"
        else:
            return "unknown"


# Global instance for easy access
canister_config = CanisterConfig()
